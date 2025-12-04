import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

const ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io';

/**
 * Get Etherscan transaction URL
 */
export const getEtherscanTxUrl = (hash: string): string => {
  return `${ETHERSCAN_BASE_URL}/tx/${hash}`;
};

/**
 * Get Etherscan address URL
 */
export const getEtherscanAddressUrl = (address: string): string => {
  return `${ETHERSCAN_BASE_URL}/address/${address}`;
};

/**
 * Transaction link component for toast messages
 */
const TxLink = ({ hash }: { hash: string }) => (
  <a
    href={getEtherscanTxUrl(hash)}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-500 hover:text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
  >
    View on Etherscan <ExternalLink className="w-3 h-3" />
  </a>
);

/**
 * Show transaction pending toast
 */
export const showTxPending = (message: string, hash?: string) => {
  return toast.loading(
    <div className="flex flex-col">
      <span className="font-medium">{message}</span>
      {hash && <TxLink hash={hash} />}
    </div>,
    { duration: Infinity }
  );
};

/**
 * Show transaction submitted toast (waiting for confirmation)
 */
export const showTxSubmitted = (hash: string, toastId?: string | number) => {
  const content = (
    <div className="flex flex-col">
      <span className="font-medium">Transaction Submitted</span>
      <span className="text-sm text-muted-foreground">Waiting for confirmation...</span>
      <TxLink hash={hash} />
    </div>
  );

  if (toastId) {
    toast.loading(content, { id: toastId, duration: Infinity });
  } else {
    return toast.loading(content, { duration: Infinity });
  }
};

/**
 * Show transaction success toast
 */
export const showTxSuccess = (
  title: string,
  description: string,
  hash: string,
  toastId?: string | number
) => {
  const content = (
    <div className="flex flex-col gap-1">
      <span className="font-semibold text-green-700">{title}</span>
      <span className="text-sm">{description}</span>
      <TxLink hash={hash} />
    </div>
  );

  if (toastId) {
    toast.success(content, { id: toastId, duration: 8000 });
  } else {
    toast.success(content, { duration: 8000 });
  }
};

/**
 * Show transaction error toast
 */
export const showTxError = (
  title: string,
  error: Error | string,
  hash?: string,
  toastId?: string | number
) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Parse common error messages
  let displayMessage = errorMessage;
  if (errorMessage.includes('User rejected')) {
    displayMessage = 'Transaction was rejected by user';
  } else if (errorMessage.includes('insufficient funds')) {
    displayMessage = 'Insufficient funds for transaction';
  } else if (errorMessage.includes('execution reverted')) {
    // Extract revert reason if available
    const match = errorMessage.match(/reason="([^"]+)"/);
    displayMessage = match ? match[1] : 'Transaction reverted';
  } else if (errorMessage.length > 100) {
    displayMessage = errorMessage.slice(0, 100) + '...';
  }

  const content = (
    <div className="flex flex-col gap-1">
      <span className="font-semibold text-red-700">{title}</span>
      <span className="text-sm">{displayMessage}</span>
      {hash && <TxLink hash={hash} />}
    </div>
  );

  if (toastId) {
    toast.error(content, { id: toastId, duration: 10000 });
  } else {
    toast.error(content, { duration: 10000 });
  }
};

/**
 * Show info toast
 */
export const showInfo = (title: string, description?: string) => {
  toast.info(
    <div className="flex flex-col">
      <span className="font-medium">{title}</span>
      {description && <span className="text-sm text-muted-foreground">{description}</span>}
    </div>
  );
};

/**
 * Show warning toast
 */
export const showWarning = (title: string, description?: string) => {
  toast.warning(
    <div className="flex flex-col">
      <span className="font-medium">{title}</span>
      {description && <span className="text-sm text-muted-foreground">{description}</span>}
    </div>
  );
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
