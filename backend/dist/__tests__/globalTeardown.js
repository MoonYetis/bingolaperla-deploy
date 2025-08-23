"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function globalTeardown() {
    console.log('🧹 Starting global test teardown...');
    try {
        // Remove test database
        const testDbPath = path_1.default.join(process.cwd(), 'test_openpay.db');
        if (fs_1.default.existsSync(testDbPath)) {
            fs_1.default.unlinkSync(testDbPath);
            console.log('🗑️  Removed test database');
        }
        // Remove test logs directory if empty
        const logsDir = path_1.default.join(process.cwd(), 'test_logs');
        if (fs_1.default.existsSync(logsDir)) {
            try {
                const files = fs_1.default.readdirSync(logsDir);
                if (files.length === 0) {
                    fs_1.default.rmdirSync(logsDir);
                    console.log('📁 Removed empty test logs directory');
                }
                else {
                    console.log('📁 Test logs directory contains files, keeping it');
                }
            }
            catch (error) {
                console.warn('⚠️  Could not clean test logs directory:', error);
            }
        }
        // Clean up any temporary files
        const tempFiles = [
            'test_openpay.db-journal',
            'test_openpay.db-wal',
            'test_openpay.db-shm'
        ];
        for (const file of tempFiles) {
            const filePath = path_1.default.join(process.cwd(), file);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`🗑️  Removed ${file}`);
            }
        }
        console.log('✅ Global test teardown completed successfully');
    }
    catch (error) {
        console.error('❌ Global test teardown failed:', error);
        // Don't exit with error code as this might prevent test results from being reported
    }
}
//# sourceMappingURL=globalTeardown.js.map