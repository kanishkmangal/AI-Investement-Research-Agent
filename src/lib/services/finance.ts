import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export interface FinancialMetrics {
  symbol: string;
  companyName: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio?: number;
  forwardPE?: number;
  eps?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  volume: number;
  averageVolume: number;
}

/**
 * Helper to wrap any promise with a timeout (default 15s).
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Resolves a company name to a stock ticker using yahoo-finance2 autocomplete search.
 * Never throws an error; returns null on failure or unlisted companies.
 */
async function resolveSymbol(companyName: string): Promise<{ symbol: string; name: string } | null> {
  try {
    console.log(`[Finance] Resolving ticker symbol using yahoo-finance2 for: "${companyName}"`);
    const searchResult = await withTimeout((yahooFinance.search(companyName) as Promise<any>), 15000);
    
    if (searchResult && Array.isArray(searchResult.quotes) && searchResult.quotes.length > 0) {
      const equityQuote = searchResult.quotes.find((q: any) => q.quoteType === "EQUITY" || q.quoteType === "ETF") || searchResult.quotes[0];
      if (equityQuote && equityQuote.symbol) {
        return {
          symbol: equityQuote.symbol,
          name: equityQuote.shortname || equityQuote.longname || companyName
        };
      }
    }
    console.warn(`[Finance] No ticker symbol resolved for company "${companyName}". Continuing research without stock market data.`);
  } catch (error: any) {
    console.warn(`[Finance] Symbol resolution failed for "${companyName}" (likely unlisted/private company or network error). Full error trace:`, error?.stack || error);
  }
  return null;
}

/**
 * Fetches quote data from Yahoo Finance via yahoo-finance2 for a specific ticker symbol.
 * Never throws; returns null if data cannot be retrieved so research continues gracefully.
 */
export async function getFinancials(companyName: string): Promise<FinancialMetrics | null> {
  try {
    const resolved = await resolveSymbol(companyName);
    if (!resolved) {
      console.warn(`[Finance] Continuing research node without financial quote data for "${companyName}".`);
      return null;
    }

    const { symbol, name } = resolved;
    console.log(`[Finance] Fetching stock quote via yahoo-finance2 for ticker: ${symbol}`);
    const result = await withTimeout((yahooFinance.quote(symbol) as Promise<any>), 15000);

    if (!result) {
      console.warn(`[Finance] Empty quote result returned for symbol ${symbol}.`);
      return null;
    }

    return {
      symbol: result.symbol || symbol,
      companyName: result.longName || result.shortName || name,
      price: result.regularMarketPrice ?? 0,
      currency: result.currency || "USD",
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      marketCap: result.marketCap ?? 0,
      peRatio: result.trailingPE,
      forwardPE: result.forwardPE,
      eps: result.epsTrailingTwelveMonths,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? 0,
      fiftyDayAverage: result.fiftyDayAverage,
      twoHundredDayAverage: result.twoHundredDayAverage,
      volume: result.regularMarketVolume ?? 0,
      averageVolume: result.averageVolume ?? 0
    };
  } catch (error: any) {
    console.error(`[Finance] Error fetching financials for "${companyName}". Full error trace:`, error?.stack || error);
    return null;
  }
}
