import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Checks if a token symbol has an active spot listing on Bitget
 * (Bitget's institutional listing acts as an automatic safety signal)
 * @param {string} symbol The token symbol (e.g., BTC, SOL)
 */
export async function checkBitgetListing(symbol) {
  if (!symbol) return { listed: false };
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '');
  
  try {
    const response = await axios.get('https://api.bitget.com/api/v2/spot/market/tickers');
    if (response.data && response.data.code === '00000' && Array.isArray(response.data.data)) {
      const pairName = `${cleanSymbol}USDT`;
      const match = response.data.data.find(ticker => ticker.symbol === pairName);
      if (match) {
        return {
          listed: true,
          symbol: match.symbol,
          price: match.lastPr || 'N/A',
          high24h: match.high24h || 'N/A',
          low24h: match.low24h || 'N/A',
          volume: match.usdtVolume || 'N/A'
        };
      }
    }
    return { listed: false };
  } catch (error) {
    return { listed: false, error: error.message };
  }
}

/**
 * Validates the status of the user's private Bitget API connection (for administrative audits)
 */
export async function verifyBitgetCredentials() {
  const apiKey = process.env.BITGET_API_KEY;
  const secretKey = process.env.BITGET_SECRET_KEY;
  const passphrase = process.env.BITGET_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    return { success: false, reason: 'Credentials incomplete in configuration files.' };
  }

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/api/v2/mix/account/accounts?productType=USDT-FUTURES';
    
    // Create Bitget API signature
    const preHash = timestamp + method + requestPath;
    const hmac = crypto.createHmac('sha256', secretKey);
    const signature = hmac.update(preHash).digest('base64');

    const response = await axios.get(`https://api.bitget.com${requestPath}`, {
      headers: {
        'ACCESS-KEY': apiKey,
        'ACCESS-SIGN': signature,
        'ACCESS-PASSPHRASE': passphrase,
        'ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.code === '00000') {
      return { success: true, message: 'Administrative API validation connection active.' };
    }
    return { success: false, reason: response.data?.msg || 'Verification check rejected.' };
  } catch (error) {
    return { success: false, reason: error.response?.data?.msg || error.message };
  }
}