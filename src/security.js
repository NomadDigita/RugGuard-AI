import axios from 'axios';
import { traceSolanaTokenForensics } from './forensics.js';

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
 * Scans a Solana token mint address, integrating GoPlus + Developer Forensics Engine
 */
async function checkSolanaToken(address) {
  try {
    // 1. Fetch GoPlus contract metadata
    const response = await axios.get(`https://api.gopluslabs.io/api/v1/solana/token_security`, {
      params: { addresses: address }
    });

    let goplusData = {};
    if (response.data && response.data.result && response.data.result[address]) {
      goplusData = response.data.result[address];
    }

    // 2. Perform advanced Dev Wallet Forensics and Sybil Cluster Tracking
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
        
        // Advanced Sybil Forensics Data
        genesisFundingSource: forensics.genesisFundingWallet || 'Direct/Unknown',
        isSybilCluster: forensics.isSybilClusterDetected,
        scamClusterAddresses: forensics.scamClusterAssociations
      }
    };
  } catch (error) {
    return { type: 'solana_token', target: address, success: false, error: error.message };
  }
}

/**
 * Scans an EVM (Ethereum / BSC) token address for honeypots and bad structures
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
    return await checkEVMToken(target, '1');
  }

  return {
    type: 'unknown',
    target,
    success: false,
    error: 'Format unrecognized. Provide a valid Solana contract address, EVM address, or web URL.'
  };
}