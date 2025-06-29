import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const costCalculatorSchema = z.object({
  rawMaterialCost: z.string().default("0"),
  laborCost: z.string().default("0"),
  overheadCost: z.string().default("0"),
  shippingCost: z.string().default("0"),
  taxRate: z.string().default("0"),
  otherCosts: z.string().default("0"),
  marginType: z.enum(["percentage", "fixed"]).default("percentage"),
  marginValue: z.string().default("20"),
  pricingMode: z.enum(["auto", "manual"]).default("auto"),
  manualSalesPrice: z.string().default("0"),
});

// Helper function to safely parse numbers and avoid NaN
const safeParseFloat = (value: string | undefined): number => {
  if (!value || value.trim() === "") return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

interface CostCalculatorProps {
  initialData?: {
    cost?: number;
    price?: number;
    margin?: number;
  };
  onCalculationChange: (calculations: {
    costPrice: number;
    salesPrice: number;
    marginAmount: number;
    marginPercentage: number;
  }) => void;
  onSave?: () => void;
}

export default function SimpleCostCalculator({
  initialData,
  onCalculationChange,
  onSave,
}: CostCalculatorProps) {
  const { formatCurrency } = useCurrency();
  const [calculations, setCalculations] = useState({
    totalCostPrice: 0,
    salesPrice: 0,
    marginAmount: 0,
    marginPercentage: 0,
    breakdown: {
      rawMaterials: 0,
      labor: 0,
      overhead: 0,
      shipping: 0,
      taxes: 0,
      other: 0,
    },
  });

  const form = useForm({
    resolver: zodResolver(costCalculatorSchema),
    defaultValues: {
      rawMaterialCost: "0",
      laborCost: "0",
      overheadCost: "0",
      shippingCost: "0",
      taxRate: "0",
      otherCosts: "0",
      marginType: "percentage",
      marginValue: "20",
      pricingMode: "auto",
      manualSalesPrice: "0",
    },
  });

  const recalculateAll = () => {
    const formValues = form.getValues();
    
    // Calculate individual cost components
    const rawMaterials = safeParseFloat(formValues.rawMaterialCost);
    const labor = safeParseFloat(formValues.laborCost);
    const overhead = safeParseFloat(formValues.overheadCost);
    const shipping = safeParseFloat(formValues.shippingCost);
    const other = safeParseFloat(formValues.otherCosts);
    
    // Calculate base cost before taxes
    const baseCost = rawMaterials + labor + overhead + shipping + other;
    
    // Calculate taxes
    const taxRate = safeParseFloat(formValues.taxRate);
    const taxes = baseCost * (taxRate / 100);
    
    // Total cost price
    const totalCostPrice = baseCost + taxes;

    // Calculate sales price and margin
    let salesPrice = 0;
    let marginAmount = 0;
    let marginPercentage = 0;

    if (formValues.pricingMode === "manual") {
      salesPrice = safeParseFloat(formValues.manualSalesPrice);
      marginAmount = salesPrice - totalCostPrice;
      marginPercentage = totalCostPrice > 0 ? (marginAmount / totalCostPrice) * 100 : 0;
    } else {
      const marginValue = safeParseFloat(formValues.marginValue);
      
      if (formValues.marginType === "percentage") {
        marginAmount = totalCostPrice * (marginValue / 100);
        marginPercentage = marginValue;
      } else {
        marginAmount = marginValue;
        marginPercentage = totalCostPrice > 0 ? (marginAmount / totalCostPrice) * 100 : 0;
      }
      
      salesPrice = totalCostPrice + marginAmount;
    }

    const newCalculations = {
      totalCostPrice,
      salesPrice,
      marginAmount,
      marginPercentage,
      breakdown: {
        rawMaterials,
        labor,
        overhead,
        shipping,
        taxes,
        other,
      },
    };

    setCalculations(newCalculations);
    
    // Notify parent component with safe values
    onCalculationChange({
      costPrice: totalCostPrice,
      salesPrice: salesPrice,
      marginAmount: marginAmount,
      marginPercentage: marginPercentage,
    });
  };

  // Recalculate when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      recalculateAll();
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Initialize with existing data
  useEffect(() => {
    if (initialData) {
      if (initialData.cost) {
        form.setValue("rawMaterialCost", initialData.cost.toString());
      }
      if (initialData.price && initialData.cost) {
        const margin = initialData.price - initialData.cost;
        const marginPercentage = (margin / initialData.cost) * 100;
        form.setValue("marginValue", marginPercentage.toFixed(2));
        if (initialData.price) {
          form.setValue("manualSalesPrice", initialData.price.toString());
        }
      }
    }
  }, [initialData]);

  const handleNumberInput = (value: string, onChange: (value: string) => void) => {
    // Only allow valid numbers or empty string
    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Calculator
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure cost components and pricing strategy
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Total Cost: {formatCurrency(calculations.totalCostPrice)}
        </Badge>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Components */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="rawMaterialCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Materials</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Cost</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overheadCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead Cost</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Cost</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Costs</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          {...field}
                          onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="pricingMode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Pricing Mode</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="pricing-mode">Auto</Label>
                          <Switch
                            id="pricing-mode"
                            checked={field.value === "manual"}
                            onCheckedChange={(checked) => 
                              field.onChange(checked ? "manual" : "auto")
                            }
                          />
                          <Label htmlFor="pricing-mode">Manual</Label>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("pricingMode") === "manual" ? (
                  <FormField
                    control={form.control}
                    name="manualSalesPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter sales price"
                            {...field}
                            onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="marginType"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Margin Type</FormLabel>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="margin-type">%</Label>
                              <Switch
                                id="margin-type"
                                checked={field.value === "fixed"}
                                onCheckedChange={(checked) => 
                                  field.onChange(checked ? "fixed" : "percentage")
                                }
                              />
                              <Label htmlFor="margin-type">Fixed</Label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marginValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Margin {form.watch("marginType") === "percentage" ? "(%)" : "(Amount)"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0"
                              {...field}
                              onChange={(e) => handleNumberInput(e.target.value, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calculation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Calculation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Raw Materials:</span>
                    <span>{formatCurrency(calculations.breakdown.rawMaterials)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span>{formatCurrency(calculations.breakdown.labor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span>{formatCurrency(calculations.breakdown.overhead)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(calculations.breakdown.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>{formatCurrency(calculations.breakdown.taxes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other:</span>
                    <span>{formatCurrency(calculations.breakdown.other)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 font-medium">
                  <div className="flex justify-between text-lg">
                    <span>Total Cost Price:</span>
                    <span className="text-blue-600">{formatCurrency(calculations.totalCostPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Sales Price:</span>
                    <span className="text-green-600">{formatCurrency(calculations.salesPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin Amount:</span>
                    <span className="text-purple-600">{formatCurrency(calculations.marginAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin %:</span>
                    <span className="text-purple-600">{calculations.marginPercentage.toFixed(2)}%</span>
                  </div>
                </div>

                {calculations.marginAmount < 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 font-medium">
                      Warning: Negative margin detected. Consider adjusting pricing.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {onSave && (
              <Button onClick={onSave} className="w-full" size="lg">
                Apply Calculations to Product
              </Button>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}