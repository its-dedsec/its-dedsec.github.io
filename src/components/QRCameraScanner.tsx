
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QRCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          onScanResult(result.data);
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      scanner.start().then(() => {
        setHasPermission(true);
        setQrScanner(scanner);
      }).catch((error) => {
        console.error('Failed to start camera:', error);
        setHasPermission(false);
      });

      return () => {
        scanner.stop();
        scanner.destroy();
      };
    }
  }, [isOpen, onScanResult, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/95 border-gray-700 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan QR Code
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-300">Requesting camera permission...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">Camera access denied</p>
              <p className="text-sm text-gray-500">
                Please enable camera permissions to scan QR codes
              </p>
            </div>
          )}

          {hasPermission === true && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-xl bg-black"
                style={{ aspectRatio: '1/1' }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
                  <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 mt-4">
                Position the QR code within the frame
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
