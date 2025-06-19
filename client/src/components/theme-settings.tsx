import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Check } from 'lucide-react';

const THEME_COLORS = [
  { name: 'Ocean Blue', value: '#507e96' },
  { name: 'Sunset Yellow', value: '#ffca44' },
  { name: 'Forest Green', value: '#0f6863' },
  { name: 'Cherry Red', value: '#e40126' },
  { name: 'Autumn Gold', value: '#c1853b' },
  { name: 'Coffee Brown', value: '#7B4019' },
  { name: 'Vibrant Orange', value: '#FF7D29' },
];

export default function ThemeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState('#507e96');

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (color: string) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeColor: color }),
      });
      if (!response.ok) throw new Error('Failed to update theme');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      // Apply theme color to CSS variables
      document.documentElement.style.setProperty('--theme-primary', selectedColor);
      toast({
        title: "Theme Updated",
        description: "Your theme color has been successfully changed.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update theme color. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings?.themeColor) {
      setSelectedColor(settings.themeColor);
      document.documentElement.style.setProperty('--theme-primary', settings.themeColor);
    }
  }, [settings]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleSave = () => {
    updateThemeMutation.mutate(selectedColor);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Colors
        </CardTitle>
        <CardDescription>
          Choose a theme color for your bakery management system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          {THEME_COLORS.map((color) => (
            <div
              key={color.value}
              className="relative cursor-pointer group"
              onClick={() => handleColorSelect(color.value)}
            >
              <div
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
              >
                {selectedColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {color.name}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm text-gray-600">
              Selected: {THEME_COLORS.find(c => c.value === selectedColor)?.name || 'Custom'}
            </span>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateThemeMutation.isPending}
            className="min-w-[80px]"
          >
            {updateThemeMutation.isPending ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}