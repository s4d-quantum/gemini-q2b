import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Package, Smartphone, Barcode, CheckCircle2, XCircle, AlertCircle, Clock, PenTool as Tool, Tag, CheckSquare, ClipboardCheck, Truck } from 'lucide-react';
import AddSalesOrderDevices from '../components/AddSalesOrderDevices';
import BookDeviceShipment from '../components/BookDeviceShipment';

interface SalesOrder {
  id: string;
  order_number: string;
  customer: {
    name: string;
    customer_code: string;
  };
  order_date: string;
  status: 'draft' | 'pending' | 'processing' | 'complete' | 'cancelled' | 'confirmed';
  tracking_number?: string;
  shipping_carrier?: string;
  total_boxes?: number;
  total_pallets?: number;
  notes?: string;
}

interface Device {
  id: string;
  cellular_device_id?: string;
  serial_device_id?: string;
  identifier: string;
  manufacturer: string;
  model: string;
  color?: string;
  storage_gb?: number;
  grade?: string;
  type: 'cellular' | 'serial';
  confirmed?: boolean;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  confirmed: 'bg-purple-100 text-purple-800',
};

const SalesOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDevicesModalOpen, setIsAddDevicesModalOpen] = useState(false);
  const [isBookDevicesModalOpen, setIsBookDevicesModalOpen] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [totalBoxes, setTotalBoxes] = useState<number | undefined>(undefined);
  const [totalPallets, setTotalPallets] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'cellular' | 'serial'>('cellular');

  const isFromGoodsOut = location.pathname.startsWith('/goods-out');
  const isDraftOrPending = order?.status === 'draft' || order?.status === 'pending';
  const readOnlyMode = !isFromGoodsOut && isDraftOrPending;

  useEffect(() => {
    if (id) {
      loadSalesOrder();
      loadDevices();
    }
  }, [id]);

  useEffect(() => {
    if (order) {
      setShippingCarrier(order.shipping_carrier || '');
      setTrackingNumber(order.tracking_number || '');
      setTotalBoxes(order.total_boxes);
      setTotalPallets(order.total_pallets);
      setNotes(order.notes || '');
    }
  }, [order]);

  const loadSalesOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customer:customers(
            name,
            customer_code
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading sales order:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_order_devices')
        .select(`
          *,
          cellular_device:cellular_devices(
            id,
            imei,
            color,
            storage_gb,
            grade:product_grades(grade),
            tac:tac_codes(
              model_name,
              manufacturer
            )
          ),
          serial_device:serial_devices(
            id,
            serial_number,
            color,
            grade:product_grades(grade),
            model_name,
            manufacturer:manufacturers(name)
          )
        `)
        .eq('sales_order_id', id);

      if (error) throw error;

      const formattedDevices = (data || []).map(device => ({
        id: device.id,
        cellular_device_id: device.cellular_device?.id,
        serial_device_id: device.serial_device?.id,
        identifier: device.cellular_device ? device.cellular_device.imei : device.serial_device.serial_number,
        manufacturer: device.cellular_device 
          ? device.cellular_device.tac.manufacturer
          : device.serial_device.manufacturer.name,
        model: device.cellular_device 
          ? device.cellular_device.tac.model_name 
          : device.serial_device.model_name,
        color: device.cellular_device?.color || device.serial_device?.color,
        storage_gb: device.cellular_device?.storage_gb,
        grade: device.cellular_device?.grade?.grade || device.serial_device?.grade?.grade,
        type: device.cellular_device ? 'cellular' : 'serial',
        confirmed: false,
      }));

      setDevices(formattedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!order || !id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('sales_orders')
        .update({
          shipping_carrier: shippingCarrier,
          tracking_number: trackingNumber,
          total_boxes: totalBoxes,
          total_pallets: totalPallets,
          notes: notes,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating sales order:', error);
      }

      navigate('/sales');
    } catch (error) {
      console.error('Error updating sales order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!order || !id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('sales_orders')
        .update({ 
          status: 'processing',
          shipping_carrier: shippingCarrier,
          tracking_number: trackingNumber,
          total_boxes: totalBoxes,
          total_pallets: totalPallets,
          notes: notes,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating sales order status:', error);
      } else {
        // Optimistically update the order status
        setOrder(prevOrder => {
          if (!prevOrder) return prevOrder;
          return { ...prevOrder, status: 'processing' };
        });
      }

      navigate('/goods-out');
    } catch (error) {
      console.error('Error updating sales order status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingCarrierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingCarrier(e.target.value);
  };

  const handleTrackingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingNumber(e.target.value);
  };

  const handleTotalBoxesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    setTotalBoxes(value);
  };

  const handleTotalPalletsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    setTotalPallets(value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleDeviceConfirmation = (deviceId: string, confirmed: boolean) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === deviceId ? { ...device, confirmed } : device
      )
    );
  };

  const openBookDevicesModal = () => {
    const deviceType = devices.length > 0 ? devices[0].type : 'cellular';
    setDeviceType(deviceType);
    setIsBookDevicesModalOpen(true);
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(isFromGoodsOut ? '/goods-out' : '/sales')}
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {isFromGoodsOut ? 'Goods Out' : 'Sales Orders'}
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Sales Order: {order.order_number}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {order.customer.name} ({order.customer.customer_code})
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Order Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(order.order_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Device Count</dt>
              <dd className="mt-1 text-sm text-gray-900">{devices.length}</dd>
            </div>
            {order.tracking_number && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Tracking</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.tracking_number} ({order.shipping_carrier})
                </dd>
              </div>
            )}
          </div>
          {order.notes && (
             <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="shippingCarrier" className="block text-sm font-medium text-gray-700">
                Shipping Carrier
              </label>
              <input
                type="text"
                id="shippingCarrier"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={shippingCarrier}
                onChange={handleShippingCarrierChange}
                disabled={readOnlyMode}
              />
            </div>
            <div>
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700">
                Tracking Number
              </label>
              <input
                type="text"
                id="trackingNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={trackingNumber}
                onChange={handleTrackingNumberChange}
                disabled={readOnlyMode}
              />
            </div>
            <div>
              <label htmlFor="totalBoxes" className="block text-sm font-medium text-gray-700">
                Total Boxes
              </label>
              <input
                type="number"
                id="totalBoxes"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={totalBoxes === undefined ? '' : totalBoxes}
                onChange={handleTotalBoxesChange}
                disabled={readOnlyMode}
              />
            </div>
            <div>
              <label htmlFor="totalPallets" className="block text-sm font-medium text-gray-700">
                Total Pallets
              </label>
              <input
                type="number"
                id="totalPallets"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={totalPallets === undefined ? '' : totalPallets}
                onChange={handleTotalPalletsChange}
                disabled={readOnlyMode}
              />
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={notes}
              onChange={handleNotesChange}
              disabled={readOnlyMode}
            />
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Devices</h3>
          {(!readOnlyMode) ? (
            <button
              type="button"
              onClick={() => setIsAddDevicesModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Package className="mr-2 h-4 w-4" />
              Add Devices
            </button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No devices added yet
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {device.type === 'cellular' ? (
                          <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                        ) : (
                          <Barcode className="h-5 w-5 text-gray-400 mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {device.manufacturer} {device.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            <Link 
                              to={`/device/${device.type}/${device.type === 'cellular' ? device.cellular_device_id : device.serial_device_id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {device.identifier}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.color || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.storage_gb ? `${device.storage_gb}GB` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.grade ? `Grade ${device.grade}` : '-'}
                    </td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                      {device.confirmed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <Link 
                        to={`/device/${device.type}/${device.type === 'cellular' ? device.cellular_device_id : device.serial_device_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={handleSaveAndExit}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save &amp; Exit
        </button>
        {!readOnlyMode ? (
          <>
            <button
              onClick={openBookDevicesModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Package className="mr-2 h-4 w-4" />
              Book Devices
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit
            </button>
          </>
        ) : null}
      </div>

      <AddSalesOrderDevices
        isOpen={isAddDevicesModalOpen}
        onClose={() => setIsAddDevicesModalOpen(false)}
        onDevicesAdded={loadDevices}
        salesOrderId={id!}
      />

      <BookDeviceShipment
        isOpen={isBookDevicesModalOpen}
        onClose={() => setIsBookDevicesModalOpen(false)}
        onShipmentBooked={loadDevices}
        deviceType={deviceType}
        devices={devices}
        onDeviceConfirmation={handleDeviceConfirmation}
      />
    </div>
  );
};

export default SalesOrderDetail;
