"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextjs = void 0;
const functions = __importStar(require("firebase-functions"));
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
// Set environment variables for Supabase connection with proper fallbacks
const databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:MySecurePass123!@db.renoqjwuvdtesblmucax.supabase.co:5432/postgres?sslmode=require";
const nextAuthSecret = process.env.NEXTAUTH_SECRET ||
    "kas-besar-secret-key-2024";
const nextAuthUrl = process.env.NEXTAUTH_URL ||
    "https://coaltools.web.app";
// Set environment variables for Next.js
process.env.DATABASE_URL = databaseUrl;
process.env.NEXTAUTH_SECRET = nextAuthSecret;
process.env.NEXTAUTH_URL = nextAuthUrl;
// Log configuration status for debugging
console.log('🔧 Firebase Function Configuration:');
console.log('Database URL configured:', databaseUrl ? '✅ Yes' : '❌ No');
console.log('NextAuth Secret configured:', nextAuthSecret ? '✅ Yes' : '❌ No');
console.log('NextAuth URL configured:', nextAuthUrl ? '✅ Yes' : '❌ No');
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// Prepare the Next.js app
const app = (0, next_1.default)({ dev, hostname, port });
const handle = app.getRequestHandler();
exports.nextjs = functions.https.onRequest(async (req, res) => {
    try {
        // Log request for debugging
        console.log(`🌐 Request: ${req.method} ${req.url}`);
        // Parse the URL
        const parsedUrl = (0, url_1.parse)(req.url, true);
        // Let Next.js handle the request
        await handle(req, res, parsedUrl);
        console.log(`✅ Request handled successfully: ${req.method} ${req.url}`);
    }
    catch (error) {
        console.error('❌ Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=index.js.map