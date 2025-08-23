# Openpay Development & Testing Setup

Esta documentación explica cómo configurar y usar el sistema de pagos Openpay en modo desarrollo/mock para testing sin necesidad de credenciales reales.

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Modos de Desarrollo](#modos-de-desarrollo)
- [Testing con Mock](#testing-con-mock)
- [Escenarios de Prueba](#escenarios-de-prueba)
- [Utilidades de Testing](#utilidades-de-testing)
- [Troubleshooting](#troubleshooting)

## 🚀 Configuración Inicial

### 1. Variables de Entorno

El archivo `.env` ya incluye configuraciones mock para desarrollo:

```env
# Openpay Configuration (Development/Mock Mode)
OPENPAY_PRODUCTION=false
OPENPAY_MERCHANT_ID="mock_merchant_12345"
OPENPAY_PRIVATE_KEY="sk_mock_private_key_development_12345"
OPENPAY_PUBLIC_KEY="pk_mock_public_key_development_12345"
OPENPAY_WEBHOOK_USERNAME="mock_webhook_user"
OPENPAY_WEBHOOK_PASSWORD="mock_webhook_password_12345"

# Mock mode settings
OPENPAY_MOCK_MODE=true
OPENPAY_MOCK_DELAY_MS=1000
OPENPAY_MOCK_SUCCESS_RATE=0.95
```

### 2. Validación de Configuración

Al iniciar la aplicación en desarrollo, se ejecuta automáticamente la validación:

```bash
npm run dev
```

Verás salida como:
```
✅ Environment configuration is valid (with warnings)
🔧 Development configuration:
  - NODE_ENV: development
  - OPENPAY_MOCK_MODE: true
  - OPENPAY_MOCK_DELAY_MS: 1000ms
  - OPENPAY_MOCK_SUCCESS_RATE: 95%
```

## 🔧 Modos de Desarrollo

### Perfiles Disponibles

1. **development** (por defecto)
   - Mock habilitado
   - Delay: 1000ms
   - Success rate: 95%
   - Logs: debug

2. **test**
   - Mock habilitado
   - Delay: 0ms (instantáneo)
   - Success rate: 100%
   - Logs: warn only

3. **demo**
   - Mock habilitado
   - Delay: 2000ms (más realista)
   - Success rate: 98%
   - Logs: info

4. **stress**
   - Mock habilitado
   - Delay: 500ms
   - Success rate: 75% (incluye más fallos)
   - Logs: debug

### Cambiar Perfil de Desarrollo

```bash
# Usando variable de entorno
DEVELOPMENT_PROFILE=demo npm run dev

# O modificar directamente el código
import { applyDevelopmentProfile } from '@/config/development';
applyDevelopmentProfile('stress');
```

## 🧪 Testing con Mock

### Importar Utilidades

```typescript
import OpenpayTestUtils from '@/utils/openpayTestUtils';
import { developmentUtils } from '@/config/development';
```

### Configurar Comportamiento Mock

```typescript
// Forzar éxito en todos los pagos
developmentUtils.setMockBehavior('success');

// Forzar fallo en todos los pagos
developmentUtils.setMockBehavior('failure');

// Comportamiento aleatorio (por defecto)
developmentUtils.setMockBehavior('random');
```

### Generar Datos de Test

```typescript
// Generar datos de pago con tarjeta
const cardPayment = OpenpayTestUtils.generateCardPaymentData('successfulCard');

// Generar datos de transferencia bancaria
const bankTransfer = OpenpayTestUtils.generateBankTransferData();

// Generar cliente de prueba
const customer = OpenpayTestUtils.generateTestCustomer();
```

## 🎭 Escenarios de Prueba

### Escenarios Disponibles

```typescript
// Obtener lista de escenarios disponibles
const scenarios = OpenpayTestUtils.getAvailableScenarios();
console.log(scenarios);
// ['successfulCard', 'successfulDebit', 'cardDeclined', 'fraudDetected', 'invalidCard', 'networkError', 'slowPayment']
```

### Configurar Escenario Específico

```typescript
// Configurar escenario de tarjeta declinada
OpenpayTestUtils.setupMockScenario('cardDeclined');

// Ejecutar pago de prueba
const result = await OpenpayTestUtils.runQuickTest('cardDeclined');
```

### Detalles de Escenarios

| Escenario | Descripción | Token de Prueba | Resultado |
|-----------|-------------|----------------|-----------|
| `successfulCard` | Pago exitoso con tarjeta de crédito | `tok_test_success_12345` | ✅ Éxito |
| `successfulDebit` | Pago exitoso con tarjeta de débito | `tok_test_debit_success_12345` | ✅ Éxito |
| `cardDeclined` | Tarjeta declinada por el banco | `tok_test_declined_12345` | ❌ CARD_DECLINED |
| `fraudDetected` | Bloqueo por detección de fraude | `tok_test_fraud_12345` | ❌ FRAUD_DETECTED |
| `invalidCard` | Token de tarjeta inválido | `tok_test_invalid_12345` | ❌ INVALID_REQUEST |
| `networkError` | Error de comunicación | `tok_test_network_error_12345` | ❌ NETWORK_ERROR |
| `slowPayment` | Pago con delay de 5s | `tok_test_slow_12345` | ✅ Éxito (lento) |

## 🛠 Utilidades de Testing

### Tests Rápidos

```typescript
// Test individual
const result = await OpenpayTestUtils.runQuickTest('successfulCard');
console.log(result);

// Test de estrés (múltiples escenarios)
const stressResults = await OpenpayTestUtils.runStressTest(50);
console.log(`Success rate: ${stressResults.successRate}%`);
```

### Generación de Webhooks

```typescript
// Generar evento de webhook mock
const webhookEvent = OpenpayTestUtils.generateMockWebhookEvent(
  'charge.succeeded',
  { id: 'charge_123', amount: 100, customerId: 'cust_456' }
);

// Crear payload completo con firma
const webhookPayload = OpenpayTestUtils.createTestWebhookPayload(
  'charge.succeeded',
  chargeData
);
```

### Validación de Respuestas

```typescript
// Validar formato de respuesta mock
const isValid = OpenpayTestUtils.validateMockResponse(response, 'card');
console.log(`Response is valid: ${isValid}`);
```

## 🔍 Debugging

### Logs Detallados

Los logs incluyen información específica de mock mode:

```typescript
import { logger } from '@/utils/structuredLogger';

// Los logs mostrarán automáticamente mockMode: true
logger.info('Processing payment', { amount: 100, mockMode: true });
```

### Configuración Actual

```typescript
import { developmentUtils } from '@/config/development';

// Ver configuración actual
developmentUtils.logCurrentConfig();
```

## 📊 Ejemplos de Uso

### Test de Pago Exitoso

```typescript
import { OpenpayService } from '@/services/openpayService';
import OpenpayTestUtils from '@/utils/openpayTestUtils';

async function testSuccessfulPayment() {
  // Configurar escenario exitoso
  OpenpayTestUtils.setupMockScenario('successfulCard');
  
  // Generar datos de pago
  const paymentData = OpenpayTestUtils.generateCardPaymentData('successfulCard');
  
  // Procesar pago
  const openpayService = new OpenpayService();
  const result = await openpayService.processCardPayment(paymentData);
  
  console.log('Payment result:', result);
  // Expected: { success: true, transactionId: '...', status: 'completed' }
}
```

### Test de Manejo de Errores

```typescript
async function testPaymentFailure() {
  // Configurar escenario de fallo
  OpenpayTestUtils.setupMockScenario('cardDeclined');
  
  const paymentData = OpenpayTestUtils.generateCardPaymentData('cardDeclined');
  
  try {
    const result = await openpayService.processCardPayment(paymentData);
    console.log('Unexpected success:', result);
  } catch (error) {
    console.log('Expected error:', error.message);
    // Expected: 'The card was declined by the issuing bank'
  }
}
```

### Test de Webhook

```typescript
import request from 'supertest';
import { createTestApp } from '@/__tests__/helpers/testSetup';

async function testWebhookProcessing() {
  const app = await createTestApp();
  
  // Generar webhook payload
  const webhookData = OpenpayTestUtils.createTestWebhookPayload(
    'charge.succeeded',
    { id: 'charge_123', amount: 100, customerId: 'cust_456' }
  );
  
  // Enviar webhook
  const response = await request(app)
    .post('/api/webhooks/openpay')
    .set(webhookData.headers)
    .send(webhookData.payload);
  
  expect(response.status).toBe(200);
}
```

## ⚠️ Troubleshooting

### Problemas Comunes

1. **Mock no funciona**
   - Verificar que `OPENPAY_MOCK_MODE=true`
   - Revisar que las credenciales contengan "mock"

2. **Tests muy lentos**
   - Reducir `OPENPAY_MOCK_DELAY_MS` o usar perfil "test"

3. **Demasiados fallos en tests**
   - Aumentar `OPENPAY_MOCK_SUCCESS_RATE`
   - Usar `developmentUtils.setMockBehavior('success')`

4. **Webhooks no funcionan**
   - Verificar que la URL del webhook sea correcta
   - Revisar logs de signature validation

### Comandos de Diagnóstico

```bash
# Verificar configuración
npm run dev | grep -A 10 "Development configuration"

# Ejecutar tests específicos
npm run test:openpay

# Verificar tipos
npm run typecheck
```

### Resetear Configuración

```typescript
// Resetear a valores por defecto
OpenpayTestUtils.resetMockEnvironment();
developmentUtils.resetMockState();
```

## 🔐 Seguridad en Desarrollo

**IMPORTANTE:** Las credenciales mock están diseñadas solo para desarrollo:

- ✅ Contienen "mock" en el nombre
- ✅ No funcionan con la API real de Openpay
- ✅ Son seguras para commits en git
- ❌ NUNCA usar en producción

Para producción, usar credenciales reales y configurar:
```env
OPENPAY_MOCK_MODE=false
OPENPAY_PRODUCTION=true
```

## 📚 Referencias

- [Documentación Oficial de Openpay](https://openpay.pe/docs)
- [Configuración de Desarrollo](./src/config/development.ts)
- [Utilidades de Testing](./src/utils/openpayTestUtils.ts)
- [Tests de Ejemplo](./src/__tests__/services/openpayService.test.ts)

---

**¿Necesitas ayuda?** Revisa los logs detallados o ejecuta:

```typescript
import { logEnvironmentValidation } from '@/config/environment';
logEnvironmentValidation();
```