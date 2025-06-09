import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">
            Welcome back, {user?.firstName || 'there'}! Here's what's happening at your bakery today.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Search products, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </form>
          
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative p-2">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-600">{user?.role || 'Staff'}</p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-white"></i>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
