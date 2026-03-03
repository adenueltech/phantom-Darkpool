/**
 * Starknet Wallet Integration
 * Handles connection to Argent X and Braavos wallets
 */

import { connect, disconnect as disconnectWallet } from 'get-starknet-core';
import { Account, Provider, constants } from 'starknet';

export interface WalletConnection {
  address: string;
  account: Account;
  provider: Provider;
  walletType: 'argentX' | 'braavos';
}

/**
 * Connect to Argent X wallet
 */
export async function connectArgentX(): Promise<WalletConnection> {
  try {
    const starknet = await connect({
      modalMode: 'neverAsk',
      modalTheme: 'dark',
      dappName: 'Phantom Darkpool',
      include: ['argentX'],
    });

    if (!starknet || !starknet.isConnected) {
      throw new Error('Failed to connect to Argent X');
    }

    await starknet.enable();

    const provider = new Provider({
      sequencer: {
        network: constants.NetworkName.SN_SEPOLIA, // Use testnet
      },
    });

    const account = new Account(
      provider,
      starknet.selectedAddress!,
      starknet.account
    );

    return {
      address: starknet.selectedAddress!,
      account,
      provider,
      walletType: 'argentX',
    };
  } catch (error) {
    console.error('Error connecting to Argent X:', error);
    throw error;
  }
}

/**
 * Connect to Braavos wallet
 */
export async function connectBraavos(): Promise<WalletConnection> {
  try {
    const starknet = await connect({
      modalMode: 'neverAsk',
      modalTheme: 'dark',
      dappName: 'Phantom Darkpool',
      include: ['braavos'],
    });

    if (!starknet || !starknet.isConnected) {
      throw new Error('Failed to connect to Braavos');
    }

    await starknet.enable();

    const provider = new Provider({
      sequencer: {
        network: constants.NetworkName.SN_SEPOLIA, // Use testnet
      },
    });

    const account = new Account(
      provider,
      starknet.selectedAddress!,
      starknet.account
    );

    return {
      address: starknet.selectedAddress!,
      account,
      provider,
      walletType: 'braavos',
    };
  } catch (error) {
    console.error('Error connecting to Braavos:', error);
    throw error;
  }
}

/**
 * Disconnect wallet
 */
export async function disconnect(): Promise<void> {
  try {
    await disconnectWallet();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
}

/**
 * Check if wallet is installed
 */
export function isWalletInstalled(walletType: 'argentX' | 'braavos'): boolean {
  if (typeof window === 'undefined') return false;

  if (walletType === 'argentX') {
    return !!(window as any).starknet_argentX;
  } else if (walletType === 'braavos') {
    return !!(window as any).starknet_braavos;
  }

  return false;
}

/**
 * Get current wallet connection
 */
export async function getCurrentWallet(): Promise<WalletConnection | null> {
  try {
    const starknet = await connect({ modalMode: 'neverAsk' });

    if (!starknet || !starknet.isConnected) {
      return null;
    }

    const provider = new Provider({
      sequencer: {
        network: constants.NetworkName.SN_SEPOLIA,
      },
    });

    const account = new Account(
      provider,
      starknet.selectedAddress!,
      starknet.account
    );

    const walletType = starknet.id === 'argentX' ? 'argentX' : 'braavos';

    return {
      address: starknet.selectedAddress!,
      account,
      provider,
      walletType,
    };
  } catch (error) {
    console.error('Error getting current wallet:', error);
    return null;
  }
}
