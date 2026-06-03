import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Searches the web via Tavily API to fetch real-time reports, sentiment, and news
 * @param {string} query Search terms (e.g., token name, creator address, or dApp brand)
 */
export async function performWebSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Tavily API key is missing from environment configurations.');
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: `${query} crypto scam audit news`,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5
    });

    if (response.data) {
      return {
        success: true,
        summary: response.data.answer || 'No direct summary generated.',
        results: response.data.results.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content
        }))
      };
    }
    throw new Error('Invalid response structure from search provider.');
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      summary: 'Could not fetch web search indices.',
      results: []
    };
  }
}