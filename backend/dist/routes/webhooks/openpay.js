"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openpayWebhookController_1 = require("@/controllers/webhooks/openpayWebhookController");
const openpaySecurityMiddleware_1 = require("@/middleware/openpaySecurityMiddleware");
const router = (0, express_1.Router)();
const webhookController = new openpayWebhookController_1.OpenpayWebhookController();
// Webhook endpoint with signature verification
router.post('/', ...openpaySecurityMiddleware_1.applyWebhookSecurity, (req, res) => webhookController.handleWebhook(req, res));
exports.default = router;
//# sourceMappingURL=openpay.js.map