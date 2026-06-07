import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Checks if a token symbol has an active spot listing on Bitget
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
 * Fetches real historical price candles from Bitget and generates a branded QuickChart URL
 */
export async function generateBitgetChartUrl(symbol) {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '');
  const pairName = `${cleanSymbol}USDT`;

  try {
    // Fetch last 12 hourly candles from Bitget
    const response = await axios.get('https://api.bitget.com/api/v2/spot/market/history-candles', {
      params: {
        symbol: pairName,
        granularity: '1h',
        limit: 12
      }
    });

    if (response.data && response.data.code === '00000' && Array.isArray(response.data.data)) {
      const candles = response.data.data; // Structure: [[ts, open, high, low, close, volume], ...]
      
      // Extract closing prices and format timestamps
      const prices = candles.map(c => parseFloat(c[4])).reverse();
      const labels = candles.map(c => {
        const date = new Date(parseInt(c[0]));
        return `${date.getHours()}:00`;
      }).reverse();

      // Configure a professional Dark-Themed Chart.js structure for QuickChart API
      const chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `${pairName} (1H Timeline)`,
            data: prices,
            borderColor: '#ff3366', // RugGuard signature Crimson Red
            backgroundColor: 'rgba(255, 51, 102, 0.1)',
            fill: true,
            pointRadius: 3,
            borderWidth: 3
          }]
        },
        options: {
          title: {
            display: true,
            text: `RugGuard AI Pro — ${pairName} Live Chart`,
            fontColor: '#ffffff',
            fontSize: 16
          },
          legend: {
            labels: { fontColor: '#aaaaaa' }
          },
          scales: {
            xAxes: [{
              gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { fontColor: '#888888' }
            }],
            yAxes: [{
              gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { fontColor: '#888888' }
            }]
          }
        }
      };

      // Generate a clean chart URL using QuickChart
      return `https://quickchart.io/chart?bkg=%230d0e15&w=600&h=350&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
    }
  } catch (error) {
    console.error('Failed to generate live market chart:', error.message);
  }
  return null;
}

/**
 * Validates private Bitget API keys for administrative connection tests
 */
export async function verifyBitgetCredentials() {
  const apiKey = process.env.BITGET_API_KEY;
  const secretKey = process.env.BITGET_SECRET_KEY;
  const passphrase = process.env.BITGET_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    return { success: false, reason: 'Credentials incomplete.' };
  }

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    // Direct account lookup path to verify Read permissions
    const requestPath = '/api/v2/mix/account/accounts?productType=USDT-FUTURES';
    
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
      return { success: true, message: 'API Connection Active.' };
    }
    return { success: false, reason: response.data?.msg || 'Permission error.' };
  } catch (error) {
    return { success: false, reason: error.response?.data?.msg || error.message };
  }
}