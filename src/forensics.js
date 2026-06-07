import axios from 'axios';

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

async function solanaRpcRequest(method, params) {
  try {
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }, { timeout: 10000 }); // 10-second request timeout to prevent hanging
    return response.data?.result || null;
  } catch (error) {
    console.error(`Solana RPC Error [${method}]:`, error.message);
    return null;
  }
}

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

    if (accountInfo?.value?.data?.parsed?.info) {
      const parsedData = accountInfo.value.data.parsed.info;
      report.hasMintAuthority = parsedData.mintAuthority !== null;
      report.hasFreezeAuthority = parsedData.freezeAuthority !== null;
    }

    // 2. Find the Genesis Transaction of the Mint
    const signatures = await solanaRpcRequest('getSignaturesForAddress', [
      mintAddress,
      { limit: 20 }
    ]);

    if (Array.isArray(signatures) && signatures.length > 0) {
      const genesisTxSignature = signatures[signatures.length - 1]?.signature;

      if (genesisTxSignature) {
        const txDetails = await solanaRpcRequest('getTransaction', [
          genesisTxSignature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
        ]);

        if (txDetails?.transaction?.message?.accountKeys) {
          const signers = txDetails.transaction.message.accountKeys.filter(acc => acc.signer);
          if (signers.length > 0) {
            report.creatorAddress = signers[0]?.pubkey || signers[0];
          }
        }
      }
    }

    // 3. Trace Creator's Funding Lineage
    if (report.creatorAddress) {
      const creatorSignatures = await solanaRpcRequest('getSignaturesForAddress', [
        report.creatorAddress,
        { limit: 10 }
      ]);

      if (Array.isArray(creatorSignatures) && creatorSignatures.length > 0) {
        const creatorGenesisSig = creatorSignatures[creatorSignatures.length - 1]?.signature;
        
        if (creatorGenesisSig) {
          const creatorGenesisTx = await solanaRpcRequest('getTransaction', [
            creatorGenesisSig,
            { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
          ]);

          if (creatorGenesisTx?.meta?.postBalances && creatorGenesisTx?.transaction?.message?.accountKeys) {
            const preBalances = creatorGenesisTx.meta.preBalances;
            const postBalances = creatorGenesisTx.meta.postBalances;
            const accountKeys = creatorGenesisTx.transaction.message.accountKeys;

            for (let i = 0; i < accountKeys.length; i++) {
              const pubkey = accountKeys[i]?.pubkey || accountKeys[i];
              if (pubkey !== report.creatorAddress && preBalances[i] > postBalances[i]) {
                report.genesisFundingWallet = pubkey;
                break;
              }
            }
          }
        }
      }
    }

    // 4. Sybil Scam Cluster Check
    if (report.genesisFundingWallet && report.genesisFundingWallet !== 'Direct/Unknown') {
      const fundingTxHistory = await solanaRpcRequest('getSignaturesForAddress', [
        report.genesisFundingWallet,
        { limit: 15 } // Lower limit to conserve free-tier memory and prevent execution timeouts
      ]);

      if (Array.isArray(fundingTxHistory) && fundingTxHistory.length > 0) {
        const associatedDeployers = new Set();

        for (const sigInfo of fundingTxHistory) {
          if (!sigInfo?.signature) continue;
          const tx = await solanaRpcRequest('getTransaction', [
            sigInfo.signature,
            { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
          ]);

          if (tx?.transaction?.message?.accountKeys) {
            const keys = tx.transaction.message.accountKeys.map(k => k?.pubkey || k);
            keys.forEach(key => {
              if (key && key !== report.genesisFundingWallet && key !== report.creatorAddress && key.length >= 32) {
                associatedDeployers.add(key);
              }
            });
          }
          if (associatedDeployers.size >= 4) break; 
        }

        if (associatedDeployers.size > 0) {
          report.isSybilClusterDetected = true;
          report.scamClusterAssociations = Array.from(associatedDeployers);
        }
      }
    }

  } catch (error) {
    report.errors.push(error.message);
    console.error('Forensics Engine Error:', error.message);
  }

  return report;
}