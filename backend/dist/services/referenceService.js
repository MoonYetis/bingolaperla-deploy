"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceService = exports.ReferenceService = void 0;
const client_1 = require("@prisma/client");
const structuredLogger_1 = require("@/utils/structuredLogger");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class ReferenceService {
    /**
     * Genera un código de referencia único alfanumérico
     * Formato: BINGO-YYYYMMDD-XXXXX (ej: BINGO-20250108-A7K9M)
     */
    generateReferenceCode() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
        return `BINGO-${dateStr}-${randomStr}`;
    }
    /**
     * Genera referencia SHA-256 para depósitos bancarios
     * Combina: timestamp + userId + amount + secret
     */
    generateSecureReference(userId, amount) {
        const timestamp = Date.now();
        const secret = process.env.JWT_SECRET || 'default-secret';
        const data = `${timestamp}-${userId}-${amount}-${secret}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
    }
    /**
     * Crear nueva referencia de pago
     */
    async createPaymentReference(data) {
        try {
            const code = this.generateReferenceCode();
            const secureRef = this.generateSecureReference(data.userId, data.amount);
            const expirationHours = data.expirationHours || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expirationHours);
            const reference = await prisma.paymentReference.create({
                data: {
                    code,
                    type: data.type,
                    userId: data.userId,
                    amount: data.amount,
                    description: data.description,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                    expiresAt,
                    isUsed: false
                }
            });
            structuredLogger_1.logger.info('Referencia de pago creada', {
                referenceId: reference.id,
                code: reference.code,
                type: data.type,
                userId: data.userId,
                amount: data.amount
            });
            return reference;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error creando referencia de pago', error, { userId: data.userId });
            throw new Error('Error generando referencia de pago');
        }
    }
    /**
     * Buscar referencia por código
     */
    async findByCode(code) {
        try {
            const reference = await prisma.paymentReference.findUnique({
                where: { code }
            });
            return reference;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error buscando referencia', error, { code });
            throw new Error('Error buscando referencia de pago');
        }
    }
    /**
     * Marcar referencia como utilizada
     */
    async markAsUsed(referenceId) {
        try {
            const reference = await prisma.paymentReference.update({
                where: { id: referenceId },
                data: {
                    isUsed: true,
                    usedAt: new Date()
                }
            });
            structuredLogger_1.logger.info('Referencia marcada como utilizada', {
                referenceId,
                code: reference.code
            });
            return reference;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error marcando referencia como usada', error, { referenceId });
            throw new Error('Error actualizando referencia');
        }
    }
    /**
     * Verificar si una referencia es válida
     */
    async isValidReference(code) {
        try {
            const reference = await this.findByCode(code);
            if (!reference) {
                return { valid: false, reason: 'Referencia no encontrada' };
            }
            if (reference.isUsed) {
                return { valid: false, reason: 'Referencia ya utilizada' };
            }
            if (new Date() > reference.expiresAt) {
                return { valid: false, reason: 'Referencia expirada' };
            }
            return { valid: true, reference };
        }
        catch (error) {
            structuredLogger_1.logger.error('Error validando referencia', error, { code });
            return { valid: false, reason: 'Error validando referencia' };
        }
    }
    /**
     * Limpiar referencias expiradas (tarea de mantenimiento)
     */
    async cleanupExpiredReferences() {
        try {
            const result = await prisma.paymentReference.deleteMany({
                where: {
                    AND: [
                        { expiresAt: { lt: new Date() } },
                        { isUsed: false }
                    ]
                }
            });
            structuredLogger_1.logger.info('Referencias expiradas limpiadas', {
                deletedCount: result.count
            });
            return result.count;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error limpiando referencias expiradas', error);
            throw new Error('Error en limpieza de referencias');
        }
    }
    /**
     * Obtener referencias por usuario
     */
    async getUserReferences(userId, options) {
        try {
            const whereClause = { userId };
            if (options?.type) {
                whereClause.type = options.type;
            }
            if (!options?.includeExpired) {
                whereClause.expiresAt = { gt: new Date() };
            }
            const references = await prisma.paymentReference.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50
            });
            return references;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo referencias de usuario', error, { userId });
            throw new Error('Error consultando referencias');
        }
    }
    /**
     * Generar referencia bancaria específica para Perú
     * Formato especial para bancos peruanos con validación
     */
    async generateBankingReference(data) {
        try {
            // Código principal del sistema
            const mainCode = this.generateReferenceCode();
            // Código para mostrar al usuario (más simple)
            const timestamp = Date.now().toString().slice(-8);
            const displayCode = `BP${timestamp}`;
            // Código de validación interno
            const validationData = `${data.depositRequestId}-${data.bankCode}-${data.amount}`;
            const validationCode = crypto_1.default
                .createHash('md5')
                .update(validationData)
                .digest('hex')
                .substring(0, 8)
                .toUpperCase();
            // Crear referencia en base de datos
            await this.createPaymentReference({
                userId: data.userId,
                amount: data.amount,
                type: 'DEPOSIT',
                description: `Depósito bancario ${data.bankCode}`,
                metadata: {
                    bankCode: data.bankCode,
                    depositRequestId: data.depositRequestId,
                    displayCode,
                    validationCode
                }
            });
            structuredLogger_1.logger.info('Referencia bancaria generada', {
                mainCode,
                displayCode,
                bankCode: data.bankCode,
                userId: data.userId
            });
            return {
                code: mainCode,
                displayCode,
                validationCode
            };
        }
        catch (error) {
            structuredLogger_1.logger.error('Error generando referencia bancaria', error, data);
            throw new Error('Error generando referencia bancaria');
        }
    }
}
exports.ReferenceService = ReferenceService;
exports.referenceService = new ReferenceService();
//# sourceMappingURL=referenceService.js.map