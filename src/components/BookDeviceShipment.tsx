import React, { useState, useEffect, useRef } from 'react';
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
  const [imeiSerial, setImeiSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setImeiSerial('');
      setError(null);
      setSuccess(null);
      // Focus on the input when the modal opens
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const device = devices.find(
        (device) => device.identifier === imeiSerial
      );

      if (!device) {
        setError('Device not found in this sales order.');
        return;
      }

      onDeviceConfirmation(device.id, true);
      setSuccess(`Device ${imeiSerial} confirmed.`);
      setImeiSerial(''); // Clear the input after successful confirmation
      
      // Refocus on the input after successful confirmation
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.error('Error confirming device:', err);
      setError('Failed to confirm device.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Confirm IMEI/Serial</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="mb-6">
          <label
            htmlFor="imeiSerial"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter IMEI/Serial:
          </label>
          <input
            type="text"
            id="imeiSerial"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={imeiSerial}
            onChange={(e) => setImeiSerial(e.target.value)}
            onKeyDown={handleKeyDown} // Listen for Enter key
            ref={inputRef} // Attach the ref to the input
            disabled={loading}
          />
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
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm IMEI/Serial'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDeviceShipment;
