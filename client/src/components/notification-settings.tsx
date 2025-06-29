import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff, TestTube } from 'lucide-react';
import ThemeSettings from './theme-settings';

export default function NotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported: notificationsSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    rules,
    updateRule,
    sendTestNotification,
  } = useNotifications();

  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Permission Granted",
        description: "You can now receive push notifications.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    const success = await subscribe();
    if (success) {
      toast({
        title: "Subscribed",
        description: "You're now subscribed to push notifications.",
      });
    } else {
      toast({
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    const success = await unsubscribe();
    if (success) {
      toast({
        title: "Unsubscribed",
        description: "You've been unsubscribed from push notifications.",
      });
    } else {
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to unsubscribe from push notifications.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      await sendTestNotification();
      toast({
        title: "Test Notification Sent",
        description: "Check your notifications for the test message.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleRuleUpdate = async (ruleId: string, updates: any) => {
    try {
      await updateRule(ruleId, updates);
      toast({
        title: "Settings Updated",
        description: "Notification rule has been updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update notification rule.",
        variant: "destructive",
      });
    }
  };

  if (!notificationsSupported) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellOff className="h-6 w-6" />
              Notifications Not Supported
            </CardTitle>
            <CardDescription>
              Your browser doesn't support push notifications or you don't have the required permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage your push notification preferences and rules.
          </p>
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Permission</p>
              <p className="text-sm text-muted-foreground">
                Status: {permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Not Requested'}
              </p>
            </div>
            {permission !== 'granted' && (
              <Button onClick={handlePermissionRequest} disabled={isLoading}>
                Request Permission
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Subscription</p>
              <p className="text-sm text-muted-foreground">
                Status: {subscription ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="flex gap-2">
              {subscription ? (
                <Button variant="outline" onClick={handleUnsubscribe} disabled={isLoading}>
                  Unsubscribe
                </Button>
              ) : (
                <Button onClick={handleSubscribe} disabled={isLoading || permission !== 'granted'}>
                  Subscribe
                </Button>
              )}
              <Button
                onClick={async () => {
                  setIsTestingNotification(true);
                  try {
                    await sendTestNotification();
                    toast({
                      title: "Test Notification Sent",
                      description: "Check your browser for the test notification",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to send test notification",
                      variant: "destructive",
                    });
                  } finally {
                    setIsTestingNotification(false);
                  }
                }}
                disabled={!subscription || isTestingNotification}
                className="w-full"
              >
                {isTestingNotification ? "Sending..." : "Send Test Notification"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>
            Configure when and how you want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium capitalize">
                    {rule.type.replace('_', ' ')} Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {rule.type === 'low_stock' && 'Get notified when inventory items are running low'}
                    {rule.type === 'new_order' && 'Get notified when new orders are received'}
                    {rule.type === 'production_reminder' && 'Get daily reminders about production schedule'}
                  </p>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(enabled) => handleRuleUpdate(rule.id, { enabled })}
                />
              </div>

              {rule.enabled && (
                <div className="space-y-3">
                  {rule.type === 'low_stock' && (
                    <div className="flex items-center gap-4">
                      <Label htmlFor={`threshold-${rule.id}`} className="min-w-0 flex-1">
                        Stock Threshold
                      </Label>
                      <Input
                        id={`threshold-${rule.id}`}
                        type="number"
                        value={rule.threshold || 10}
                        onChange={(e) => handleRuleUpdate(rule.id, { threshold: parseInt(e.target.value) })}
                        className="w-20"
                        min="1"
                        max="100"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`daily-limit-${rule.id}`}>
                      Limit to one notification per day
                    </Label>
                    <Switch
                      id={`daily-limit-${rule.id}`}
                      checked={rule.dailyLimit}
                      onCheckedChange={(dailyLimit) => handleRuleUpdate(rule.id, { dailyLimit })}
                    />
                  </div>

                  {rule.lastSent && (
                    <p className="text-xs text-muted-foreground">
                      Last sent: {new Date(rule.lastSent).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <ThemeSettings />
    </div>
  );
}