import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BookDeviceShipmentProps {
  isOpen: boolean;
  onClose: () => void;
  onShipmentBooked: () => void;
  deviceType: 'cellular' | 'serial';
  devices: any[];
  onDeviceConfirmation: (deviceId: string, confirmed: boolean) => void;
}

const BookDeviceShipment: React.FC<BookDeviceShipmentProps> = ({
  isOpen,
  onClose,
  onShipmentBooked,
  deviceType,
  devices,
  onDeviceConfirmation,
}) => {
  const [imeiInput, setImeiInput] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImeiInput('');
      setValidationMessage(null);
    }
  }, [isOpen]);

  const handleImeiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImeiInput(e.target.value);
  };

  const handleImeiSubmit = () => {
    setLoading(true);
    setValidationMessage(null);

    const trimmedInput = imeiInput.trim();

    if (!trimmedInput) {
      setValidationMessage('Please enter an IMEI/Serial number.');
      setLoading(false);
      return;
    }

    const foundDevice = devices.find(
      (device) => device.identifier === trimmedInput
    );

    if (foundDevice) {
      onDeviceConfirmation(foundDevice.id, true);
      setValidationMessage(
        `IMEI/Serial ${trimmedInput} confirmed for device ${foundDevice.manufacturer} ${foundDevice.model}.`
      );
    } else {
      setValidationMessage(
        `IMEI/Serial ${trimmedInput} not found in the sales order.`
      );
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    onShipmentBooked();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Book Devices</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationMessage && (
          <div
            className={`mb-4 p-3 rounded-md flex items-center ${
              validationMessage.includes('not found')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {validationMessage.includes('not found') ? (
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            {validationMessage}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="imeiInput" className="block text-sm font-medium text-gray-700">
            Enter IMEI/Serial Number
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="imeiInput"
              className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Scan or enter IMEI/Serial"
              value={imeiInput}
              onChange={handleImeiInputChange}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {loading ? (
                <Loader2 className="animate-spin text-gray-500" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImeiSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Confirm IMEI/Serial
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDeviceShipment;
