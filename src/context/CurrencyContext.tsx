import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface FiatCurrency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: FiatCurrency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
];

// Reliable static fallback rates relative to USD (1 USD = X Currency)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.2,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.90,
  CNY: 7.23,
};

interface CurrencyContextType {
  currency: string;
  selectedCurrencyInfo: FiatCurrency;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  convertUSD: (usdAmount: number | string) => number;
  formatFiat: (usdAmount: number | string | null | undefined, customDecimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('uniswap_fiat_currency') || 'USD';
    }
    return 'USD';
  });

  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch real-time exchange rates from open currency API
  useEffect(() => {
    let isMounted = true;
    async function fetchRates() {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates && isMounted) {
            setRates((prev) => ({
              ...prev,
              ...data.rates,
            }));
          }
        }
      } catch (err) {
        console.warn('[CurrencyContext] Failed to fetch dynamic exchange rates, using fallback rates:', err);
      } finally {
        if (isMounted) setIsLoadingRates(false);
      }
    }

    fetchRates();
    const interval = setInterval(fetchRates, 300000); // refresh every 5 mins
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniswap_fiat_currency', code);
    }
  }, []);

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const convertUSD = useCallback(
    (usdAmount: number | string): number => {
      const num = typeof usdAmount === 'string' ? parseFloat(usdAmount) : usdAmount;
      if (isNaN(num)) return 0;
      const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
      return num * rate;
    },
    [currency, rates]
  );

  const formatFiat = useCallback(
    (usdAmount: number | string | null | undefined, customDecimals?: number): string => {
      if (usdAmount === null || usdAmount === undefined || usdAmount === '') return `${selectedCurrencyInfo.symbol}0.00`;
      const converted = convertUSD(usdAmount);

      const decimals = customDecimals !== undefined 
        ? customDecimals 
        : currency === 'JPY' ? 0 : 2;

      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: selectedCurrencyInfo.code,
          currencyDisplay: 'narrowSymbol',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(converted);
      } catch {
        return `${selectedCurrencyInfo.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      }
    },
    [convertUSD, currency, selectedCurrencyInfo]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        selectedCurrencyInfo,
        setCurrency,
        rates,
        isLoadingRates,
        convertUSD,
        formatFiat,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
