import axios from 'axios';
import { traceSolanaTokenForensics } from './forensics.js';

// GoPlus official chain ID mapping
const CHAIN_ID_MAP = {
  'ethereum': '1',
  'bsc': '56',
  'base': '8453',
  'polygon': '137',
  'arbitrum': '42161',
  'optimism': '10',
  'solana': 'solana'
};

function isEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isSolanaAddress(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

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

async function checkSolanaToken(address) {
  try {
    const response = await axios.get(`https://api.gopluslabs.io/api/v1/solana/token_security`, {
      params: { addresses: address }
    });

    let goplusData = {};
    if (response.data && response.data.result && response.data.result[address]) {
      goplusData = response.data.result[address];
    }

    const forensics = await traceSolanaTokenForensics(address);

    return {
      type: 'solana_token',
      target: address,
      success: true,
      data: {
        mintable: goplusData.mintable || (forensics.hasMintAuthority ? '1' : '0'),
        freezable: goplusData.freezable || (forensics.hasFreezeAuthority ? '1' : '0'),
        owner: goplusData.owner || forensics.creatorAddress || 'None',
        creatorAddress: forensics.creatorAddress || goplusData.creator_address || 'Unknown',
        topHolders: goplusData.holders || [],
        genesisFundingSource: forensics.genesisFundingWallet || 'Direct/Unknown',
        isSybilCluster: forensics.isSybilClusterDetected,
        scamClusterAddresses: forensics.scamClusterAssociations
      }
    };
  } catch (error) {
    return { type: 'solana_token', target: address, success: false, error: error.message };
  }
}

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
 * @param {string} input Contract address or URL
 * @param {string} chainName Optional blockchain chain identifier from DexScreener
 */
export async function analyzeTarget(input, chainName = '') {
  const target = input.trim();

  if (isURL(target)) {
    return await checkDappSecurity(target);
  }
  
  if (isSolanaAddress(target)) {
    return await checkSolanaToken(target);
  }

  if (isEVMAddress(target)) {
    // Map network name to the correct GoPlus chain ID, defaulting to Ethereum ('1')
    const mappedChainId = CHAIN_ID_MAP[chainName?.toLowerCase()] || '1';
    return await checkEVMToken(target, mappedChainId);
  }

  return {
    type: 'unknown',
    target,
    success: false,
    error: 'Format unrecognized. Provide a valid Solana contract address, EVM address, or web URL.'
  };
}