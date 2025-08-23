# TypeScript Compilation Errors Fix - Todo List

## Análisis del Problema
El backend tiene errores de compilación TypeScript debido a interfaces de autenticación inconsistentes y problemas con acceso a propiedades de base de datos.

**Problemas principales identificados:**
1. Uso de `req.user.id` en lugar de `req.user.userId` (TokenPayload usa `userId`, no `id`)
2. Definiciones de interface `AuthRequest` incorrectas en algunos archivos
3. Acceso a propiedades `.user` en resultados de base de datos que no las tienen
4. Problemas con importaciones de validación (`validate` vs `validateRequest`)
5. Códigos de estado HTTP incorrectos en algunos controladores

## Plan de Ejecución

### Fase 1: Análisis y Mapeo de Archivos
- [ ] Identificar todos los archivos con errores de compilación
- [ ] Mapear tipos de errores por archivo
- [ ] Verificar estructura de TokenPayload vs interfaces anteriores

### Fase 2: Corrección de Interfaces AuthRequest
- [ ] Eliminar definiciones duplicadas de AuthRequest en controladores
- [ ] Importar AuthRequest desde `@/types/auth` en todos los archivos necesarios
- [ ] Verificar que todos usen la interfaz correcta con TokenPayload

### Fase 3: Corrección de Acceso a Propiedades de Usuario
- [ ] Cambiar `req.user.id` a `req.user.userId` en todos los controladores
- [ ] Corregir accesos a propiedades `.user` en resultados de consultas DB
- [ ] Verificar que las propiedades accedidas existan en el schema

### Fase 4: Corrección de Validación y Otros Errores
- [ ] Corregir importaciones de validación (`validate` → `validateRequest`)
- [ ] Corregir códigos de estado HTTP incorrectos
- [ ] Verificar formato correcto de validaciones

### Fase 5: Verificación Final
- [ ] Ejecutar compilación TypeScript para verificar que no hay errores
- [ ] Validar que el servidor puede iniciar correctamente
- [ ] Documentar todos los cambios realizados

## Archivos a Corregir

### Controladores con errores de `req.user.id`:
- `src/controllers/admin/paymentAdminController.ts`
- `src/controllers/paymentController.ts`
- `src/controllers/analyticsController.ts`
- `src/controllers/authController.ts`
- `src/controllers/bingoCardController.ts`
- `src/controllers/gameController.ts`
- `src/controllers/gamePurchaseController.ts`
- `src/controllers/reportController.ts`
- `src/controllers/walletController.ts`

### Rutas con problemas de interface:
- `src/routes/payment.ts`
- `src/routes/wallet.ts`
- `src/routes/analytics.ts`
- `src/routes/auth.ts`
- `src/routes/bingoCard.ts`
- `src/routes/game.ts`
- `src/routes/gamePurchase.ts`
- `src/routes/reports.ts`

### Otros archivos con errores:
- `src/controllers/gamePurchaseController.ts` (códigos de estado HTTP)

## Notas de Implementación
- Usar solo cambios mínimos y específicos
- Mantener funcionalidad existente intacta
- Verificar cada cambio con compilación incremental
- Documentar patrones encontrados para evitar regresiones futuras