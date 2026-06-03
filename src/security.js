import axios from 'axios';

/**
 * Checks if the string matches a standard EVM wallet/token address
 */
function isEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Checks if the string matches a standard Solana address (Base58, 32-44 chars)
 */
function isSolanaAddress(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Checks if the string is a valid web URL
 */
function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Scans a dApp URL for phishing and security hazards
 */
async function checkDappSecurity(url) {
  try {
    const cleanUrl = new URL(url).origin;
    const response = await axios.get(`https://api.gopluslabs.io/api/v1/dapp_security`, {
      params: { url: cleanUrl }
    });
    
    if (response.data && response.data.result) {
      return {
        type: 'url',
        target: cleanUrl,
        success: true,
        data: response.data.result
      };
    }
    throw new Error('No analysis data returned from security registry.');
  } catch (error) {
    return { type: 'url', target: url, success: false, error: error.message };
  }
}

/**
 * Scans a Solana token mint address for Rug Pull indicators
 */
async function checkSolanaToken(address) {
  try {
    const response = await axios.get(`https://api.gopluslabs.io/api/v1/solana/token_security`, {
      params: { addresses: address }
    });

    if (response.data && response.data.result && response.data.result[address]) {
      const data = response.data.result[address];
      return {
        type: 'solana_token',
        target: address,
        success: true,
        data: {
          mintable: data.mintable || '0', // "1" means mint authority exists (high risk)
          freezable: data.freezable || '0', // "1" means creator can freeze transfers
          owner: data.owner || 'None',
          creatorAddress: data.creator_address || 'Unknown',
          topHolders: data.holders || []
        }
      };
    }
    throw new Error('No Solana contract registry data found.');
  } catch (error) {
    return { type: 'solana_token', target: address, success: false, error: error.message };
  }
}

/**
 * Scans an EVM (Ethereum / BSC) token address for honeypots and bad structures
 * Defaulting to Ethereum (chain_id: '1')
 */
async function checkEVMToken(address, chainId = '1') {
  try {
    const response = await axios.get(`https://api.gopluslabs.io/api/v1/token_security/${chainId}`, {
      params: { addresses: address }
    });

    if (response.data && response.data.result && response.data.result[address.toLowerCase()]) {
      const data = response.data.result[address.toLowerCase()];
      return {
        type: 'evm_token',
        target: address,
        chainId,
        success: true,
        data: {
          isHoneypot: data.is_honeypot === '1',
          buyTax: data.buy_tax || '0',
          sellTax: data.sell_tax || '0',
          cannotBuy: data.cannot_buy === '1',
          cannotSell: data.cannot_sell === '1',
          ownerAddress: data.owner_address || 'None',
          isOpenSource: data.is_open_source === '1',
          proxy: data.is_proxy === '1',
          slippageModifiable: data.slippage_modifiable === '1'
        }
      };
    }
    throw new Error('No EVM contract registry data found.');
  } catch (error) {
    return { type: 'evm_token', target: address, success: false, error: error.message };
  }
}

/**
 * Router interface for RugGuard security analysis
 */
export async function analyzeTarget(input) {
  const target = input.trim();

  if (isURL(target)) {
    return await checkDappSecurity(target);
  }
  
  if (isSolanaAddress(target)) {
    return await checkSolanaToken(target);
  }

  if (isEVMAddress(target)) {
    // If it looks like EVM, analyze on Ethereum. Can expand to other chain IDs later if needed.
    return await checkEVMToken(target, '1');
  }

  return {
    type: 'unknown',
    target,
    success: false,
    error: 'Format unrecognized. Provide a valid Solana contract address, EVM address, or web URL.'
  };
}