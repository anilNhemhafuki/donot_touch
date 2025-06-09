import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const costCalculatorSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  categoryId: z.string().optional(),
  laborCost: z.string().min(0, "Labor cost must be positive").default("0"),
  overheadPercentage: z.string().min(0, "Overhead must be positive").default("15"),
  profitMargin: z.string().min(0, "Profit margin must be positive").default("25"),
  ingredients: z.array(z.object({
    inventoryItemId: z.string().min(1, "Ingredient is required"),
    quantity: z.string().min(1, "Quantity is required"),
  })).min(1, "At least one ingredient is required"),
});

interface CostCalculatorProps {
  onSave?: (productData: any) => void;
}

export default function CostCalculator({ onSave }: CostCalculatorProps) {
  const [calculations, setCalculations] = useState({
    ingredientCost: 0,
    laborCost: 0,
    overheadCost: 0,
    totalCost: 0,
    suggestedPrice: 0,
    margin: 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const form = useForm({
    resolver: zodResolver(costCalculatorSchema),
    defaultValues: {
      productName: "",
      categoryId: "",
      laborCost: "0",
      overheadPercentage: "15",
      profitMargin: "25",
      ingredients: [{ inventoryItemId: "", quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const calculateCosts = () => {
    const ingredients = form.getValues("ingredients");
    const laborCost = parseFloat(form.getValues("laborCost") || "0");
    const overheadPercentage = parseFloat(form.getValues("overheadPercentage") || "0");
    const profitMargin = parseFloat(form.getValues("profitMargin") || "0");

    // Calculate ingredient cost
    const ingredientCost = ingredients.reduce((total, ingredient) => {
      const item = inventoryItems.find((inv: any) => inv.id.toString() === ingredient.inventoryItemId);
      if (item && ingredient.quantity) {
        const quantity = parseFloat(ingredient.quantity);
        const costPerUnit = parseFloat(item.costPerUnit);
        return total + (quantity * costPerUnit);
      }
      return total;
    }, 0);

    // Calculate overhead cost
    const overheadCost = (ingredientCost + laborCost) * (overheadPercentage / 100);

    // Calculate total cost
    const totalCost = ingredientCost + laborCost + overheadCost;

    // Calculate suggested price based on profit margin
    const suggestedPrice = totalCost / (1 - profitMargin / 100);

    // Calculate actual margin
    const margin = suggestedPrice > 0 ? ((suggestedPrice - totalCost) / suggestedPrice) * 100 : 0;

    setCalculations({
      ingredientCost,
      laborCost,
      overheadCost,
      totalCost,
      suggestedPrice,
      margin,
    });
  };

  const handleSaveProduct = () => {
    const formData = form.getValues();
    const productData = {
      name: formData.productName,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      price: calculations.suggestedPrice,
      cost: calculations.totalCost,
      margin: calculations.margin,
      ingredients: formData.ingredients.map(ing => ({
        inventoryItemId: parseInt(ing.inventoryItemId),
        quantity: parseFloat(ing.quantity),
      })),
    };
    
    onSave?.(productData);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chocolate Chip Cookies" {...field} />
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
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ingredients & Costs</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ inventoryItemId: "", quantity: "" })}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Ingredient
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.inventoryItemId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredient</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            calculateCosts();
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventoryItems.map((item: any) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name} (${Number(item.costPerUnit).toFixed(2)}/{item.unit})
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
                    name={`ingredients.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="2.5" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              calculateCosts();
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
                        calculateCosts();
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

          {/* Additional Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Costs & Margins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="5.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateCosts();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overheadPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="15" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateCosts();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profitMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Profit Margin (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="25" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateCosts();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Cost Breakdown */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Ingredient Cost:</span>
              <span>${calculations.ingredientCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Labor Cost:</span>
              <span>${calculations.laborCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Overhead ({form.getValues("overheadPercentage")}%):</span>
              <span>${calculations.overheadCost.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Cost:</span>
              <span>${calculations.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-primary">
              <span>Suggested Price:</span>
              <span>${calculations.suggestedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Actual Margin:</span>
              <span>{calculations.margin.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={calculateCosts}>
          <i className="fas fa-calculator mr-2"></i>
          Recalculate
        </Button>
        <Button onClick={handleSaveProduct} disabled={!form.getValues("productName")}>
          <i className="fas fa-save mr-2"></i>
          Save as Product
        </Button>
      </div>
    </div>
  );
}
