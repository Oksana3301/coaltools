import * as functions from 'firebase-functions';
import { parse } from 'url';
import next from 'next';
import * as dotenv from 'dotenv';
import { testDatabaseConnection } from './db-test';

// Load environment variables
dotenv.config();

// Set environment variables for Supabase connection
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:MySecurePass123!@db.renoqjwuvdtesblmucax.supabase.co:5432/postgres";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "kas-besar-secret-key-2024";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://coaltools.web.app";

// Log database connection status for debugging
console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('NextAuth Secret configured:', process.env.NEXTAUTH_SECRET ? 'Yes' : 'No');
console.log('NextAuth URL configured:', process.env.NEXTAUTH_URL ? 'Yes' : 'No');

// Test database connection on function initialization
testDatabaseConnection().then(result => {
  if (result.success) {
    console.log('🎉 Supabase database connection verified successfully!');
  } else {
    console.error('❌ Supabase database connection failed:', result.error);
  }
});

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

export const nextjs = functions.https.onRequest(async (req, res) => {
  try {
    await app.prepare();
    
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
});
