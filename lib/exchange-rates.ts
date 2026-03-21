
import type { ExchangeRates } from './types';

const FIAT_API = 'https://open.er-api.com/v6/latest/USD';
const CRYPTO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd';

const ONE_HOUR = 60 * 60 * 1000;

export async function fetchFreshRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { USD: 1 };

  try {
    const fiatRes = await fetch(FIAT_API);
    if (fiatRes.ok) {
      const fiatData = await fiatRes.json();
      if (fiatData.rates) {
        rates.CAD  = fiatData.rates.CAD  || 1.36;
        rates.EUR  = fiatData.rates.EUR  || 0.87;
        rates.GBP  = fiatData.rates.GBP  || 0.75;
        rates.AED  = fiatData.rates.AED  || 3.67;
        rates.AUD  = fiatData.rates.AUD  || 1.40;
      }
    }
  } catch {
    rates.CAD = 1.36;
    rates.EUR = 0.87;
    rates.GBP = 0.75;
    rates.AED = 3.67;
    rates.AUD = 1.40;
  }

  try {
    const cryptoRes = await fetch(CRYPTO_API);
    if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      if (cryptoData.bitcoin?.usd)  rates.BTC  = 1 / cryptoData.bitcoin.usd;
      if (cryptoData.tether?.usd)   rates.USDT = 1 / cryptoData.tether.usd;
    }
  } catch {
    rates.BTC  = 1 / 60000;
    rates.USDT = 1;
  }

  if (!rates.BTC)  rates.BTC  = 1 / 60000;
  if (!rates.USDT) rates.USDT = 1;

  return rates;
}

// Fetch rates via API route (no direct DB access from client)
export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch('/api/exchange-rates');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function convertToUSD(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === 'USD' || !rates[currency]) return amount;
  return amount / rates[currency];
}

export function convertFromUSD(amountUSD: number, targetCurrency: string, rates: Record<string, number>): number {
  if (targetCurrency === 'USD' || !rates[targetCurrency]) return amountUSD;
  return amountUSD * rates[targetCurrency];
}

export function formatCurrencyValue(amount: number, currency: string): string {
  if (currency === 'BTC') {
    return `${amount.toFixed(6)} BTC`;
  }
  if (currency === 'USDT') {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }

  const symbols: Record<string, string> = {
    USD: '$',
    CAD: 'CA$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    AUD: 'A$',
  };

  const symbol = symbols[currency] || '$';
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

