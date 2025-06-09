import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";

const orderFormSchema = insertOrderSchema.extend({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  totalAmount: z.string().min(1, "Total amount is required"),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unitPrice: z.string().min(1, "Unit price is required"),
  })).min(1, "At least one item is required"),
});

interface OrderFormProps {
  onSuccess?: () => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      totalAmount: "",
      dueDate: "",
      notes: "",
      items: [{ productId: "", quantity: "", unitPrice: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const transformedData = {
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        totalAmount: parseFloat(data.totalAmount),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
        status: "pending",
        items: data.items.map((item: any) => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };

      await apiRequest("POST", "/api/orders", transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Order created successfully",
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
        description: "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    const items = form.getValues("items");
    const total = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || "0");
      const unitPrice = parseFloat(item.unitPrice || "0");
      return sum + (quantity * unitPrice);
    }, 0);
    
    form.setValue("totalAmount", total.toFixed(2));
  };

  const updateItemPrice = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id.toString() === productId);
    if (product) {
      form.setValue(`items.${index}.unitPrice`, product.price.toString());
      calculateTotal();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => append({ productId: "", quantity: "", unitPrice: "" })}
              >
                <i className="fas fa-plus mr-2"></i>
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          updateItemPrice(index, value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
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
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            calculateTotal();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="8.50" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateTotal();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      remove(index);
                      calculateTotal();
                    }}
                    disabled={fields.length === 1}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      readOnly
                      className="bg-gray-50 font-semibold text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Special instructions or requests..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <i className="fas fa-spinner fa-spin mr-2"></i>}
            Create Order
          </Button>
        </div>
      </form>
    </Form>
  );
}
