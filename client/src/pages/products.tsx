import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "@/components/product-form";
import CostCalculator from "@/components/cost-calculator";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCurrency } from "@/hooks/useCurrency";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (categoryName: string) => {
    const colors: Record<string, string> = {
      Breads: "bg-blue-100 text-blue-800",
      Pastries: "bg-purple-100 text-purple-800",
      Cakes: "bg-pink-100 text-pink-800",
      Cookies: "bg-orange-100 text-orange-800",
    };
    return colors[categoryName] || "bg-gray-100 text-gray-800";
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: "Out of Stock", class: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { label: "Low Stock", class: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", class: "bg-green-100 text-green-800" };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Product Catalog
          </h1>
          <p className="text-gray-600">
            Manage your bakery products and recipes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCostCalculator(true)} variant="outline">
            <i className="fas fa-calculator mr-2"></i>
            Cost Calculator
          </Button>
          <Button onClick={() => setShowProductForm(true)}>
            <i className="fas fa-plus mr-2"></i>
            Add Product
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Input
                placeholder="Search products by name, category, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <i className="fas fa-layer-group mr-2 text-gray-500"></i>
                    All Categories
                  </div>
                </SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center">
                      <i className="fas fa-tag mr-2 text-orange-500"></i>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product: any) => {
            const stockStatus = getStockStatus(0); // Mock stock for now
            const margin = Number(product.margin);

            return (
              <Card
                key={product.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-0 shadow-md"
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-cookie-bite text-white text-xl"></i>
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          {product.name}
                        </CardTitle>
                        {product.categoryName && (
                          <Badge
                            className={`${getCategoryBadge(product.categoryName)} shadow-sm`}
                          >
                            <i className="fas fa-tag mr-1"></i>
                            {product.categoryName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                          <i className="fas fa-dollar-sign mr-1"></i>
                          Price
                        </span>
                        <span className="font-bold text-green-800 dark:text-green-200">
                          {formatCurrency(Number(product.price))}
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          <i className="fas fa-coins mr-1"></i>
                          Cost
                        </span>
                        <span className="font-bold text-blue-800 dark:text-blue-200">
                          {formatCurrency(Number(product.cost))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    margin > 50 
                      ? "bg-green-50 dark:bg-green-900/20" 
                      : margin > 25 
                        ? "bg-yellow-50 dark:bg-yellow-900/20" 
                        : "bg-red-50 dark:bg-red-900/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        margin > 50 
                          ? "text-green-700 dark:text-green-300" 
                          : margin > 25 
                            ? "text-yellow-700 dark:text-yellow-300" 
                            : "text-red-700 dark:text-red-300"
                      }`}>
                        <i className={`fas ${
                          margin > 50 ? "fa-arrow-up" : margin > 25 ? "fa-minus" : "fa-arrow-down"
                        } mr-1`}></i>
                        Margin
                      </span>
                      <span className={`font-bold text-lg ${
                        margin > 50 
                          ? "text-green-800 dark:text-green-200" 
                          : margin > 25 
                            ? "text-yellow-800 dark:text-yellow-200" 
                            : "text-red-800 dark:text-red-200"
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteProductMutation.mutate(product.id)}
                      disabled={deleteProductMutation.isPending}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <i className="fas fa-cookie-bite text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search criteria"
                : "Start by adding your first product"}
            </p>
            <Button onClick={() => setShowProductForm(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Your First Product
            </Button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <Dialog
        open={showProductForm}
        onOpenChange={(open) => {
          setShowProductForm(open);
          if (!open) setEditingProduct(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Cost Calculator Modal */}
      <Dialog open={showCostCalculator} onOpenChange={setShowCostCalculator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Cost Calculator</DialogTitle>
          </DialogHeader>
          <CostCalculator
            onSave={(productData) => {
              setShowCostCalculator(false);
              setEditingProduct(productData);
              setShowProductForm(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
