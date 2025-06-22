import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Download,
  FileSearch,
  FileX,
  Check,
  Moon,
  Sun,
  Shield,
  Settings as SettingsIcon,
  LogIn,
  LogOut,
  User,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Globe,
  Lock,
  Zap,
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QRCameraScanner } from '@/components/QRCameraScanner';

interface SecurityCheck {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  details?: string;
  engines?: any;
}

const Index = () => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'camera' | 'upload' | 'manual' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [reportReady, setReportReady] = useState(false);
  const [showAllEngines, setShowAllEngines] = useState(false);
  const [scanningStep, setScanningStep] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleScanResult = (data: string, source: 'camera' | 'upload' | 'manual') => {
    console.log('Scan result received:', { data, source });
    setQrData(data);
    setScanSource(source);
    setSecurityChecks([]);
    setReportReady(false);
    setShowAllEngines(false);
    performSecurityScan(data);
  };

  const performSecurityScan = async (url: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanningStep('Initializing security scan...');

    try {
      const savedKeys = localStorage.getItem('qr-shield-api-keys');
      if (!savedKeys) {
        toast({
          title: 'API Keys Not Configured',
          description: 'Please configure your API keys in Settings first',
          variant: 'destructive',
        });
        setIsScanning(false);
        return;
      }

      setScanProgress(20);
      setScanningStep('Checking with VirusTotal...');

      const { data, error } = await supabase.functions.invoke('security-scan', {
        body: { url, apiKeys: JSON.parse(savedKeys) },
      });

      if (error) throw error;

      setScanProgress(80);
      setScanningStep('Analyzing results...');

      const { results, overallRisk } = data;
      setSecurityChecks(results);

      if (user) {
        await supabase.from('qr_scan_results').insert({
          qr_data: url,
          security_checks: results,
          overall_risk: overallRisk,
          user_id: user.id,
        });
      }

      setScanProgress(100);
      setScanningStep('Complete!');
      setReportReady(true);

      toast({
        title: 'Security Scan Complete',
        description: 'QR code analysis finished. Review the results below.',
      });
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'Failed to complete security analysis. Please check your API keys.',
        variant: 'destructive',
      });
    }

    setIsScanning(false);
  };

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      qrCodeUrl: qrData,
      scanSource: scanSource,
      securityChecks: securityChecks,
      overallRisk: securityChecks.some((c) => c.status === 'failed')
        ? 'HIGH'
        : securityChecks.some((c) => c.status === 'warning')
        ? 'MEDIUM'
        : 'LOW',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'Security analysis report saved to your device',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <FileX className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      pending: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">QR Shield</h1>
        {user ? (
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>

      <Button onClick={() => setScannerOpen(true)}>Scan QR Code</Button>

      <QRCameraScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanResult={(result) => handleScanResult(result, 'camera')}
      />

      {qrData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scanned Data</CardTitle>
            <CardDescription>Source: {scanSource}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono break-all">{qrData}</p>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scanning...</CardTitle>
            <CardDescription>{scanningStep}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={scanProgress} />
          </CardContent>
        </Card>
      )}

      {securityChecks.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Security Results</CardTitle>
          </CardHeader>
          <CardContent>
            {securityChecks.map((check, idx) => (
              <div key={idx} className="mb-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span className="font-semibold">{check.name}</span>
                  </div>
                  <Badge className={getStatusBadge(check.status)}>{check.status.toUpperCase()}</Badge>
                </div>
                <p className="text-sm mt-2 text-gray-400">{check.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reportReady && (
        <div className="mt-6 flex justify-center">
          <Button onClick={downloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
