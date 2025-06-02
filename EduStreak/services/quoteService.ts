import fallbackQuotes from '../assets/data/fallback_quotes.json';

/**
 * Represents the structure of a quote object as returned by the ZenQuotes API.
 */
interface ZenQuoteResponse {
  q: string; // The quote text
  a: string; // The author of the quote
  h: string; // Pre-formatted HTML string of the quote (not directly used in this service)
}

/**
 * Represents the structure of the daily quote object used within the application.
 * Includes information about whether the quote is a fallback and any potential error messages.
 */
interface DailyQuote {
  quoteText: string;    // The text of the quote
  quoteAuthor: string;  // The author of the quote
  error?: string | null;// Optional error message to display to the user if fetching fails
  isFallback: boolean;  // True if the quote is a fallback, false if it's from the live API
}

/**
 * Fetches a random daily quote from the ZenQuotes API.
 * If the API request fails (e.g., network error, rate limit), it provides a fallback quote
 * from a predefined list and includes an appropriate error message.
 *
 * @returns A Promise that resolves to a `DailyQuote` object. This object contains
 *          the quote text, author, a flag indicating if it's a fallback, and an optional
 *          error message if the live quote fetching failed.
 */
export const fetchDailyQuoteFromService = async (): Promise<DailyQuote> => {
  try {
    // Attempt to fetch a random quote from the ZenQuotes API.
    const response = await fetch('https://zenquotes.io/api/random');
    
    // Check if the HTTP response is not OK (e.g., 4xx or 5xx status codes).
    if (!response.ok) {
      let errorText = `HTTP error! status: ${response.status}`;
      try {
        // Try to parse a JSON error response from the API, if available.
        const errorData = await response.json();
        if (errorData && typeof errorData.error === 'string') {
          errorText = errorData.error;
        } else if (response.statusText) {
          errorText = response.statusText; // Fallback to generic status text.
        }
      } catch (e) { /* Ignore JSON parsing error if response body is not JSON */ }
      throw new Error(errorText); // Propagate as an error to trigger fallback mechanism.
    }
    
    const dataArray: ZenQuoteResponse[] = await response.json();
    // Check if the API returned a valid array with at least one quote.
    if (dataArray && dataArray.length > 0) {
      return {
        quoteText: dataArray[0].q,
        quoteAuthor: dataArray[0].a,
        isFallback: false, // Successfully fetched from live API.
      };
    } else {
      // API returned a 2xx status but the data is empty or not in the expected format.
      throw new Error("API returned empty or invalid data structure.");
    }
  } catch (err: any) {
    console.warn("[QuoteService] Error fetching live quote, using fallback. Error:", err.message);
    
    // Select a random fallback quote from the local JSON file.
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    const randomFallbackQuote = fallbackQuotes[randomIndex];
    
    // Determine a user-friendly error message based on the type of error encountered.
    let userErrorMessage = "Failed to load a fresh quote. Showing a classic instead.";
    if (err.message) {
        if (err.message.toLowerCase().includes('rate limit') || 
            err.message.toLowerCase().includes('too many requests')) {
            userErrorMessage = "Quote API limit reached for today. Here's a classic for now!";
        } else if (err.message.toLowerCase().includes('network request failed') ||
                   err.message.toLowerCase().includes('failed to fetch')) {
            userErrorMessage = "Network connection issue. Displaying a timeless quote.";
        } // Other errors will use the generic fallback message.
    }

    return {
      quoteText: randomFallbackQuote.q,
      quoteAuthor: randomFallbackQuote.a,
      error: userErrorMessage, // Provide the error message to the UI.
      isFallback: true,        // Indicate that this is a fallback quote.
    };
  }
}; 