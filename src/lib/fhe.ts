import { getAddress, toHex } from 'viem';

declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: { provider?: any } | any;
    coinbaseWalletExtension?: any;
  }
}

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs';

let fheInstance: any = null;
let fheInstancePromise: Promise<any> | null = null;
let sdkPromise: Promise<any> | null = null;

/**
 * Dynamically load Zama FHE SDK from CDN
 */
const loadSdk = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  if (window.relayerSDK) {
    console.log('✅ SDK already loaded');
    return window.relayerSDK;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        console.log('⏳ SDK script tag exists, waiting...');
        // Wait for SDK to initialize
        const checkInterval = setInterval(() => {
          if (window.relayerSDK) {
            clearInterval(checkInterval);
            resolve(window.relayerSDK);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.relayerSDK) {
            resolve(window.relayerSDK);
          } else {
            reject(new Error('SDK script exists but window.relayerSDK not initialized'));
          }
        }, 5000);
        return;
      }

      console.log('📦 Loading SDK from CDN...');
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;

      script.onload = () => {
        console.log('📦 Script loaded, waiting for SDK initialization...');
        // Give SDK time to initialize
        setTimeout(() => {
          if (window.relayerSDK) {
            console.log('✅ SDK initialized');
            resolve(window.relayerSDK);
          } else {
            console.error('❌ window.relayerSDK still undefined after load');
            reject(new Error('relayerSDK unavailable after load'));
          }
        }, 500);
      };

      script.onerror = () => {
        console.error('❌ Failed to load SDK script');
        reject(new Error('Failed to load FHE SDK'));
      };

      document.body.appendChild(script);
    });
  }

  return sdkPromise;
};

const normalizeProvider = (candidate?: any): any | undefined => {
  if (!candidate) return undefined;

  if (typeof candidate.request === 'function') {
    return candidate;
  }

  if (candidate.provider && typeof candidate.provider.request === 'function') {
    return candidate.provider;
  }

  if (candidate.transport && typeof candidate.transport.request === 'function') {
    const transport = candidate.transport;
    return {
      request: ({ method, params }: { method: string; params?: unknown[] }) =>
        transport.request({ method, params: params ?? [] }),
    };
  }

  return undefined;
};

const ensureHexPayload = (handles: unknown[], proof: Uint8Array) => {
  if (!Array.isArray(handles) || handles.length === 0) {
    throw new Error('Encryption did not return any handles');
  }

  return {
    handle: toHex(handles[0] as Uint8Array),
    proof: toHex(proof),
  } as { handle: `0x${string}`; proof: `0x${string}` };
};

/**
 * Initialize FHE instance with Sepolia network configuration
 */
export async function initializeFHE(provider?: any): Promise<any> {
  if (fheInstance) {
    console.log('✅ Reusing existing FHE instance');
    return fheInstance;
  }

  if (fheInstancePromise) {
    console.log('⏳ FHE initialization in progress...');
    return fheInstancePromise;
  }

  fheInstancePromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('FHE SDK requires browser environment');
    }

    const ethereumProvider =
      normalizeProvider(provider) ||
      normalizeProvider(window.ethereum) ||
      normalizeProvider(window.okxwallet?.provider) ||
      normalizeProvider(window.okxwallet) ||
      normalizeProvider(window.coinbaseWalletExtension);

    if (!ethereumProvider) {
      throw new Error('Ethereum provider not found. Please connect your wallet first.');
    }

    console.log('🔌 Using Ethereum provider:', {
      isOKX: !!window.okxwallet,
      isMetaMask: !!(window.ethereum as any)?.isMetaMask,
      isCoinbase: !!window.coinbaseWalletExtension,
    });

    const sdk = await loadSdk();
    if (!sdk) {
      throw new Error('FHE SDK not available');
    }

    console.log('🚀 Initializing SDK...');
    await sdk.initSDK();

    const config = {
      ...sdk.SepoliaConfig,
      network: ethereumProvider,
    };

    console.log('🔧 Creating FHE instance...');
    fheInstance = await sdk.createInstance(config);
    console.log('✅ FHE instance initialized for Sepolia');

    return fheInstance;
  })();

  try {
    return await fheInstancePromise;
  } finally {
    fheInstancePromise = null;
  }
}

export const getFhevmInstance = initializeFHE;

type EncryptedPayload = { handle: `0x${string}`; proof: `0x${string}` };

const encryptValue = async (
  value: number | bigint,
  contractAddress: string,
  userAddress: string,
  addValue: (input: any) => void,
  provider?: any
): Promise<EncryptedPayload> => {
  console.log('[FHE] Encrypting value:', value.toString());

  const fhe = await initializeFHE(provider);
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  console.log('[FHE] Creating encrypted input...');
  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  addValue(input);

  console.log('[FHE] Encrypting...');
  const { handles, inputProof } = await input.encrypt();

  console.log('[FHE] ✅ Encryption complete');
  return ensureHexPayload(handles, inputProof);
};

const assertRange = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

/**
 * Encrypt a uint8 value (0-255)
 */
export const encryptUint8 = async (
  value: number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<EncryptedPayload> => {
  assertRange(value >= 0 && value <= 255, 'Value must be between 0 and 255');
  return encryptValue(value, contractAddress, userAddress, (input) => input.add8(value), provider);
};

/**
 * Encrypt a uint64 value
 */
export const encryptUint64 = async (
  value: bigint,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<EncryptedPayload> => {
  return encryptValue(value, contractAddress, userAddress, (input) => input.add64(value), provider);
};

export const formatEncryptedData = (payload: EncryptedPayload) => payload;
