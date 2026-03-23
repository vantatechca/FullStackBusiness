
// import type { ExchangeRates } from './types';

// const FIAT_API = 'https://open.er-api.com/v6/latest/USD';
// const CRYPTO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd';

// const ONE_HOUR = 60 * 60 * 1000;

// export async function fetchFreshRates(): Promise<Record<string, number>> {
//   const rates: Record<string, number> = { USD: 1 };

//   try {
//     const fiatRes = await fetch(FIAT_API);
//     if (fiatRes.ok) {
//       const fiatData = await fiatRes.json();
//       if (fiatData.rates) {
//         rates.CAD  = fiatData.rates.CAD  || 1.36;
//         rates.EUR  = fiatData.rates.EUR  || 0.87;
//         rates.GBP  = fiatData.rates.GBP  || 0.75;
//         rates.AED  = fiatData.rates.AED  || 3.67;
//         rates.AUD  = fiatData.rates.AUD  || 1.40;
//       }
//     }
//   } catch {
//     rates.CAD = 1.36;
//     rates.EUR = 0.87;
//     rates.GBP = 0.75;
//     rates.AED = 3.67;
//     rates.AUD = 1.40;
//   }

//   try {
//     const cryptoRes = await fetch(CRYPTO_API);
//     if (cryptoRes.ok) {
//       const cryptoData = await cryptoRes.json();
//       if (cryptoData.bitcoin?.usd)  rates.BTC  = 1 / cryptoData.bitcoin.usd;
//       if (cryptoData.tether?.usd)   rates.USDT = 1 / cryptoData.tether.usd;
//     }
//   } catch {
//     rates.BTC  = 1 / 60000;
//     rates.USDT = 1;
//   }

//   if (!rates.BTC)  rates.BTC  = 1 / 60000;
//   if (!rates.USDT) rates.USDT = 1;

//   return rates;
// }

// // Fetch rates via API route (no direct DB access from client)
// export async function getExchangeRates(): Promise<ExchangeRates | null> {
//   try {
//     const res = await fetch('/api/exchange-rates');
//     if (!res.ok) return null;
//     return res.json();
//   } catch {
//     return null;
//   }
// }

// export function convertToUSD(amount: number, currency: string, rates: Record<string, number>): number {
//   if (currency === 'USD' || !rates[currency]) return amount;
//   return amount / rates[currency];
// }

// export function convertFromUSD(amountUSD: number, targetCurrency: string, rates: Record<string, number>): number {
//   if (targetCurrency === 'USD' || !rates[targetCurrency]) return amountUSD;
//   return amountUSD * rates[targetCurrency];
// }

// export function formatCurrencyValue(amount: number, currency: string): string {
//   if (currency === 'BTC') {
//     return `${amount.toFixed(6)} BTC`;
//   }
//   if (currency === 'USDT') {
//     return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
//   }

//   const symbols: Record<string, string> = {
//     USD: '$',
//     CAD: 'CA$',
//     EUR: '€',
//     GBP: '£',
//     AED: 'AED ',
//     AUD: 'A$',
//   };

//   const symbol = symbols[currency] || '$';
//   return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }




import type { ExchangeRates } from './types';

// Frankfurter — ECB-backed, free, no key required, updates daily
const FIAT_API = 'https://api.frankfurter.app/latest?from=USD&to=CAD,EUR,GBP,AUD,AED';

// CoinGecko free tier — rate limited, handle gracefully
const CRYPTO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd';

export async function fetchFreshRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { USD: 1 };

  // ── Fiat rates (ECB via Frankfurter) ──────────────────────────────────────
  try {
    const fiatRes = await fetch(FIAT_API, {
      headers: { 'Accept': 'application/json' },
      // 10s timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (fiatRes.ok) {
      const fiatData = await fiatRes.json();
      // Frankfurter returns { base: 'USD', rates: { CAD: 1.36, ... } }
      if (fiatData.rates) {
        if (fiatData.rates.CAD) rates.CAD = fiatData.rates.CAD;
        if (fiatData.rates.EUR) rates.EUR = fiatData.rates.EUR;
        if (fiatData.rates.GBP) rates.GBP = fiatData.rates.GBP;
        if (fiatData.rates.AED) rates.AED = fiatData.rates.AED;
        if (fiatData.rates.AUD) rates.AUD = fiatData.rates.AUD;
      }
    } else {
      console.warn(`Fiat API returned ${fiatRes.status}, using fallback rates`);
      applyFiatFallbacks(rates);
    }
  } catch (err) {
    console.warn('Fiat fetch failed:', err);
    applyFiatFallbacks(rates);
  }

  // ── Crypto rates (CoinGecko) ──────────────────────────────────────────────
  try {
    const cryptoRes = await fetch(CRYPTO_API, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (cryptoRes.status === 429) {
      // Rate limited — skip crypto entirely rather than use stale fallback
      console.warn('CoinGecko rate limited — crypto rates skipped this refresh');
    } else if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      // Store as "how many BTC per 1 USD" = 1 / price_in_usd
      if (cryptoData.bitcoin?.usd)  rates.BTC  = 1 / cryptoData.bitcoin.usd;
      // USDT is pegged ~1:1 with USD, use live rate if available
      if (cryptoData.tether?.usd)   rates.USDT = 1 / cryptoData.tether.usd;
    } else {
      console.warn(`Crypto API returned ${cryptoRes.status}`);
    }
  } catch (err) {
    console.warn('Crypto fetch failed:', err);
  }

  // USDT is pegged to USD — safe hardcoded fallback if CoinGecko failed
  if (!rates.USDT) rates.USDT = 1;
  // BTC: do NOT fall back to a hardcoded value — omit it so conversions are skipped
  // rather than silently wrong. Re-fetch will pick it up next refresh cycle.

  return rates;
}

// Fiat fallbacks — updated periodically, only used if API is unreachable
function applyFiatFallbacks(rates: Record<string, number>) {
  rates.CAD = rates.CAD ?? 1.38;
  rates.EUR = rates.EUR ?? 0.92;
  rates.GBP = rates.GBP ?? 0.79;
  rates.AED = rates.AED ?? 3.67; // AED is pegged to USD, very stable
  rates.AUD = rates.AUD ?? 1.55;
}

// ── Client-side helpers ───────────────────────────────────────────────────────

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch('/api/exchange-rates');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function convertToUSD(
  amount: number,
  currency: string,
  rates: Record<string, number>,
): number {
  if (!amount) return 0;
  if (currency === 'USD') return amount;
  if (!rates[currency]) {
    console.warn(`No rate for ${currency}, treating as USD`);
    return amount;
  }
  return amount / rates[currency];
}

export function convertFromUSD(
  amountUSD: number,
  targetCurrency: string,
  rates: Record<string, number>,
): number {
  if (!amountUSD) return 0;
  if (targetCurrency === 'USD') return amountUSD;
  if (!rates[targetCurrency]) return amountUSD;
  return amountUSD * rates[targetCurrency];
}

export function formatCurrencyValue(amount: number, currency: string): string {
  if (currency === 'BTC') {
    return `${amount.toFixed(8)} BTC`;
  }
  if (currency === 'USDT') {
    return `${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`;
  }

  const symbols: Record<string, string> = {
    USD: '$',
    CAD: 'CA$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    AUD: 'A$',
  };

  const symbol = symbols[currency] ?? currency + ' ';
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}