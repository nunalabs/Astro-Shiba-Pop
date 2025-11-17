/**
 * Freighter Wallet Integration
 *
 * Utilities for interacting with Freighter browser extension
 */

// ============================================================================
// Types
// ============================================================================

export interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  getNetwork: () => Promise<string>;
  getNetworkDetails: () => Promise<{
    network: string;
    networkPassphrase: string;
    networkUrl: string;
  }>;
  signTransaction: (
    xdr: string,
    opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ) => Promise<string>;
  signAuthEntry: (
    entryXdr: string,
    opts?: {
      accountToSign?: string;
    }
  ) => Promise<string>;
}

// ============================================================================
// Freighter Detection
// ============================================================================

/**
 * Check if Freighter extension is installed
 */
export function isFreighterInstalled(): boolean {
  return typeof window !== 'undefined' && 'freighter' in window;
}

/**
 * Get Freighter API from window object
 */
export async function getFreighter(): Promise<FreighterAPI | null> {
  if (!isFreighterInstalled()) {
    return null;
  }

  try {
    // Wait for Freighter to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    const freighter = (window as any).freighter as FreighterAPI;

    if (!freighter) {
      throw new Error('Freighter API not found');
    }

    return freighter;
  } catch (error) {
    console.error('Failed to get Freighter API:', error);
    return null;
  }
}

// ============================================================================
// Connection
// ============================================================================

/**
 * Request connection to Freighter wallet
 */
export async function connectFreighter(): Promise<{
  publicKey: string;
  network: string;
} | null> {
  const freighter = await getFreighter();

  if (!freighter) {
    throw new Error('Freighter wallet not installed');
  }

  try {
    // Check if already connected
    const isConnected = await freighter.isConnected();

    if (!isConnected) {
      throw new Error('Please connect to Freighter wallet first');
    }

    // Get public key
    const publicKey = await freighter.getPublicKey();

    if (!publicKey) {
      throw new Error('Failed to get public key from Freighter');
    }

    // Get network
    const network = await freighter.getNetwork();

    return {
      publicKey,
      network,
    };
  } catch (error) {
    console.error('Failed to connect to Freighter:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to connect to Freighter'
    );
  }
}

/**
 * Request public key from Freighter
 */
export async function requestPublicKey(): Promise<string> {
  const result = await connectFreighter();

  if (!result) {
    throw new Error('Failed to connect to Freighter');
  }

  return result.publicKey;
}

/**
 * Get current network from Freighter
 */
export async function getFreighterNetwork(): Promise<string> {
  const freighter = await getFreighter();

  if (!freighter) {
    throw new Error('Freighter wallet not installed');
  }

  try {
    const network = await freighter.getNetwork();
    return network;
  } catch (error) {
    console.error('Failed to get network from Freighter:', error);
    throw new Error('Failed to get network from Freighter');
  }
}

/**
 * Get detailed network information from Freighter
 */
export async function getFreighterNetworkDetails(): Promise<{
  network: string;
  networkPassphrase: string;
  networkUrl: string;
}> {
  const freighter = await getFreighter();

  if (!freighter) {
    throw new Error('Freighter wallet not installed');
  }

  try {
    const details = await freighter.getNetworkDetails();
    return details;
  } catch (error) {
    console.error('Failed to get network details from Freighter:', error);
    throw new Error('Failed to get network details from Freighter');
  }
}

// ============================================================================
// Network Validation
// ============================================================================

/**
 * Check if Freighter is on the correct network
 */
export async function validateFreighterNetwork(
  expectedNetwork: string
): Promise<boolean> {
  try {
    const network = await getFreighterNetwork();
    return network.toLowerCase() === expectedNetwork.toLowerCase();
  } catch (error) {
    console.error('Failed to validate network:', error);
    return false;
  }
}

/**
 * Prompt user to switch network in Freighter
 */
export async function promptNetworkSwitch(targetNetwork: string): Promise<void> {
  const currentNetwork = await getFreighterNetwork();

  if (currentNetwork.toLowerCase() !== targetNetwork.toLowerCase()) {
    throw new Error(
      `Please switch Freighter to ${targetNetwork} network. Currently on ${currentNetwork}.`
    );
  }
}

// ============================================================================
// Installation Prompt
// ============================================================================

/**
 * Get Freighter installation URL
 */
export function getFreighterInstallUrl(): string {
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  if (isFirefox) {
    return 'https://addons.mozilla.org/en-US/firefox/addon/freighter/';
  }

  // Chrome/Brave/Edge
  return 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk';
}

/**
 * Open Freighter installation page
 */
export function openFreighterInstall(): void {
  window.open(getFreighterInstallUrl(), '_blank');
}
