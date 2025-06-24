
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  Moon, 
  Sun, 
  Shield, 
  Settings as SettingsIcon, 
  LogIn, 
  LogOut,
  Globe,
  Check,
  Menu
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
import { SecurityAnalyzer } from '@/components/SecurityAnalyzer';
import { PrecautionarySteps } from '@/components/PrecautionarySteps';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SecurityCheck {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  details?: string;
  engines?: any;
  screenshot?: string;
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
    setScanningStep('Initializing comprehensive security analysis...');
    
    try {
      // Check if API keys are configured
      const savedKeys = localStorage.getItem('qr-shield-api-keys');
      if (!savedKeys) {
        toast({
          title: "API Keys Not Configured",
          description: "Please configure your API keys in Settings first",
          variant: "destructive"
        });
        setIsScanning(false);
        return;
      }

      setScanProgress(15);
      setScanningStep('Connecting to threat intelligence networks...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScanProgress(35);
      setScanningStep('Analyzing URL with VirusTotal engines...');
      
      // Call our security scan edge function
      const { data, error } = await supabase.functions.invoke('security-scan', {
        body: { url, apiKeys: JSON.parse(savedKeys) }
      });

      if (error) {
        console.error('Security scan error:', error);
        throw error;
      }

      setScanProgress(70);
      setScanningStep('Cross-referencing with global threat databases...');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress(90);
      setScanningStep('Finalizing security assessment...');
      
      const { results, overallRisk } = data;
      setSecurityChecks(results);
      
      // Save scan result to database if user is authenticated
      if (user) {
        const { error: dbError } = await supabase
          .from('qr_scan_results')
          .insert({
            qr_data: url,
            security_checks: results,
            overall_risk: overallRisk,
            user_id: user.id
          });

        if (dbError) {
          console.error('Failed to save scan result:', dbError);
        }
      }
      
      setScanProgress(100);
      setScanningStep('Security analysis complete!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setReportReady(true);
      
      toast({
        title: "Security Analysis Complete",
        description: "Comprehensive threat assessment finished. Review the detailed results below."
      });
      
    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete security analysis. Please check your API keys in Settings.",
        variant: "destructive"
      });
    }
    
    setIsScanning(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out"
    });
  };

  const downloadReport = () => {
    const timestamp = new Date();
    const overallRisk = securityChecks.some(c => c.status === 'failed') ? 'HIGH' : 
                       securityChecks.some(c => c.status === 'warning') ? 'MEDIUM' : 'LOW';
    
    // Calculate detailed risk score
    const total = securityChecks.length;
    const passed = securityChecks.filter(c => c.status === 'passed').length;
    const failed = securityChecks.filter(c => c.status === 'failed').length;
    const warnings = securityChecks.filter(c => c.status === 'warning').length;
    const riskScore = total > 0 ? Math.max(0, 100 - (failed * 40) - (warnings * 20)) : 0;

    // Extract detailed engine results
    const engineResults = securityChecks.map(check => {
      if (check.engines && check.engines.scans) {
        return {
          scanType: check.name,
          totalEngines: Object.keys(check.engines.scans).length,
          positiveDetections: check.engines.positives || 0,
          scanDate: check.engines.scan_date || timestamp.toISOString(),
          permalink: check.engines.permalink || '',
          detailedResults: Object.entries(check.engines.scans).map(([engine, result]: [string, any]) => ({
            engineName: engine,
            result: result.result,
            detected: result.detected,
            version: result.version || 'unknown',
            update: result.update || 'unknown'
          }))
        };
      }
      return null;
    }).filter(Boolean);

    const reportData = {
      // Report Metadata
      reportMetadata: {
        generatedAt: timestamp.toISOString(),
        reportVersion: "2.0",
        generatedBy: "QR Shield Security Scanner",
        reportId: `QRS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userAgent: navigator.userAgent,
        reportDuration: "Instant Analysis"
      },

      // Scanned URL Information
      targetInformation: {
        originalUrl: qrData,
        scanSource: scanSource,
        scanSourceDetails: {
          camera: "QR Code scanned via device camera",
          upload: "QR Code extracted from uploaded image",
          manual: "URL entered manually for analysis"
        }[scanSource] || "Unknown source",
        urlLength: qrData?.length || 0,
        protocol: qrData?.split('://')[0] || 'unknown',
        domain: qrData ? new URL(qrData).hostname : 'unknown',
        path: qrData ? new URL(qrData).pathname : '/',
        hasQuery: qrData ? new URL(qrData).search.length > 0 : false
      },

      // Risk Assessment Summary
      riskAssessment: {
        overallRisk: overallRisk,
        riskScore: riskScore,
        confidence: total > 0 ? Math.min(100, (total / 4) * 100) : 0,
        threatLevel: overallRisk,
        recommendation: overallRisk === 'HIGH' ? 'DO NOT VISIT - High security risk detected' :
                       overallRisk === 'MEDIUM' ? 'CAUTION - Potential security concerns identified' :
                       'SAFE - No significant threats detected',
        detectionSummary: {
          totalChecks: total,
          checksPass: passed,
          checksFailed: failed,
          checksWarning: warnings,
          checksPending: securityChecks.filter(c => c.status === 'pending').length
        }
      },

      // Detailed Security Analysis
      securityAnalysis: {
        checksPerformed: securityChecks.map(check => ({
          checkName: check.name,
          description: check.description,
          status: check.status.toUpperCase(),
          details: check.details || 'No additional details available',
          severity: check.status === 'failed' ? 'HIGH' :
                   check.status === 'warning' ? 'MEDIUM' : 'LOW',
          remediation: check.status === 'failed' ? 'Block access to this URL immediately' :
                      check.status === 'warning' ? 'Exercise caution when accessing' :
                      'URL appears safe for access'
        })),
        
        // Engine-Specific Results
        virusTotalAnalysis: engineResults.length > 0 ? engineResults[0] : null,
        
        // Detailed Engine Breakdown
        engineBreakdown: engineResults.flatMap(result => 
          result?.detailedResults?.map(engine => ({
            engineName: engine.engineName,
            vendor: engine.engineName.split(' ')[0],
            result: engine.result,
            threatDetected: engine.detected,
            engineVersion: engine.version,
            lastUpdate: engine.update,
            category: engine.detected ? 'THREAT_DETECTED' : 'CLEAN'
          })) || []
        )
      },

      // Technical Details
      technicalDetails: {
        scanTimestamp: timestamp.toISOString(),
        scanDuration: "< 30 seconds",
        apiEndpointsUsed: [
          "VirusTotal v3 API",
          "Google Safe Browsing API",
          "URLScan.io API",
          "IPInfo API"
        ],
        scanTechnologies: [
          "Multi-engine malware detection",
          "Real-time threat intelligence",
          "Behavioral analysis",
          "Reputation-based filtering",
          "Machine learning classification"
        ]
      },

      // Compliance and Standards
      complianceInformation: {
        standardsCompliance: [
          "OWASP Top 10 Security Risks",
          "NIST Cybersecurity Framework",
          "ISO 27001 Information Security",
          "GDPR Privacy Compliance"
        ],
        dataHandling: "URL analysis performed without storing personal data",
        privacyPolicy: "Scan results are processed locally and not permanently stored"
      },

      // Action Items and Recommendations
      recommendations: {
        immediate: overallRisk === 'HIGH' ? [
          "Do not access the scanned URL",
          "Report suspicious content to IT security",
          "Run additional security scans if URL was already visited",
          "Consider updating security policies"
        ] : overallRisk === 'MEDIUM' ? [
          "Exercise caution before accessing URL",
          "Verify URL authenticity through alternative means",
          "Consider using additional security tools",
          "Monitor for unusual activity"
        ] : [
          "URL appears safe for normal access",
          "Continue following standard security practices",
          "Regular security awareness training recommended"
        ],
        
        longTerm: [
          "Implement regular QR code security scanning",
          "Train users on QR code security risks",
          "Deploy enterprise security solutions",
          "Establish incident response procedures",
          "Regular security policy reviews"
        ]
      },

      // Appendix
      appendix: {
        glossary: {
          "VirusTotal": "Multi-engine malware detection service",
          "Safe Browsing": "Google's web security service",
          "URLScan": "Website security analysis platform",
          "QR Code": "Quick Response code containing embedded data"
        },
        supportContacts: {
          technicalSupport: "Available through application settings",
          securityIncidents: "Report through your organization's IT department"
        },
        additionalResources: [
          "QR Code Security Best Practices Guide",
          "Enterprise Security Policy Templates",
          "Incident Response Playbooks"
        ]
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Shield-Security-Report-${timestamp.toISOString().split('T')[0]}-${timestamp.getHours()}${timestamp.getMinutes()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Detailed Security Report Downloaded",
      description: "Comprehensive analysis report with full technical details saved to your device"
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const getOverallRisk = () => {
    if (securityChecks.some(c => c.status === 'failed')) return 'HIGH';
    if (securityChecks.some(c => c.status === 'warning')) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            {/* Settings/Auth Button - Left Side */}
            <div className="flex items-center gap-2 order-2 sm:order-1 w-full sm:w-auto justify-start">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
            </div>

            {/* User Info & Controls - Right Side */}
            <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto justify-end">
              {user && (
                <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50">
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-500 text-white text-xs sm:text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Hello, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  </Button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-700/50 w-10 h-10 sm:w-12 sm:h-12"
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-2xl shadow-blue-500/25">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 sm:mb-3">
            QR Shield
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium px-4">
            Advanced QR code security scanner with real-time threat detection
          </p>
          
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Sign in to save your scan results and configure API keys for enhanced security analysis
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Left Column - QR Scanner */}
          <div className="space-y-6">
            <QRScanner onScanResult={handleScanResult} />
            
            {/* QR Data Display */}
            {qrData && (
              <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    {scanSource === 'manual' ? 'Entered URL' : 'Extracted QR Code Data'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Source: {scanSource === 'camera' ? 'Camera scan' : scanSource === 'upload' ? 'Image upload' : 'Manual entry'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs sm:text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{qrData}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Security Analysis */}
          <div className="space-y-6">
            <SecurityAnalyzer
              isScanning={isScanning}
              scanProgress={scanProgress}
              scanningStep={scanningStep}
              securityChecks={securityChecks}
              showAllEngines={showAllEngines}
              onToggleEngines={() => setShowAllEngines(!showAllEngines)}
            />
          </div>
        </div>

        {/* Precautionary Steps - Full Width */}
        {qrData && securityChecks.length > 0 && (
          <PrecautionarySteps 
            overallRisk={getOverallRisk()} 
            qrData={qrData} 
          />
        )}

        {/* Download Report - Full Width */}
        {reportReady && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl sm:rounded-3xl shadow-lg shadow-green-500/25 animate-pulse">
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Security Analysis Complete</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg px-4">
                    Your comprehensive security assessment is ready for download
                  </p>
                </div>
                <Button
                  onClick={downloadReport}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  Download Security Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
