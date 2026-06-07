import axios from 'axios';

// Public Solana Mainnet RPC endpoint (used for live on-chain tracing)
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

/**
 * Executes a raw JSON-RPC query on the Solana network
 */
async function solanaRpcRequest(method, params) {
  try {
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    });
    return response.data?.result || null;
  } catch (error) {
    console.error(`Solana RPC Error [${method}]:`, error.message);
    return null;
  }
}

/**
 * Analyzes Solana Token authorities and traces the creator identity and funding lineage
 * @param {string} mintAddress The Solana token contract address
 */
export async function traceSolanaTokenForensics(mintAddress) {
  const report = {
    targetMint: mintAddress,
    hasFreezeAuthority: false,
    hasMintAuthority: false,
    creatorAddress: null,
    genesisFundingWallet: null,
    isSybilClusterDetected: false,
    scamClusterAssociations: [],
    errors: []
  };

  try {
    // 1. Fetch Token Mint Account Info (Check Authorities)
    const accountInfo = await solanaRpcRequest('getAccountInfo', [
      mintAddress,
      { encoding: 'jsonParsed' }
    ]);

    if (accountInfo && accountInfo.value) {
      const parsedData = accountInfo.value.data?.parsed?.info;
      if (parsedData) {
        report.hasMintAuthority = parsedData.mintAuthority !== null;
        report.hasFreezeAuthority = parsedData.freezeAuthority !== null;
      }
    }

    // 2. Find the Genesis Transaction of the Mint to discover the Creator
    // We fetch signatures in reverse order to find the oldest (first) signature
    const signatures = await solanaRpcRequest('getSignaturesForAddress', [
      mintAddress,
      { limit: 20 }
    ]);

    if (signatures && signatures.length > 0) {
      // The oldest signature returned is likely the genesis tx (creation)
      const genesisTxSignature = signatures[signatures.length - 1].signature;

      // Fetch transaction details
      const txDetails = await solanaRpcRequest('getTransaction', [
        genesisTxSignature,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
      ]);

      if (txDetails && txDetails.transaction) {
        // The first account in accountKeys that signed is the deployer/creator
        const signers = txDetails.transaction.message.accountKeys.filter(acc => acc.signer);
        if (signers.length > 0) {
          report.creatorAddress = signers[0].pubkey || signers[0];
        }
      }
    }

    // 3. Trace Creator's Funding Lineage (Genesis Funding Wallet)
    if (report.creatorAddress) {
      const creatorSignatures = await solanaRpcRequest('getSignaturesForAddress', [
        report.creatorAddress,
        { limit: 10 }
      ]);

      if (creatorSignatures && creatorSignatures.length > 0) {
        const creatorGenesisSig = creatorSignatures[creatorSignatures.length - 1].signature;
        const creatorGenesisTx = await solanaRpcRequest('getTransaction', [
          creatorGenesisSig,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
        ]);

        if (creatorGenesisTx && creatorGenesisTx.meta) {
          // Identify who sent the initial SOL to the creator's wallet
          const balanceChanges = creatorGenesisTx.meta.postBalances;
          const preBalances = creatorGenesisTx.meta.preBalances;
          
          // Look for account keys involved that sent funds
          const accountKeys = creatorGenesisTx.transaction.message.accountKeys;
          for (let i = 0; i < accountKeys.length; i++) {
            const pubkey = accountKeys[i].pubkey || accountKeys[i];
            if (pubkey !== report.creatorAddress && preBalances[i] > balanceChanges[i]) {
              // Found a wallet that sent SOL to fund this deployer
              report.genesisFundingWallet = pubkey;
              break;
            }
          }
        }
      }
    }

    // 4. Sybil Scam Cluster Check (Scans if the parent wallet funded other launch accounts)
    if (report.genesisFundingWallet) {
      const fundingTxHistory = await solanaRpcRequest('getSignaturesForAddress', [
        report.genesisFundingWallet,
        { limit: 30 }
      ]);

      if (fundingTxHistory && fundingTxHistory.length > 0) {
        const associatedDeployers = new Set();

        // Loop through transactions to identify outbound transfers to other wallets
        for (const sigInfo of fundingTxHistory) {
          const tx = await solanaRpcRequest('getTransaction', [
            sigInfo.signature,
            { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
          ]);

          if (tx && tx.transaction) {
            const keys = tx.transaction.message.accountKeys.map(k => k.pubkey || k);
            // Search for outbound fund pathways
            keys.forEach(key => {
              if (key !== report.genesisFundingWallet && key !== report.creatorAddress && key.length >= 32) {
                associatedDeployers.add(key);
              }
            });
          }
          if (associatedDeployers.size >= 5) break; // Limit API load
        }

        if (associatedDeployers.size > 0) {
          report.isSybilClusterDetected = true;
          report.scamClusterAssociations = Array.from(associatedDeployers);
        }
      }
    }

  } catch (error) {
    report.errors.push(error.message);
  }

  return report;
}