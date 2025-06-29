import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MediaLibrary from "./media-library";
import SimpleCostCalculator from "./simple-cost-calculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCurrency } from "@/hooks/useCurrency";
import { Calculator } from "lucide-react";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  cost: z.string().min(1, "Cost is required"),
  margin: z.string().min(1, "Margin is required"),
});

interface ProductFormProps {
  product?: any;
  onSuccess?: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [costCalculations, setCostCalculations] = useState({
    costPrice: 0,
    salesPrice: 0,
    marginAmount: 0,
    marginPercentage: 0,
  });
  const { toast } = useToast();
  const { symbol } = useCurrency();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["/api/units"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      unitId: "",
      price: "",
      cost: "",
      margin: "",
      sku: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId?.toString() || "",
        unitId: product.unitId?.toString() || "",
        price: product.price?.toString() || "",
        cost: product.cost?.toString() || "",
        margin: product.margin?.toString() || "",
        sku: product.sku || "",
      });
      setSelectedImage(product.imageUrl || "");
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Safe number parsing to prevent NaN errors
      const safeParseFloat = (value: string | number): number => {
        if (typeof value === 'number') return isNaN(value) ? 0 : value;
        const parsed = parseFloat(value || '0');
        return isNaN(parsed) ? 0 : parsed;
      };

      const safeParseInt = (value: string | number): number | null => {
        if (!value) return null;
        const parsed = parseInt(value.toString());
        return isNaN(parsed) ? null : parsed;
      };

      const transformedData = {
        ...data,
        categoryId: safeParseInt(data.categoryId),
        unitId: safeParseInt(data.unitId),
        price: safeParseFloat(data.price),
        cost: safeParseFloat(data.cost),
        margin: safeParseFloat(data.margin),
        imageUrl: selectedImage || null,
      };

      if (product) {
        await apiRequest("PUT", `/api/products/${product.id}`, transformedData);
      } else {
        await apiRequest("POST", "/api/products", transformedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: product
          ? "Product updated successfully"
          : "Product created successfully",
      });
      onSuccess?.();
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
        description: product
          ? "Failed to update product"
          : "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const calculateMargin = () => {
    const price = parseFloat(form.getValues("price") || "0");
    const cost = parseFloat(form.getValues("cost") || "0");

    if (price > 0 && cost > 0) {
      const margin = price - cost;
      form.setValue("margin", margin.toFixed(2));
    }
  };

  const handleCostCalculationChange = (calculations: {
    costPrice: number;
    salesPrice: number;
    marginAmount: number;
    marginPercentage: number;
  }) => {
    setCostCalculations(calculations);
    // Update form fields with calculated values
    form.setValue("cost", calculations.costPrice.toFixed(2));
    form.setValue("price", calculations.salesPrice.toFixed(2));
    form.setValue("margin", calculations.marginAmount.toFixed(2));
  };

  const applyCostCalculations = () => {
    // The values are already applied via handleCostCalculationChange
    toast({
      title: "Success",
      description: "Cost calculations applied to product form",
    });
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="calculator" className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Cost Calculator
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bread" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories as any[]).map((category: any) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(units as any[]).map((unit: any) => (
                          <SelectItem
                            key={unit.id}
                            value={unit.id.toString()}
                          >
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Product SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Making Process..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          calculateMargin();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          calculateMargin();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="margin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margin ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        readOnly
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                )}
                {product ? "Update" : "Create"} Product
              </Button>
            </div>

            <MediaLibrary
              isOpen={showMediaLibrary}
              onClose={() => setShowMediaLibrary(false)}
              onSelect={(imageUrl) => setSelectedImage(imageUrl)}
            />
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="calculator">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Calculator
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Current Cost: {symbol}{form.watch("cost") || "0"}
              </Badge>
              <Badge variant="outline">
                Current Price: {symbol}{form.watch("price") || "0"}
              </Badge>
              <Badge variant="outline">
                Current Margin: {symbol}{form.watch("margin") || "0"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <SimpleCostCalculator
              initialData={{
                cost: parseFloat(form.watch("cost") || "0"),
                price: parseFloat(form.watch("price") || "0"),
                margin: parseFloat(form.watch("margin") || "0"),
              }}
              onCalculationChange={handleCostCalculationChange}
              onSave={applyCostCalculations}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}