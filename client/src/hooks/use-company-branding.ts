import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface CompanyBranding {
  companyName: string;
  companyLogo: string;
  themeColor: string;
  currency: string;
}

export function useCompanyBranding() {
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: () => apiRequest('/api/settings'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const branding: CompanyBranding = {
    companyName: settingsData?.settings?.companyName || 'Sweet Treats Bakery',
    companyLogo: settingsData?.settings?.companyLogo || '',
    themeColor: settingsData?.settings?.themeColor || '#8B4513',
    currency: settingsData?.settings?.currency || 'USD',
  };

  // Apply theme color to CSS variables
  useEffect(() => {
    if (branding.themeColor) {
      // Convert hex to HSL for CSS custom properties
      const hexToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);

        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case rNorm:
              h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
              break;
            case gNorm:
              h = (bNorm - rNorm) / d + 2;
              break;
            case bNorm:
              h = (rNorm - gNorm) / d + 4;
              break;
          }
          h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
      };

      try {
        const [h, s, l] = hexToHsl(branding.themeColor);
        
        // Update CSS custom properties for primary color
        document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`);
        document.documentElement.style.setProperty('--primary-foreground', l > 50 ? '0 0% 98%' : '0 0% 2%');
        
        // Update meta theme color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', branding.themeColor);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = branding.themeColor;
          document.head.appendChild(meta);
        }
      } catch (error) {
        console.warn('Failed to apply theme color:', error);
      }
    }
  }, [branding.themeColor]);

  // Update document title
  useEffect(() => {
    if (branding.companyName) {
      document.title = `${branding.companyName} - Management System`;
    }
  }, [branding.companyName]);

  return {
    branding,
    isLoading,
    error,
    refreshBranding: () => {
      // Force a refetch when settings are updated
      window.location.reload();
    }
  };
}

// Utility function to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return `${currency} ${amount.toFixed(2)}`;
  }
}