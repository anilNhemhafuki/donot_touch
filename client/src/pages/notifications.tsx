
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'production' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('activity');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'system',
      title: 'Space created',
      description: 'Pawan Bhattarai created space Standard Room.',
      timestamp: '02:00 PM/06-16-2025',
      read: false,
      priority: 'low'
    },
    {
      id: '2',
      type: 'stock',
      title: 'Stock item created',
      description: 'Pawan Bhattarai created stock item daaru.',
      timestamp: '01:16 PM/06-16-2025',
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'order',
      title: 'Order checked out',
      description: 'Pawan Bhattarai checked out Table order for Table 1 (INV-1).',
      timestamp: '12:45 PM/06-16-2025',
      read: true,
      priority: 'high'
    },
    {
      id: '4',
      type: 'production',
      title: 'KOT status changed',
      description: 'Pawan Bhattarai changed status of KOT 1 to Pending.',
      timestamp: '12:44 PM/06-16-2025',
      read: true,
      priority: 'medium'
    },
    {
      id: '5',
      type: 'production',
      title: 'KOT status changed',
      description: 'Pawan Bhattarai changed status of KOT 1 to Completed.',
      timestamp: '12:44 PM/06-16-2025',
      read: true,
      priority: 'medium'
    },
    {
      id: '6',
      type: 'order',
      title: 'Order created',
      description: 'Pawan Bhattarai created Table order for Table 1.',
      timestamp: '12:44 PM/06-16-2025',
      read: true,
      priority: 'high'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'fas fa-shopping-cart';
      case 'stock':
        return 'fas fa-boxes';
      case 'production':
        return 'fas fa-industry';
      case 'system':
        return 'fas fa-cog';
      default:
        return 'fas fa-bell';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'stock':
        return 'bg-green-100 text-green-800';
      case 'production':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your bakery activities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'order' ? 'default' : 'outline'}
                onClick={() => setActiveTab('order')}
                size="sm"
              >
                Order
              </Button>
              <Button
                variant={activeTab === 'activity' ? 'destructive' : 'outline'}
                onClick={() => setActiveTab('activity')}
                size="sm"
              >
                Activity
              </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Lifetime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Type: All</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-4">
              June 16th, 2025
            </div>
            
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                  !notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                    <i className={`${getTypeIcon(notification.type)} text-sm`}></i>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredNotifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
