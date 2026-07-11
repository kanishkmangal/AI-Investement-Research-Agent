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
 * Resolves a company name to a stock ticker using yahoo-finance2 autocomplete search.
 */
async function resolveSymbol(companyName: string): Promise<{ symbol: string; name: string } | null> {
  try {
    console.log(`[Finance] Resolving ticker symbol using yahoo-finance2 for: "${companyName}"`);
    const searchResult = (await yahooFinance.search(companyName)) as any;
    
    if (searchResult.quotes && searchResult.quotes.length > 0) {
      // Find the first quote that is an EQUITY or ETF
      const equityQuote = searchResult.quotes.find((q: any) => q.quoteType === "EQUITY" || q.quoteType === "ETF") || searchResult.quotes[0];
      return {
        symbol: equityQuote.symbol,
        name: equityQuote.shortname || equityQuote.longname || companyName
      };
    }
  } catch (error) {
    console.error(`[Finance] Error resolving symbol for "${companyName}":`, error);
  }
  return null;
}

/**
 * Fetches quote data from Yahoo Finance via yahoo-finance2 for a specific ticker symbol.
 */
export async function getFinancials(companyName: string): Promise<FinancialMetrics | null> {
  const resolved = await resolveSymbol(companyName);
  if (!resolved) {
    console.warn(`[Finance] Could not resolve ticker symbol for "${companyName}".`);
    return null;
  }

  const { symbol, name } = resolved;
  try {
    console.log(`[Finance] Fetching stock quote via yahoo-finance2 for ticker: ${symbol}`);
    const result = (await yahooFinance.quote(symbol)) as any;

    if (!result) {
      throw new Error(`No quote data found in response for symbol ${symbol}`);
    }

    return {
      symbol: result.symbol,
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
  } catch (error) {
    console.error(`[Finance] Error fetching financials for symbol "${symbol}":`, error);
    return null;
  }
}
