# Openpay Integration Testing Guide

## 🧪 Testing Architecture Overview

The Openpay integration testing suite provides comprehensive coverage for payment processing functionality with three levels of testing:

### Test Levels
1. **Unit Tests** - Individual service methods and utilities
2. **Integration Tests** - API endpoints and database interactions  
3. **End-to-End Tests** - Complete payment flows and business scenarios

## 📁 Test Structure

```
backend/src/__tests__/
├── services/
│   └── openpayService.test.ts        # Unit tests for OpenpayService
├── integration/
│   └── openpayEndpoints.test.ts      # API endpoint integration tests
├── e2e/
│   └── openpayPaymentFlow.test.ts    # Complete payment flow tests
├── helpers/
│   └── testSetup.ts                  # Test utilities and factories
├── setup.ts                          # Global test setup
├── globalSetup.ts                    # Pre-test environment setup
└── globalTeardown.ts                 # Post-test cleanup
```

## 🚀 Quick Start

### Install Dependencies
```bash
cd backend
npm install
```

### Run All Openpay Tests
```bash
npm run test:openpay
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:openpay:unit

# Integration tests only
npm run test:openpay:integration

# E2E tests only
npm run test:openpay:e2e

# With coverage
npm run test:coverage
```

## 🧪 Test Categories

### Unit Tests (`openpayService.test.ts`)

**Coverage:**
- ✅ Card payment processing
- ✅ Bank transfer creation
- ✅ Customer management
- ✅ Deposit auto-approval
- ✅ Webhook signature verification
- ✅ Transaction status updates
- ✅ Error handling

**Key Test Scenarios:**
```javascript
// Successful card payment
it('should successfully process a card payment')

// Failed payment handling
it('should handle card payment failure')

// Customer creation
it('should create new customer if not exists')

// Auto-approval flow
it('should successfully auto-approve deposit')
```

### Integration Tests (`openpayEndpoints.test.ts`)

**Coverage:**
- ✅ Authentication and authorization
- ✅ Input validation and sanitization
- ✅ Rate limiting protection
- ✅ API response formats
- ✅ Database persistence
- ✅ Webhook processing

**Key Test Scenarios:**
```javascript
// Payment endpoints
POST /api/openpay/card
POST /api/openpay/bank-transfer

// Status and history
GET /api/openpay/transaction/:id
GET /api/openpay/transactions

// Webhook processing
POST /api/webhooks/openpay
```

### End-to-End Tests (`openpayPaymentFlow.test.ts`)

**Coverage:**
- ✅ Complete card payment flows
- ✅ Bank transfer workflows
- ✅ Webhook confirmations
- ✅ Balance updates
- ✅ Error scenarios
- ✅ Security validations

**Key Test Scenarios:**
```javascript
// Full payment lifecycle
it('should complete full card payment flow with automatic approval')

// Pending to confirmed flow
it('should handle card payment with pending status and webhook confirmation')

// Bank transfer flow
it('should complete bank transfer flow with manual confirmation')

// Error handling
it('should handle card declined scenario')
```

## 🔧 Test Configuration

### Environment Variables
Tests use isolated test environment with mock configurations:

```typescript
// Test environment setup
NODE_ENV=test
JWT_SECRET=test_jwt_secret
DATABASE_URL=file:./test_openpay.db

// Openpay test config
OPENPAY_MERCHANT_ID=test_merchant_id
OPENPAY_PRIVATE_KEY=test_private_key
OPENPAY_PUBLIC_KEY=test_public_key
OPENPAY_PRODUCTION=false
OPENPAY_WEBHOOK_USERNAME=test_webhook_user
OPENPAY_WEBHOOK_PASSWORD=test_webhook_password
```

### Jest Configuration
```javascript
// jest.config.js highlights
coverageThreshold: {
  './src/services/openpayService.ts': {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  }
},
testTimeout: 30000,
projects: ['unit', 'integration', 'e2e']
```

## 🛠 Test Utilities

### Test Data Factories
```javascript
// Create test users and auth tokens
const testUser = await createTestUser();
const authToken = createAuthToken(testUser);

// Generate test data
const depositRequest = TestDataFactory.depositRequest(userId);
const transaction = TestDataFactory.openpayTransaction(requestId);
const webhookPayload = TestDataFactory.webhookPayload(chargeId);
```

### Test Assertions
```javascript
// Payment response validation
TestAssertions.expectSuccessfulPayment(response, amount);
TestAssertions.expectFailedPayment(response, errorMessage);
TestAssertions.expectValidationError(response, errorCode);
TestAssertions.expectUnauthorized(response);
TestAssertions.expectRateLimited(response);
```

## 🎯 Testing Best Practices

### 1. Test Isolation
- Each test runs with clean database state
- Mock external Openpay API calls
- Independent test data creation

### 2. Realistic Test Data
- Use valid Peruvian phone numbers (+51...)
- Proper email formats
- Realistic payment amounts (1-10,000 PEN)
- Valid payment method formats

### 3. Error Scenarios
```javascript
// Test common Openpay errors
mockOpenpayClient.charges.create.mockRejectedValue({
  error_code: 'CARD_DECLINED',
  description: 'The card was declined'
});
```

### 4. Security Testing
- Input validation for all payment endpoints
- Authentication and authorization checks
- Rate limiting validation
- Webhook signature verification

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **OpenpayService**: 85% (functions, lines, statements)
- **OpenpayController**: 80% (functions, lines, statements)  
- **Security Middleware**: 85% (functions, lines, statements)
- **Overall Backend**: 70% (all metrics)

### Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 🚨 Security Testing

### Fraud Detection Tests
```javascript
// Test suspicious activity detection
it('should detect rapid payment attempts')
it('should flag unusual amounts for new users')
it('should identify multiple payment methods from same IP')
```

### Input Validation Tests
```javascript
// Test malicious input handling
it('should sanitize customer names with harmful characters')
it('should validate email formats')
it('should enforce amount limits')
```

### Webhook Security Tests
```javascript
// Test webhook signature verification
it('should verify valid webhook signatures')
it('should reject invalid signatures')
it('should enforce timestamp tolerance')
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/openpay-tests.yml
- name: Run Openpay Tests
  run: |
    npm run test:openpay:unit
    npm run test:openpay:integration
    npm run test:openpay:e2e
    npm run test:coverage
```

### Quality Gates
- ✅ All tests must pass
- ✅ Coverage thresholds must be met
- ✅ No security vulnerabilities
- ✅ Linting and formatting checks

## 📈 Performance Testing

### Load Testing Scenarios
```javascript
// Test rate limiting under load
it('should handle concurrent payment requests')
it('should enforce rate limits correctly')
it('should process webhooks efficiently')
```

### Database Performance
- Transaction creation speed
- Query optimization verification
- Connection pool management

## 🐛 Debugging Tests

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Reset test database
npm run prisma:reset
rm -f test_openpay.db*
```

#### Mock Configuration Problems
```javascript
// Verify mock setup
console.log('Mock calls:', mockOpenpayClient.charges.create.mock.calls);
```

#### Async Test Problems
```javascript
// Use proper async/await
await expect(asyncFunction()).resolves.toBeTruthy();
```

## 📋 Pre-Deployment Checklist

### Before Production Deployment
- [ ] All unit tests passing (100%)
- [ ] All integration tests passing (100%)  
- [ ] All E2E tests passing (100%)
- [ ] Coverage thresholds met
- [ ] Security tests passing
- [ ] Performance benchmarks acceptable
- [ ] Manual testing completed
- [ ] Error handling verified
- [ ] Webhook processing tested

### Test Data Cleanup
- [ ] No test data in production database
- [ ] Test environment variables removed
- [ ] Mock configurations disabled
- [ ] Production Openpay credentials configured

## 🔗 Related Documentation

- [Openpay Integration Design](../architecture/openpay-integration-design.md)
- [Security Architecture](../architecture/security-architecture.md)
- [API Documentation](../api/openpay-endpoints.md)
- [Deployment Guide](../deployment/production-setup.md)

## 🆘 Support

For testing issues or questions:
1. Check test logs: `tail -f test_logs/*.log`
2. Review Jest documentation: https://jestjs.io/
3. Openpay API reference: https://docs.openpay.pe/
4. Contact development team for assistance

---

**Last Updated:** January 2025  
**Test Suite Version:** 1.0.0  
**Openpay SDK Version:** 1.3.5