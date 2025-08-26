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
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// Prepare the Next.js app
const app = (0, next_1.default)({ dev, hostname, port });
const handle = app.getRequestHandler();
exports.nextjs = functions.https.onRequest(async (req, res) => {
    try {
        await app.prepare();
        const parsedUrl = (0, url_1.parse)(req.url, true);
        await handle(req, res, parsedUrl);
    }
    catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
    }
});
//# sourceMappingURL=index.js.map