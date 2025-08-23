"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const constants_1 = require("@/utils/constants");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: constants_1.ERROR_MESSAGES.VALIDATION_ERROR,
                    details: formattedErrors,
                });
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map