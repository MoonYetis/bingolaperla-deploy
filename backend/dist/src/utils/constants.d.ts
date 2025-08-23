export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const ERROR_MESSAGES: {
    INVALID_CREDENTIALS: string;
    USER_NOT_FOUND: string;
    EMAIL_ALREADY_EXISTS: string;
    USERNAME_ALREADY_EXISTS: string;
    UNAUTHORIZED: string;
    TOKEN_EXPIRED: string;
    INVALID_TOKEN: string;
    VALIDATION_ERROR: string;
    INTERNAL_ERROR: string;
    RATE_LIMIT_EXCEEDED: string;
};
export declare const SUCCESS_MESSAGES: {
    USER_CREATED: string;
    LOGIN_SUCCESS: string;
    LOGOUT_SUCCESS: string;
    TOKEN_REFRESHED: string;
};
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly USER: "user";
};
export declare const TOKEN_TYPES: {
    readonly ACCESS: "access";
    readonly REFRESH: "refresh";
};
//# sourceMappingURL=constants.d.ts.map