
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Camera, Link, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QRCameraScanner } from '@/components/QRCameraScanner';

interface QRScannerProps {
  onScanResult: (data: string, source: 'camera' | 'upload' | 'manual') => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanResult }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "QR Code Image Selected",
        description: "Ready to scan for security analysis"
      });
    }
  };

  const handleImageScan = async () => {
    if (!selectedFile) return;

    try {
      // Use HTML5 QR code scanner
      const QrScanner = (await import('qr-scanner')).default;
      const result = await QrScanner.scanImage(selectedFile);
      
      console.log('QR Code extracted from image:', result);
      onScanResult(result, 'upload');
      
      toast({
        title: "QR Code Scanned",
        description: "Successfully extracted URL from image"
      });
    } catch (error) {
      console.error('Failed to scan QR code from image:', error);
      toast({
        title: "Scan Failed",
        description: "Could not extract QR code from image. Please try a clearer image.",
        variant: "destructive"
      });
    }
  };

  const handleCameraScan = (result: string) => {
    console.log('QR Code detected from camera:', result);
    onScanResult(result, 'camera');
    setShowCamera(false);
    toast({
      title: "QR Code Scanned",
      description: "Successfully scanned QR code from camera"
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    const url = manualUrl.trim();
    console.log('Manual URL entered:', url);
    onScanResult(url, 'manual');
    setManualUrl('');
    
    toast({
      title: "URL Added",
      description: "Manual URL ready for analysis"
    });
  };

  return (
    <>
      <Card className="mb-8 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/50">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Scan or Enter URL</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Upload QR image, use camera, or manually enter a URL for security analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Manual URL Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Link className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Enter URL Manually</h3>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={!manualUrl.trim()}
                className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl"
              >
                <Search className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or scan QR code</span>
            </div>
          </div>

          {/* QR Code Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Upload QR Code Image</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-m">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-3xl cursor-pointer bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 transition-all duration-200">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <QrCode className="w-10 h-10 mb-3 text-blue-500" />
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 w-full max-w-md">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Selected File:</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{selectedFile.name}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleImageScan}
                disabled={!selectedFile}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                Scan Image
              </Button>
              
              <Button
                onClick={() => setShowCamera(true)}
                variant="outline"
                className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl font-semibold transition-all duration-200"
              >
                <Camera className="w-4 h-4 mr-2" />
                Use Camera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCameraScanner
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onScanResult={handleCameraScan}
      />
    </>
  );
};
