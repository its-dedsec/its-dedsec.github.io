
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Lock, 
  CheckCircle, 
  Info,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface PrecautionaryStepsProps {
  overallRisk: string;
  qrData: string;
}

export const PrecautionarySteps: React.FC<PrecautionaryStepsProps> = ({ overallRisk, qrData }) => {
  const getRiskSteps = () => {
    switch (overallRisk?.toLowerCase()) {
      case 'high':
        return {
          priority: 'CRITICAL',
          color: 'red',
          icon: <AlertTriangle className="w-5 h-5" />,
          steps: [
            {
              title: 'DO NOT VISIT THE URL',
              description: 'Immediately avoid accessing this URL under any circumstances',
              icon: <AlertCircle className="w-4 h-4 text-red-500" />,
              critical: true
            },
            {
              title: 'Disconnect from Network',
              description: 'If you accidentally visited the URL, disconnect from the internet immediately',
              icon: <Shield className="w-4 h-4 text-red-500" />,
              critical: true
            },
            {
              title: 'Run Security Scan',
              description: 'Perform a full system antivirus scan on your device',
              icon: <Eye className="w-4 h-4 text-red-500" />,
              critical: false
            },
            {
              title: 'Report the Threat',
              description: 'Report this malicious URL to your IT security team or relevant authorities',
              icon: <ExternalLink className="w-4 h-4 text-red-500" />,
              critical: false
            },
            {
              title: 'Monitor Accounts',
              description: 'Monitor your accounts for suspicious activity and change passwords if necessary',
              icon: <Lock className="w-4 h-4 text-red-500" />,
              critical: false
            }
          ]
        };
      case 'medium':
        return {
          priority: 'CAUTION',
          color: 'amber',
          icon: <AlertTriangle className="w-5 h-5" />,
          steps: [
            {
              title: 'Exercise Extreme Caution',
              description: 'Proceed only if absolutely necessary and with proper security measures',
              icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
              critical: true
            },
            {
              title: 'Use Incognito/Private Mode',
              description: 'If you must visit, use incognito/private browsing mode',
              icon: <Eye className="w-4 h-4 text-amber-500" />,
              critical: false
            },
            {
              title: 'Verify URL Authenticity',
              description: 'Double-check the URL through alternative trusted sources',
              icon: <CheckCircle className="w-4 h-4 text-amber-500" />,
              critical: false
            },
            {
              title: 'Use Updated Security Software',
              description: 'Ensure your antivirus and browser security features are up to date',
              icon: <Shield className="w-4 h-4 text-amber-500" />,
              critical: false
            },
            {
              title: 'Monitor for Suspicious Activity',
              description: 'Watch for unusual behavior after visiting the site',
              icon: <Info className="w-4 h-4 text-amber-500" />,
              critical: false
            }
          ]
        };
      default:
        return {
          priority: 'SAFE',
          color: 'green',
          icon: <CheckCircle className="w-5 h-5" />,
          steps: [
            {
              title: 'URL Appears Safe',
              description: 'Security analysis indicates this URL is likely safe to visit',
              icon: <CheckCircle className="w-4 h-4 text-green-500" />,
              critical: false
            },
            {
              title: 'Standard Security Practices',
              description: 'Continue following standard web security practices',
              icon: <Shield className="w-4 h-4 text-green-500" />,
              critical: false
            },
            {
              title: 'Verify Before Entering Personal Data',
              description: 'Always verify the authenticity before entering sensitive information',
              icon: <Lock className="w-4 h-4 text-green-500" />,
              critical: false
            },
            {
              title: 'Keep Software Updated',
              description: 'Maintain updated browsers and security software',
              icon: <Info className="w-4 h-4 text-green-500" />,
              critical: false
            },
            {
              title: 'Stay Vigilant',
              description: 'Remain alert for any suspicious behavior or requests',
              icon: <Eye className="w-4 h-4 text-green-500" />,
              critical: false
            }
          ]
        };
    }
  };

  const riskInfo = getRiskSteps();

  return (
    <Card className="mb-6 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 bg-${riskInfo.color}-100 dark:bg-${riskInfo.color}-950/30 rounded-xl`}>
            {riskInfo.icon}
          </div>
          <div>
            <span className="text-xl">Security Recommendations</span>
            <Badge 
              className={`ml-3 ${
                riskInfo.color === 'red' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300' :
                riskInfo.color === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300' :
                'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300'
              } font-bold`}
            >
              {riskInfo.priority}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800 dark:text-gray-200">Scanned URL:</span>
            </div>
            <code className="text-sm text-gray-600 dark:text-gray-300 break-all bg-white dark:bg-gray-900 p-2 rounded border">
              {qrData}
            </code>
          </div>

          <div className="grid gap-4">
            {riskInfo.steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  step.critical 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="mt-0.5">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    step.critical 
                      ? 'text-red-800 dark:text-red-300' 
                      : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {step.title}
                    {step.critical && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        CRITICAL
                      </Badge>
                    )}
                  </h4>
                  <p className={`text-sm ${
                    step.critical 
                      ? 'text-red-700 dark:text-red-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  General Security Tips
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Always verify QR codes from untrusted sources</li>
                  <li>• Keep your devices and browsers updated</li>
                  <li>• Use reputable antivirus software</li>
                  <li>• Be cautious with personal information online</li>
                  <li>• Report suspicious URLs to authorities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
