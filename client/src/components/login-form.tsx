import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCompanyBranding } from "@/hooks/use-company-branding";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const { toast } = useToast();
  const { branding } = useCompanyBranding();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/login", loginData);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div 
            className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: branding.themeColor }}
          >
            {branding.companyLogo ? (
              <img 
                src={branding.companyLogo} 
                alt="Company Logo" 
                className="w-10 h-10 object-contain"
              />
            ) : (
              <i className="fas fa-bread-slice text-white text-2xl"></i>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{branding.companyName}</h1>
          <p className="text-gray-600 dark:text-gray-400">Bakery Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Default Credentials:</p>
              <div className="space-y-1 text-blue-800 dark:text-blue-200">
                <p><strong>Admin:</strong> admin@sweetreats.com / admin123</p>
                <p><strong>Manager:</strong> manager@sweetreats.com / manager123</p>
                <p><strong>Staff:</strong> staff@sweetreats.com / staff123</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}