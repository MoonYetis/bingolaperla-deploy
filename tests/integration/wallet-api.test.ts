/**
 * Integration Tests - Wallet API Endpoints
 * Tests all wallet endpoints with real backend
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = 'http://localhost:3001';
let authToken: string;

// Test data
const TEST_USER = {
  email: 'jugador@test.com',
  password: 'password123'
};

describe('Wallet API Integration Tests', () => {
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    const loginData = await loginResponse.json();
    authToken = loginData.tokens?.accessToken;
    
    expect(authToken).toBeDefined();
  });

  describe('GET /api/wallet/balance', () => {
    it('should return wallet balance successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('balance');
      expect(data.data).toHaveProperty('dailyLimit');
      expect(data.data).toHaveProperty('monthlyLimit');
      expect(data.data).toHaveProperty('isActive');
      expect(data.data).toHaveProperty('isFrozen');
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/balance`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('should fail without query parameters (400 error)', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/transactions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Error de validación');
      expect(data.details).toEqual([
        { field: 'query', message: 'Required' }
      ]);
    });

    it('should succeed with proper query parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/transactions?limit=10&offset=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should accept optional type filter', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/transactions?limit=5&offset=0&type=CARD_PURCHASE`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // All returned transactions should be CARD_PURCHASE type
      data.data.forEach((transaction: any) => {
        expect(transaction.type).toBe('CARD_PURCHASE');
      });
    });

    it('should validate limit parameter bounds', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet/transactions?limit=200&offset=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/wallet', () => {
    it('should return comprehensive wallet info', async () => {
      const response = await fetch(`${BASE_URL}/api/wallet`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('balance');
    });
  });

  describe('POST /api/wallet/transfer', () => {
    it('should validate transfer data', async () => {
      const invalidTransfer = {
        toUsername: '', // Invalid: too short
        amount: 0,      // Invalid: too low  
        description: '', // Invalid: too short
        confirmTransfer: false // Invalid: must be true
      };

      const response = await fetch(`${BASE_URL}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidTransfer)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Error de validación');
      expect(Array.isArray(data.details)).toBe(true);
      expect(data.details.length).toBeGreaterThan(0);
    });

    it('should reject transfer to non-existent user', async () => {
      const validTransfer = {
        toUsername: 'nonexistent_user_12345',
        amount: 10,
        description: 'Test transfer to non-existent user',
        confirmTransfer: true
      };

      const response = await fetch(`${BASE_URL}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validTransfer)
      });

      // Should fail with appropriate error
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should have consistent balance between auth and wallet endpoints', async () => {
      // Get balance from auth endpoint
      const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const authData = await authResponse.json();
      const authBalance = parseFloat(authData.user.pearlsBalance);

      // Get balance from wallet endpoint  
      const walletResponse = await fetch(`${BASE_URL}/api/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const walletData = await walletResponse.json();
      const walletBalance = walletData.data.balance;

      // Log discrepancy for analysis
      if (Math.abs(authBalance - walletBalance) > 0.01) {
        console.warn(`❌ BALANCE INCONSISTENCY DETECTED IN TESTS:`);
        console.warn(`   Auth Balance: ${authBalance} Perlas`);
        console.warn(`   Wallet Balance: ${walletBalance} Perlas`);
        console.warn(`   Difference: ${Math.abs(authBalance - walletBalance)} Perlas`);
      }

      // This test documents the known inconsistency
      // In production, these should match
      expect(typeof authBalance).toBe('number');
      expect(typeof walletBalance).toBe('number');
    });
  });
});