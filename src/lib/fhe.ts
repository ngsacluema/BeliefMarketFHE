import { bytesToHex, getAddress } from 'viem';
import type { Address } from 'viem';
import { BELIEF_MARKET_ADDRESS } from '@/config/contracts';

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;

/**
 * Get the Relayer SDK from window (loaded via CDN in index.html)
 */
const getSDK = () => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error('Relayer SDK not loaded. Ensure the CDN script tag is present in index.html.');
  }
  return sdk;
};

/**
 * Initialize FHE instance with Sepolia network configuration (0.9.1 compatible)
 */
export const initializeFHE = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }

  const ethereumProvider =
    provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;
  if (!ethereumProvider) {
    throw new Error('No wallet provider detected. Connect a wallet first.');
  }

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;
  await initSDK();
  const config = { ...SepoliaConfig, network: ethereumProvider };
  fheInstance = await createInstance(config);
  return fheInstance;
};

const getInstance = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  return initializeFHE(provider);
};

type EncryptedPayload = { handle: `0x${string}`; proof: `0x${string}` };

/**
 * Encrypt a uint64 value for voting weight
 * @param value - The vote weight value to encrypt
 * @param userAddress - The user's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptUint64 = async (
  value: bigint,
  userAddress: Address,
  provider?: any
): Promise<EncryptedPayload> => {
  console.log('[FHE] Encrypting uint64 value:', value.toString());
  const instance = await getInstance(provider);
  const contractAddr = getAddress(BELIEF_MARKET_ADDRESS);
  const userAddr = getAddress(userAddress);

  console.log('[FHE] Creating encrypted input for:', {
    contract: contractAddr,
    user: userAddr,
  });

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add64(value);

  console.log('[FHE] Encrypting input...');
  const { handles, inputProof } = await input.encrypt();
  console.log('[FHE] Encryption complete, handles:', handles.length);

  if (handles.length < 1) {
    throw new Error('FHE SDK returned insufficient handles');
  }

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt vote weight for the prediction market
 * @param weight - Vote weight (1 as bigint)
 * @param userAddress - User's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptVoteWeight = async (
  weight: bigint,
  userAddress: Address,
  provider?: any
): Promise<EncryptedPayload> => {
  return encryptUint64(weight, userAddress, provider);
};

/**
 * Perform public decryption using relayer SDK (0.9.1 self-relaying pattern)
 * @param ciphertextHandles - Array of ciphertext handles to decrypt
 * @param provider - Ethereum provider
 */
export const publicDecrypt = async (
  ciphertextHandles: `0x${string}`[],
  provider?: any
): Promise<{ values: bigint[]; proof: `0x${string}` }> => {
  const sdk = getSDK();
  const instance = await getInstance(provider);

  console.log('[FHE] Requesting public decryption for handles:', ciphertextHandles);

  // Use relayer SDK's publicDecrypt method
  const result = await sdk.publicDecrypt(ciphertextHandles);

  console.log('[FHE] Decryption complete:', result);

  return {
    values: result.values.map((v: any) => BigInt(v)),
    proof: bytesToHex(result.proof) as `0x${string}`,
  };
};

/**
 * Check if FHE SDK is loaded and ready
 */
export const isFHEReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.RelayerSDK || window.relayerSDK);
};

/**
 * Check if FHE instance is initialized
 */
export const isFheReady = (): boolean => {
  return fheInstance !== null;
};

export const isSDKLoaded = isFHEReady;

/**
 * Wait for FHE SDK to be loaded (with timeout)
 */
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (isFHEReady()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
};

/**
 * Get FHE status for debugging
 */
export const getFHEStatus = (): {
  sdkLoaded: boolean;
  instanceReady: boolean;
} => {
  return {
    sdkLoaded: isFHEReady(),
    instanceReady: fheInstance !== null,
  };
};

// Legacy exports for backwards compatibility
export const getFhevmInstance = initializeFHE;
export const formatEncryptedData = (payload: EncryptedPayload) => payload;
