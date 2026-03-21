// 'use client';

// import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { getExchangeRates, convertToUSD, convertFromUSD, formatCurrencyValue, fetchFreshRates } from './exchange-rates';
// import { supabase } from './supabase';

// interface CurrencyContextType {
//   displayCurrency: string;
//   setDisplayCurrency: (c: string) => void;
//   rates: Record<string, number>;
//   ratesLoading: boolean;
//   lastUpdated: string | null;
//   toDisplay: (amount: number, fromCurrency: string) => number;
//   formatDisplay: (amount: number, fromCurrency?: string) => string;
//   refreshRates: () => Promise<void>;
// }

// const CurrencyContext = createContext<CurrencyContextType>({
//   displayCurrency: 'USD',
//   setDisplayCurrency: () => {},
//   rates: { USD: 1 },
//   ratesLoading: true,
//   lastUpdated: null,
//   toDisplay: (a) => a,
//   formatDisplay: (a) => `$${a.toFixed(2)}`,
//   refreshRates: async () => {},
// });

// export function CurrencyProvider({ children }: { children: React.ReactNode }) {
//   const [displayCurrency, setDisplayCurrency] = useState('USD');
//   const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
//   const [ratesLoading, setRatesLoading] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState<string | null>(null);

//   const loadRates = useCallback(async () => {
//     setRatesLoading(true);
//     const data = await getExchangeRates();
//     if (data) {
//       setRates(data.rates);
//       setLastUpdated(data.last_updated);
//     }
//     setRatesLoading(false);
//   }, []);

//   useEffect(() => {
//     loadRates();
//   }, [loadRates]);

//   const refreshRates = async () => {
//     setRatesLoading(true);
//     const freshRates = await fetchFreshRates();
//     const { data } = await supabase
//       .from('exchange_rates')
//       .upsert({
//         id: 1,
//         base_currency: 'USD',
//         rates: freshRates,
//         last_updated: new Date().toISOString(),
//       })
//       .select()
//       .maybeSingle();
//     if (data) {
//       setRates(data.rates);
//       setLastUpdated(data.last_updated);
//     }
//     setRatesLoading(false);
//   };

//   const toDisplay = useCallback((amount: number, fromCurrency: string) => {
//     const usd = convertToUSD(amount, fromCurrency, rates);
//     return convertFromUSD(usd, displayCurrency, rates);
//   }, [rates, displayCurrency]);

//   const formatDisplay = useCallback((amount: number, fromCurrency?: string) => {
//     const converted = fromCurrency ? toDisplay(amount, fromCurrency) : convertFromUSD(amount, displayCurrency, rates);
//     return formatCurrencyValue(converted, displayCurrency);
//   }, [toDisplay, displayCurrency, rates]);

//   return (
//     <CurrencyContext.Provider
//       value={{
//         displayCurrency,
//         setDisplayCurrency,
//         rates,
//         ratesLoading,
//         lastUpdated,
//         toDisplay,
//         formatDisplay,
//         refreshRates,
//       }}
//     >
//       {children}
//     </CurrencyContext.Provider>
//   );
// }

// export function useCurrency() {
//   return useContext(CurrencyContext);
// }






// 'use client';

// import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
// import { getExchangeRates, convertToUSD, convertFromUSD, formatCurrencyValue, fetchFreshRates } from './exchange-rates';
// import { supabase } from './supabase';

// interface CurrencyContextType {
//   displayCurrency: string;
//   setDisplayCurrency: (c: string) => void;
//   rates: Record<string, number>;
//   ratesLoading: boolean;
//   lastUpdated: string | null;
//   toDisplay: (amount: number, fromCurrency: string) => number;
//   formatDisplay: (amount: number, fromCurrency?: string) => string;
//   refreshRates: () => Promise<void>;
// }

// const CurrencyContext = createContext<CurrencyContextType>({
//   displayCurrency: 'USD',
//   setDisplayCurrency: () => {},
//   rates: { USD: 1 },
//   ratesLoading: true,
//   lastUpdated: null,
//   toDisplay: (a) => a,
//   formatDisplay: (a) => `$${a.toFixed(2)}`,
//   refreshRates: async () => {},
// });

// export function CurrencyProvider({ children }: { children: React.ReactNode }) {
//   const [displayCurrency, setDisplayCurrency] = useState('USD');
//   const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
//   const [ratesLoading, setRatesLoading] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState<string | null>(null);

//   const loadRates = useCallback(async () => {
//     setRatesLoading(true);
//     const data = await getExchangeRates();
//     if (data) {
//       setRates(data.rates);
//       setLastUpdated(data.last_updated);
//     }
//     setRatesLoading(false);
//   }, []);

//   useEffect(() => {
//     loadRates();
//   }, [loadRates]);

//   const refreshRates = useCallback(async () => {
//     setRatesLoading(true);
//     const freshRates = await fetchFreshRates();
//     const { data } = await supabase
//       .from('exchange_rates')
//       .upsert({
//         id: 1,
//         base_currency: 'USD',
//         rates: freshRates,
//         last_updated: new Date().toISOString(),
//       })
//       .select()
//       .maybeSingle();
//     if (data) {
//       setRates(data.rates);
//       setLastUpdated(data.last_updated);
//     }
//     setRatesLoading(false);
//   }, []);

//   const toDisplay = useCallback((amount: number, fromCurrency: string) => {
//     const usd = convertToUSD(amount, fromCurrency, rates);
//     return convertFromUSD(usd, displayCurrency, rates);
//   }, [rates, displayCurrency]);

//   const formatDisplay = useCallback((amount: number, fromCurrency?: string) => {
//     const converted = fromCurrency ? toDisplay(amount, fromCurrency) : convertFromUSD(amount, displayCurrency, rates);
//     return formatCurrencyValue(converted, displayCurrency);
//   }, [toDisplay, displayCurrency, rates]);

//   const value = useMemo(() => ({
//     displayCurrency,
//     setDisplayCurrency,
//     rates,
//     ratesLoading,
//     lastUpdated,
//     toDisplay,
//     formatDisplay,
//     refreshRates,
//   }), [displayCurrency, rates, ratesLoading, lastUpdated, toDisplay, formatDisplay, refreshRates]);

//   return (
//     <CurrencyContext.Provider value={value}>
//       {children}
//     </CurrencyContext.Provider>
//   );
// }

// export function useCurrency() {
//   return useContext(CurrencyContext);
// }





















'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getExchangeRates, convertToUSD, convertFromUSD, formatCurrencyValue } from './exchange-rates';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (c: string) => void;
  rates: Record<string, number>;
  ratesLoading: boolean;
  lastUpdated: string | null;
  toDisplay: (amount: number, fromCurrency: string) => number;
  formatDisplay: (amount: number, fromCurrency?: string) => string;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  displayCurrency: 'USD',
  setDisplayCurrency: () => {},
  rates: { USD: 1 },
  ratesLoading: true,
  lastUpdated: null,
  toDisplay: (a) => a,
  formatDisplay: (a) => `$${a.toFixed(2)}`,
  refreshRates: async () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    const data = await getExchangeRates();
    if (data) {
      setRates(data.rates);
      setLastUpdated(data.last_updated);
    }
    setRatesLoading(false);
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Force refresh via API
  const refreshRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/exchange-rates', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates);
        setLastUpdated(data.last_updated);
      }
    } catch (err) {
      console.error('Failed to refresh rates:', err);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const toDisplay = useCallback((amount: number, fromCurrency: string) => {
    const usd = convertToUSD(amount, fromCurrency, rates);
    return convertFromUSD(usd, displayCurrency, rates);
  }, [rates, displayCurrency]);

  const formatDisplay = useCallback((amount: number, fromCurrency?: string) => {
    const converted = fromCurrency
      ? toDisplay(amount, fromCurrency)
      : convertFromUSD(amount, displayCurrency, rates);
    return formatCurrencyValue(converted, displayCurrency);
  }, [toDisplay, displayCurrency, rates]);

  const value = useMemo(() => ({
    displayCurrency,
    setDisplayCurrency,
    rates,
    ratesLoading,
    lastUpdated,
    toDisplay,
    formatDisplay,
    refreshRates,
  }), [displayCurrency, rates, ratesLoading, lastUpdated, toDisplay, formatDisplay, refreshRates]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}