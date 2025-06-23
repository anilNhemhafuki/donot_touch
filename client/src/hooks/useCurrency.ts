
import { useQuery } from "@tanstack/react-query";

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€", 
  GBP: "£",
  NPR: "₨"
};

export function useCurrency() {
  const { data: settings = {} } = useQuery({
    queryKey: ["/api/settings"],
  });

  const currency = settings.currency || "USD";
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || "$";

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${symbol}${numAmount.toFixed(2)}`;
  };

  const formatCurrencyWithCommas = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${symbol}${numAmount.toLocaleString()}`;
  };

  return {
    currency,
    symbol,
    formatCurrency,
    formatCurrencyWithCommas
  };
}
