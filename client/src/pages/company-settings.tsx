import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, Building2, Palette, Save, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string;
  themeColor: string;
  currency: string;
  timezone: string;
}

export default function CompanySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyLogo: '',
    themeColor: '#8B4513',
    currency: 'USD',
    timezone: 'UTC'
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch current settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    if (settingsResponse?.settings) {
      const settingsData = settingsResponse.settings;
      const companySettings: CompanySettings = {
        companyName: settingsData.companyName || 'Sweet Treats Bakery',
        companyAddress: settingsData.companyAddress || '',
        companyPhone: settingsData.companyPhone || '',
        companyEmail: settingsData.companyEmail || 'info@sweettreatsbakery.com',
        companyLogo: settingsData.companyLogo || '',
        themeColor: settingsData.themeColor || '#8B4513',
        currency: settingsData.currency || 'USD',
        timezone: settingsData.timezone || 'UTC'
      };
      setSettings(companySettings);
      setLogoPreview(companySettings.companyLogo);
    }
  }, [settingsResponse]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      const response = await apiRequest('PUT', '/api/settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Company settings have been saved successfully.",
      });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      // Trigger page reload to update branding across app
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (PNG, JPG, SVG).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setSettings(prev => ({ ...prev, companyLogo: result }));
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, themeColor: color }));
    setHasUnsavedChanges(true);
    
    // Apply theme color immediately for preview
    document.documentElement.style.setProperty('--primary', color);
  };

  // Save settings
  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  // Reset unsaved changes
  const handleReset = () => {
    if (settingsResponse?.settings) {
      const settingsData = settingsResponse.settings;
      const companySettings: CompanySettings = {
        companyName: settingsData.companyName || 'Sweet Treats Bakery',
        companyAddress: settingsData.companyAddress || '',
        companyPhone: settingsData.companyPhone || '',
        companyEmail: settingsData.companyEmail || 'info@sweettreatsbakery.com',
        companyLogo: settingsData.companyLogo || '',
        themeColor: settingsData.themeColor || '#8B4513',
        currency: settingsData.currency || 'USD',
        timezone: settingsData.timezone || 'UTC'
      };
      setSettings(companySettings);
      setLogoPreview(companySettings.companyLogo);
      setLogoFile(null);
      setHasUnsavedChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company branding and configuration
          </p>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Unsaved Changes
            </Badge>
            <Button onClick={handleReset} variant="outline" size="sm">
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm" 
              disabled={updateSettingsMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic company details that appear throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Sweet Treats Bakery"
              />
              <p className="text-xs text-muted-foreground">
                Displayed in sidebar, login page, and browser title
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                placeholder="info@sweettreatsbakery.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                placeholder="123 Bakery Street, Sweet City"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Branding & Appearance
            </CardTitle>
            <CardDescription>
              Customize your company logo and theme color
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={logoPreview} 
                          alt="Company Logo Preview" 
                          className="max-h-20 mx-auto object-contain"
                        />
                        <p className="text-sm text-muted-foreground">Logo Preview</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-muted-foreground">Upload company logo</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, or SVG. Max 5MB. Recommended: 200x60px
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Theme Color */}
            <div className="space-y-4">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={settings.themeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#8B4513"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Primary color used throughout the application
              </p>
            </div>

            {/* Quick Theme Presets */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Presets</Label>
              <div className="flex gap-2">
                {[
                  { name: 'Bakery Brown', color: '#8B4513' },
                  { name: 'Warm Orange', color: '#FF8C42' },
                  { name: 'Sweet Pink', color: '#FF69B4' },
                  { name: 'Classic Blue', color: '#4A90E2' },
                  { name: 'Forest Green', color: '#228B22' },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => handleColorChange(preset.color)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>
            System settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="NPR">NPR - Nepalese Rupee</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Kathmandu">Kathmandu</option>
                <option value="Asia/Kolkata">Mumbai</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium">You have unsaved changes</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="ghost" size="sm">
              Discard
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm"
              disabled={updateSettingsMutation.isPending}
            >
              <Check className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}