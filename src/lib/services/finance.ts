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
 * Resolves a company name to a stock ticker using Yahoo Finance Search API.
 */
async function resolveSymbol(companyName: string): Promise<{ symbol: string; name: string } | null> {
  try {
    console.log(`[Finance] Resolving ticker symbol for: "${companyName}"`);
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=3&newsCount=0`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Symbol search request failed: status ${response.status}`);
    }

    const data = await response.json();
    if (data.quotes && data.quotes.length > 0) {
      // Find the first quote that is an EQUITY or ETF
      const equityQuote = data.quotes.find((q: any) => q.quoteType === "EQUITY" || q.quoteType === "ETF") || data.quotes[0];
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
 * Fetches quote data from Yahoo Finance for a specific ticker symbol.
 */
export async function getFinancials(companyName: string): Promise<FinancialMetrics | null> {
  const resolved = await resolveSymbol(companyName);
  if (!resolved) {
    console.warn(`[Finance] Could not resolve ticker symbol for "${companyName}".`);
    return null;
  }

  const { symbol, name } = resolved;
  try {
    console.log(`[Finance] Fetching stock quote for ticker: ${symbol}`);
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    
    const response = await fetch(quoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Quote request failed: status ${response.status}`);
    }

    const data = await response.json();
    const result = data.quoteResponse?.result?.[0];

    if (!result) {
      throw new Error(`No quote data found in response for symbol ${symbol}`);
    }

    return {
      symbol: result.symbol,
      companyName: result.longName || name,
      price: result.regularMarketPrice,
      currency: result.currency || "USD",
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      forwardPE: result.forwardPE,
      eps: result.epsTrailingTwelveMonths,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      fiftyDayAverage: result.fiftyDayAverage,
      twoHundredDayAverage: result.twoHundredDayAverage,
      volume: result.regularMarketVolume,
      averageVolume: result.averageVolume
    };
  } catch (error) {
    console.error(`[Finance] Error fetching financials for symbol "${symbol}":`, error);
    return null;
  }
}
