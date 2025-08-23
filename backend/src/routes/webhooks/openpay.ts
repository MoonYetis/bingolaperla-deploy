import { Router } from 'express';
import { OpenpayWebhookController } from '@/controllers/webhooks/openpayWebhookController';
import { applyWebhookSecurity } from '@/middleware/openpaySecurityMiddleware';

const router = Router();
const webhookController = new OpenpayWebhookController();

// Webhook endpoint with signature verification
router.post('/', ...applyWebhookSecurity, (req, res) => webhookController.handleWebhook(req, res));

export default router;