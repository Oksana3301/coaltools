import * as functions from 'firebase-functions';
import { parse } from 'url';
import next from 'next';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set environment variables for Supabase connection
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:MySecurePass123!@db.renoqjwuvdtesblmucax.supabase.co:5432/postgres";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "kas-besar-secret-key-2024";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://coaltools.web.app";

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
