
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Save, 
  Key, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Eye,
  LogOut,
  ArrowLeft,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();
  
  const [apiKeys, setApiKeys] = useState({
    VIRUSTOTAL_API_KEY: '',
    GOOGLE_SAFE_BROWSING_API_KEY: '',
    URLSCAN_API_KEY: '',
    IPINFO_API_KEY: '',
    BROWSERLESS_API_KEY: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load API keys from localStorage on component mount
    const savedKeys = localStorage.getItem('qr-shield-api-keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(prev => ({ ...prev, ...parsedKeys }));
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }
  }, []);

  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    try {
      // Filter out empty keys
      const filteredKeys = Object.fromEntries(
        Object.entries(apiKeys).filter(([_, value]) => value.trim() !== '')
      );
      
      // Save to localStorage
      localStorage.setItem('qr-shield-api-keys', JSON.stringify(filteredKeys));
      
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved securely and will persist across sessions"
      });
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const apiKeyConfigs = [
    {
      key: 'VIRUSTOTAL_API_KEY',
      name: 'VirusTotal API Key',
      description: 'Required for malware and threat detection analysis',
      link: 'https://www.virustotal.com/gui/join-us',
      icon: <Shield className="w-4 h-4" />,
      required: true
    },
    {
      key: 'GOOGLE_SAFE_BROWSING_API_KEY',
      name: 'Google Safe Browsing API Key',
      description: 'Google\'s threat detection and safe browsing service',
      link: 'https://developers.google.com/safe-browsing/v4/get-started',
      icon: <Shield className="w-4 h-4" />,
      required: true
    },
    {
      key: 'URLSCAN_API_KEY',
      name: 'URLScan.io API Key',
      description: 'Deep website analysis and screenshot capture',
      link: 'https://urlscan.io/user/signup',
      icon: <Eye className="w-4 h-4" />,
      required: false
    },
    {
      key: 'IPINFO_API_KEY',
      name: 'IPInfo API Key',
      description: 'IP geolocation and network information',
      link: 'https://ipinfo.io/signup',
      icon: <ExternalLink className="w-4 h-4" />,
      required: false
    },
    {
      key: 'BROWSERLESS_API_KEY',
      name: 'Browserless API Key',
      description: 'Sandbox screenshot capture for security analysis',
      link: 'https://www.browserless.io/sign-up',
      icon: <Eye className="w-4 h-4" />,
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Configure your API keys and preferences</p>
              </div>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* API Keys Configuration */}
        <Card className="mb-6 border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your API keys for enhanced security analysis features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiKeyConfigs.map((config) => (
              <div key={config.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <Label htmlFor={config.key} className="font-medium">
                      {config.name}
                      {config.required && (
                        <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                      )}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(config.link, '_blank')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config.description}
                </p>
                <Input
                  id={config.key}
                  type="password"
                  placeholder={`Enter your ${config.name}...`}
                  value={apiKeys[config.key as keyof typeof apiKeys]}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [config.key]: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">API Key Status</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {Object.values(apiKeys).filter(key => key.trim() !== '').length} of {Object.keys(apiKeys).length} keys configured
                </p>
              </div>
              <Button 
                onClick={handleSaveApiKeys}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Security Notice
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  API keys are stored locally in your browser and are not transmitted to our servers. 
                  They are only used for making direct API calls to security services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
