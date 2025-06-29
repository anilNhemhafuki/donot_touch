import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface CostCalculatorProps {
  initialCost?: number;
  initialPrice?: number;
  initialMargin?: number;
  onCalculationChange: (calculations: {
    costPrice: number;
    salesPrice: number;
    marginAmount: number;
    marginPercentage: number;
  }) => void;
}

export default function CostCalculator({
  initialCost = 0,
  initialPrice = 0,
  initialMargin = 0,
  onCalculationChange,
}: CostCalculatorProps) {
  const { symbol } = useCurrency();
  
  // Input states
  const [rawMaterials, setRawMaterials] = useState<number>(0);
  const [laborCosts, setLaborCosts] = useState<number>(0);
  const [overheadCosts, setOverheadCosts] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [marginPercentage, setMarginPercentage] = useState<number>(25);
  const [manualSalesPrice, setManualSalesPrice] = useState<number>(0);
  const [useManualPrice, setUseManualPrice] = useState<boolean>(false);

  // Calculated values
  const [calculations, setCalculations] = useState({
    totalCostPrice: 0,
    calculatedSalesPrice: 0,
    finalSalesPrice: 0,
    marginAmount: 0,
    finalMarginPercentage: 0,
  });

  // Initialize with existing values
  useEffect(() => {
    if (initialCost > 0) {
      setRawMaterials(initialCost * 0.6); // Estimate 60% raw materials
      setLaborCosts(initialCost * 0.25); // Estimate 25% labor
      setOverheadCosts(initialCost * 0.15); // Estimate 15% overhead
    }
    if (initialPrice > 0) {
      setManualSalesPrice(initialPrice);
      setUseManualPrice(true);
    }
    if (initialMargin > 0 && initialPrice > 0) {
      const calculatedMarginPercentage = (initialMargin / initialPrice) * 100;
      setMarginPercentage(calculatedMarginPercentage);
    }
  }, [initialCost, initialPrice, initialMargin]);

  // Real-time calculations
  useEffect(() => {
    const totalCostPrice = rawMaterials + laborCosts + overheadCosts + otherCosts;
    const calculatedSalesPrice = totalCostPrice * (1 + marginPercentage / 100);
    const finalSalesPrice = useManualPrice ? manualSalesPrice : calculatedSalesPrice;
    const marginAmount = finalSalesPrice - totalCostPrice;
    const finalMarginPercentage = totalCostPrice > 0 ? (marginAmount / totalCostPrice) * 100 : 0;

    const newCalculations = {
      totalCostPrice,
      calculatedSalesPrice,
      finalSalesPrice,
      marginAmount,
      finalMarginPercentage,
    };

    setCalculations(newCalculations);

    // Notify parent component
    onCalculationChange({
      costPrice: totalCostPrice,
      salesPrice: finalSalesPrice,
      marginAmount,
      marginPercentage: finalMarginPercentage,
    });
  }, [rawMaterials, laborCosts, overheadCosts, otherCosts, marginPercentage, manualSalesPrice, useManualPrice, onCalculationChange]);

  const handleNumberInput = (value: string, setter: (val: number) => void) => {
    const numValue = parseFloat(value) || 0;
    setter(numValue);
  };

  const resetCalculator = () => {
    setRawMaterials(0);
    setLaborCosts(0);
    setOverheadCosts(0);
    setOtherCosts(0);
    setMarginPercentage(25);
    setManualSalesPrice(0);
    setUseManualPrice(false);
  };

  return (
    <div className="space-y-6">
      {/* Cost Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Raw Materials ({symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={rawMaterials || ""}
                onChange={(e) => handleNumberInput(e.target.value, setRawMaterials)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Labor Costs ({symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={laborCosts || ""}
                onChange={(e) => handleNumberInput(e.target.value, setLaborCosts)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Overhead Costs ({symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={overheadCosts || ""}
                onChange={(e) => handleNumberInput(e.target.value, setOverheadCosts)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Other Costs ({symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={otherCosts || ""}
                onChange={(e) => handleNumberInput(e.target.value, setOtherCosts)}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Margin (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={marginPercentage || ""}
                onChange={(e) => handleNumberInput(e.target.value, setMarginPercentage)}
                placeholder="25"
                disabled={useManualPrice}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useManualPrice}
                  onChange={(e) => setUseManualPrice(e.target.checked)}
                />
                Manual Sales Price ({symbol})
              </Label>
              <Input
                type="number"
                step="0.01"
                value={manualSalesPrice || ""}
                onChange={(e) => handleNumberInput(e.target.value, setManualSalesPrice)}
                placeholder="0.00"
                disabled={!useManualPrice}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <Label className="text-sm text-gray-600">Total Cost Price</Label>
              <Badge variant="outline" className="text-lg font-bold block mt-1">
                {symbol}{calculations.totalCostPrice.toFixed(2)}
              </Badge>
            </div>
            
            <div className="text-center">
              <Label className="text-sm text-gray-600">Sales Price</Label>
              <Badge variant="outline" className="text-lg font-bold block mt-1">
                {symbol}{calculations.finalSalesPrice.toFixed(2)}
              </Badge>
            </div>
            
            <div className="text-center">
              <Label className="text-sm text-gray-600">Margin Amount</Label>
              <Badge 
                variant={calculations.marginAmount > 0 ? "default" : "destructive"} 
                className="text-lg font-bold block mt-1"
              >
                {symbol}{calculations.marginAmount.toFixed(2)}
              </Badge>
            </div>
            
            <div className="text-center">
              <Label className="text-sm text-gray-600">Margin %</Label>
              <Badge 
                variant={calculations.finalMarginPercentage > 0 ? "default" : "destructive"} 
                className="text-lg font-bold block mt-1"
              >
                {calculations.finalMarginPercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {useManualPrice ? "Using manual pricing" : "Using margin-based pricing"}
            </div>
            <Button variant="outline" size="sm" onClick={resetCalculator}>
              Reset Calculator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}