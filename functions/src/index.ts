import * as functions from 'firebase-functions';
import { parse } from 'url';
import next from 'next';
import * as dotenv from 'dotenv';

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
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

export const nextjs = functions.https.onRequest(async (req, res) => {
  try {
    // Log request for debugging
    console.log(`🌐 Request: ${req.method} ${req.url}`);
    
    // Parse the URL
    const parsedUrl = parse(req.url!, true);
    
    // Let Next.js handle the request
    await handle(req, res, parsedUrl);
    
    console.log(`✅ Request handled successfully: ${req.method} ${req.url}`);
  } catch (error) {
    console.error('❌ Error handling request:', error);
    res.status(500).send('Internal Server Error');
  }
});
