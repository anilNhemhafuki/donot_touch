import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    products: 'Products',
    inventory: 'Inventory',
    orders: 'Orders',
    production: 'Production',
    reports: 'Reports',
    customers: 'Customers',
    parties: 'Parties',
    assets: 'Assets',
    expenses: 'Expenses',
    
    // Header
    logout: 'Logout',
    language: 'Language',
    
    // Dashboard
    todaySales: 'Today Sales',
    todayOrders: 'Today Orders',
    productsInStock: 'Products in Stock',
    lowStockItems: 'Low Stock Items',
    productionToday: 'Production Today',
    recentOrders: 'Recent Orders',
    productionSchedule: 'Production Schedule',
    lowStockAlert: 'Low Stock Alert',
    expiredProducts: 'Expired Products',
    quickActions: 'Quick Actions',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    total: 'Total',
    quantity: 'Quantity',
    rate: 'Rate',
    amount: 'Amount',
    unit: 'Unit',
    serialNo: 'S.No.',
    productName: 'Product Name',
    
    // Roles
    admin: 'Admin',
    supervisor: 'Supervisor',
    manager: 'Manager',
    staff: 'Staff',
    marketer: 'Marketer',
  },
  ne: {
    // Navigation
    dashboard: 'ड्यासबोर्ड',
    products: 'उत्पादनहरू',
    inventory: 'भण्डार',
    orders: 'अर्डरहरू',
    production: 'उत्पादन',
    reports: 'रिपोर्टहरू',
    customers: 'ग्राहकहरू',
    parties: 'पार्टीहरू',
    assets: 'सम्पत्तिहरू',
    expenses: 'खर्चहरू',
    
    // Header
    logout: 'लगआउट',
    language: 'भाषा',
    
    // Dashboard
    todaySales: 'आजको बिक्री',
    todayOrders: 'आजका अर्डरहरू',
    productsInStock: 'स्टकमा उत्पादनहरू',
    lowStockItems: 'कम स्टक वस्तुहरू',
    productionToday: 'आजको उत्पादन',
    recentOrders: 'हालका अर्डरहरू',
    productionSchedule: 'उत्पादन तालिका',
    lowStockAlert: 'कम स्टक चेतावनी',
    expiredProducts: 'म्याद सकिएका उत्पादनहरू',
    quickActions: 'द्रुत कार्यहरू',
    
    // Common
    add: 'थप्नुहोस्',
    edit: 'सम्पादन',
    delete: 'मेटाउनुहोस्',
    save: 'सेभ गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    search: 'खोज्नुहोस्',
    filter: 'फिल्टर',
    export: 'निर्यात',
    total: 'जम्मा',
    quantity: 'मात्रा',
    rate: 'दर',
    amount: 'रकम',
    unit: 'एकाइ',
    serialNo: 'क्र.सं.',
    productName: 'उत्पादनको नाम',
    
    // Roles
    admin: 'एडमिन',
    supervisor: 'सुपरभाइजर',
    manager: 'म्यानेजर',
    staff: 'स्टाफ',
    marketer: 'मार्केटर',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}