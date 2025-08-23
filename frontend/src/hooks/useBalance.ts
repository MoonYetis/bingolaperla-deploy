/**
 * Unified Balance Hook - Centralized balance management
 * Resolves the 99.00 vs 89.00 Perlas inconsistency
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { walletApi } from '@/services/walletApi';
import { useAppDispatch } from '@/hooks/redux';
import { updateUser } from '@/store/authSlice';

export interface BalanceState {
  balance: number;
  source: 'redux' | 'api' | 'sync';
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  inconsistencyDetected: boolean;
}

export const useBalance = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: 0,
    source: 'redux',
    isLoading: false,
    error: null,
    lastSync: null,
    inconsistencyDetected: false
  });

  // Get balance with fallback strategy
  const getBalance = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      setBalanceState(prev => ({ ...prev, isLoading: true, error: null }));

      // Primary source: Redux user state
      const reduxBalance = parseFloat(user.pearlsBalance?.toString() || '0');
      
      // Secondary source: Wallet API
      let apiBalance = 0;
      let apiError = false;
      
      try {
        const walletData = await walletApi.getBalance();
        apiBalance = walletData.balance;
      } catch (error) {
        console.warn('Wallet API unavailable, using Redux balance:', error);
        apiError = true;
      }

      // Detect inconsistency
      const inconsistencyDetected = !apiError && Math.abs(reduxBalance - apiBalance) > 0.01;
      
      if (inconsistencyDetected) {
        console.warn(`🚨 BALANCE INCONSISTENCY DETECTED:`);
        console.warn(`   Redux Balance: ${reduxBalance} Perlas`);
        console.warn(`   API Balance: ${apiBalance} Perlas`);
        console.warn(`   Difference: ${Math.abs(reduxBalance - apiBalance)} Perlas`);
      }

      // Resolution strategy: Use API balance if available and different, otherwise Redux
      const finalBalance = inconsistencyDetected ? apiBalance : reduxBalance;
      const source = inconsistencyDetected ? 'sync' : (apiError ? 'redux' : 'api');

      // Update Redux if inconsistency detected
      if (inconsistencyDetected && !apiError) {
        dispatch(updateUser({
          ...user,
          pearlsBalance: apiBalance.toString()
        }));
      }

      setBalanceState({
        balance: finalBalance,
        source,
        isLoading: false,
        error: null,
        lastSync: new Date(),
        inconsistencyDetected
      });

      return finalBalance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error loading balance';
      setBalanceState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        balance: parseFloat(user.pearlsBalance?.toString() || '0'), // Fallback to Redux
        source: 'redux'
      }));
      
      return parseFloat(user.pearlsBalance?.toString() || '0');
    }
  }, [user, dispatch]);

  // Refresh balance manually
  const refreshBalance = useCallback(() => {
    return getBalance();
  }, [getBalance]);

  // Auto-sync on user change
  useEffect(() => {
    if (user) {
      getBalance();
    }
  }, [user, getBalance]);

  // Update balance after transactions
  const updateBalance = useCallback((newBalance: number) => {
    setBalanceState(prev => ({
      ...prev,
      balance: newBalance,
      lastSync: new Date(),
      source: 'sync'
    }));

    // Update Redux state
    if (user) {
      dispatch(updateUser({
        ...user,
        pearlsBalance: newBalance.toString()
      }));
    }
  }, [user, dispatch]);

  return {
    balance: balanceState.balance,
    isLoading: balanceState.isLoading,
    error: balanceState.error,
    source: balanceState.source,
    lastSync: balanceState.lastSync,
    inconsistencyDetected: balanceState.inconsistencyDetected,
    refreshBalance,
    updateBalance
  };
};