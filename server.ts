import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Endpoint: Single AI Product Generation & Auto-Editing
  app.post('/api/ai/process-product', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY environment variable is not set. Please add your Gemini key in AI Studio Secrets.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const { mode, rawInput, existingProduct, instruction, customImage } = req.body;

      const contentsParts: any[] = [];

      // Check if customImage is a base64 Data URL (e.g. data:image/png;base64,...)
      let hasImageInput = false;
      if (typeof customImage === 'string' && customImage.trim().length > 0) {
        const match = customImage.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (match) {
          contentsParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
          hasImageInput = true;
        }
      }

      let prompt = '';
      if (mode === 'edit') {
        prompt = `You are an expert e-commerce catalog AI manager for Pakistan's Cart Go marketplace.
Your task is to EDIT an existing store product according to the merchant's instructions.

EXISTING PRODUCT JSON:
${JSON.stringify(existingProduct, null, 2)}

MERCHANT EDIT INSTRUCTION:
"${instruction || rawInput}"

${hasImageInput ? 'THE MERCHANT PROVIDED A CUSTOM PRODUCT PICTURE (ATTACHED). Analyze the image visual details (colors, materials, brand, features) and adjust product details or description accordingly.' : ''}

Guidelines:
- Carefully modify the fields requested (title, description, price in PKR, stock, category, tags, features, deliveryFee, variants, imageUrl).
- Keep unmodified fields consistent or enhance them if appropriate.
- Category MUST be strictly one of: electronics, fashion, home, beauty, sports, books, toys, grocery, automotive, other.
- Price and stock MUST be valid positive numbers in PKR.
- Return structured JSON.`;
      } else {
        prompt = `You are an expert e-commerce catalog AI generator for Pakistan's Cart Go marketplace.
The store owner provided raw data, notes, or bullet points for a product they want to publish:

RAW DATA / NOTES:
"${rawInput}"

${hasImageInput ? 'THE MERCHANT HAS ATTACHED A CUSTOM PRODUCT PICTURE. Analyze the picture carefully to identify the product type, brand markings, color, materials, design, and key visual features to craft an accurate, high-converting product title, description, category, and highlight features matching the picture!' : ''}

Create a complete, high-converting product listing:
1. Title: Professional, descriptive e-commerce product title based on the data and picture.
2. Description: Detailed sales copywriting emphasizing features, quality, materials, and specs visible in the image and text.
3. Price: Competitive price in PKR (integer).
4. OriginalPrice: Optional original compare price in PKR (must be > price, or 0 if no discount).
5. Category: Strictly one of: electronics, fashion, home, beauty, sports, books, toys, grocery, automotive, other.
6. Stock: Integer (default 20 if unspecified).
7. DeliveryFee: Delivery fee in PKR (0 for Free Delivery).
8. Tags: 3 to 6 search tags.
9. Features: 3 to 5 key highlight bullet points.
10. ImageUrl: ${hasImageInput ? 'Use the provided custom picture' : 'A relevant high quality Unsplash image URL (e.g. https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80)'}.
11. Variants: Optional variants array (e.g., Color/Size options with priceModifier).

Return structured JSON.`;
      }

      contentsParts.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsParts.length === 1 ? contentsParts[0] : contentsParts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              originalPrice: { type: Type.NUMBER },
              category: { type: Type.STRING },
              stock: { type: Type.INTEGER },
              deliveryFee: { type: Type.NUMBER },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              imageUrl: { type: Type.STRING },
              variants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    priceModifier: { type: Type.NUMBER },
                  },
                },
              },
              aiSummary: { type: Type.STRING },
            },
            required: ['title', 'description', 'price', 'category', 'stock'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      const parsed = JSON.parse(text);

      // If customImage was provided, force parsed.imageUrl to customImage if empty or default
      if (customImage && typeof customImage === 'string' && customImage.trim().length > 0) {
        parsed.imageUrl = customImage;
      }

      return res.json({ success: true, product: parsed });
    } catch (err: any) {
      console.error('Gemini product processing error:', err);
      return res.status(500).json({ error: err.message || 'AI processing failed' });
    }
  });

  // API Endpoint: Batch AI Product Generation
  app.post('/api/ai/batch-generate-products', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY environment variable is not set.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const { bulkInput, itemsWithImages, batchImages } = req.body;

      const contentsParts: any[] = [];
      const imageIndexMap: string[] = [];

      // Process batchImages if provided
      if (Array.isArray(batchImages)) {
        for (const img of batchImages) {
          if (typeof img === 'string' && img.trim()) {
            const match = img.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
            if (match) {
              contentsParts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
              imageIndexMap.push(img);
            } else if (img.startsWith('http')) {
              imageIndexMap.push(img);
            }
          }
        }
      }

      // Process itemsWithImages if provided
      if (Array.isArray(itemsWithImages)) {
        for (const item of itemsWithImages) {
          if (item && item.customImage) {
            const img = item.customImage;
            const match = img.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
            if (match) {
              contentsParts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
              imageIndexMap.push(img);
            } else if (img.startsWith('http')) {
              imageIndexMap.push(img);
            }
          }
        }
      }

      let structuredInputText = bulkInput || '';
      if (Array.isArray(itemsWithImages) && itemsWithImages.length > 0) {
        const itemTexts = itemsWithImages.map((it, idx) => {
          const imgRef = it.customImage ? `[Product Photo Attached #${idx + 1}]` : '[No Photo]';
          return `Item ${idx + 1}: ${it.text || 'Product listing'} ${imgRef}`;
        });
        structuredInputText += '\n\n' + itemTexts.join('\n');
      }

      const hasImages = imageIndexMap.length > 0;

      const prompt = `You are an AI store automation catalog generator for Pakistan's Cart Go marketplace.
The store owner provided this batch list of products to generate and publish automatically:

"${structuredInputText}"

${hasImages ? `IMPORTANT: THE STORE OWNER HAS ATTACHED ${imageIndexMap.length} PRODUCT PHOTO(S). Analyze each attached image's visual details (product type, color, features, style, brand) to generate accurate product listings for each picture!` : ''}

Extract and generate up to 10 individual complete product listings.
For each item return:
- title
- description
- price (integer in PKR)
- originalPrice (integer in PKR or 0)
- category (electronics, fashion, home, beauty, sports, books, toys, grocery, automotive, other)
- stock (integer)
- deliveryFee (number, 0 for free delivery)
- tags (array of strings)
- features (array of strings)
- imageUrl (set to the exact image URL or data string if provided/attached, or a high quality Unsplash image URL)

Return structured JSON object containing a "products" array.`;

      contentsParts.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsParts.length === 1 ? contentsParts[0] : contentsParts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              products: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    originalPrice: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    stock: { type: Type.INTEGER },
                    deliveryFee: { type: Type.NUMBER },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    features: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    imageUrl: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'price', 'category', 'stock'],
                },
              },
            },
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('No response from Gemini API');
      const parsed = JSON.parse(text);

      let products = parsed.products || [];

      // Map attached images to products if imageUrl is missing, placeholder, or invalid
      if (imageIndexMap.length > 0) {
        products = products.map((prod: any, idx: number) => {
          if (Array.isArray(itemsWithImages) && itemsWithImages[idx] && itemsWithImages[idx].customImage) {
            prod.imageUrl = itemsWithImages[idx].customImage;
          } else if (imageIndexMap[idx]) {
            prod.imageUrl = imageIndexMap[idx];
          }
          return prod;
        });
      }

      return res.json({ success: true, products });
    } catch (err: any) {
      console.error('Batch AI generation error:', err);
      return res.status(500).json({ error: err.message || 'Batch AI generation failed' });
    }
  });

  // Helper function to recursively collect source files
  const IGNORED_ENTRIES = new Set([
    'node_modules',
    'dist',
    '.git',
    '.cache',
    '.DS_Store',
    '.turbo',
    '.next',
    'coverage',
    '.env',
    '.npm',
  ]);

  async function collectFilesRecursively(dirPath: string, rootPath: string, fileList: { relativePath: string; fullPath: string; size: number }[]) {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_ENTRIES.has(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.gitignore') continue;

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          await collectFilesRecursively(fullPath, rootPath, fileList);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          fileList.push({ relativePath, fullPath, size: stat.size });
        }
      }
    } catch (e) {
      console.warn('Error reading directory:', dirPath, e);
    }
  }

  // API Endpoint: Super Admin Code Stats
  app.get('/api/admin/code-stats', async (req, res) => {
    try {
      const rootPath = process.cwd();
      const fileList: { relativePath: string; fullPath: string; size: number }[] = [];
      await collectFilesRecursively(rootPath, rootPath, fileList);

      const totalSize = fileList.reduce((acc, f) => acc + f.size, 0);
      const filesSummary = fileList.map((f) => ({
        path: f.relativePath,
        size: f.size,
      }));

      return res.json({
        success: true,
        fileCount: fileList.length,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        files: filesSummary,
        exportedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Code stats error:', err);
      return res.status(500).json({ error: 'Failed to retrieve code stats' });
    }
  });

  // API Endpoint: Super Admin Download Complete Source Code ZIP
  app.get('/api/admin/download-source-code', async (req, res) => {
    try {
      const rootPath = process.cwd();
      const fileList: { relativePath: string; fullPath: string; size: number }[] = [];
      await collectFilesRecursively(rootPath, rootPath, fileList);

      const zip = new JSZip();

      for (const item of fileList) {
        try {
          const content = await fs.promises.readFile(item.fullPath);
          zip.file(item.relativePath, content);
        } catch (readErr) {
          console.warn(`Could not read file for zip: ${item.relativePath}`, readErr);
        }
      }

      // Add clean setup README
      const readmeContent = `# Cart Go - Full Stack E-Commerce & Marketplace Application

Exported directly from the **Cart Go Super Admin Console**.

---

## 📦 Project Overview
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend Server**: Node.js, Express, Google GenAI SDK (Gemini AI Vision & Content Generation)
- **Database & Auth**: Google Firebase (Firestore Database, Firebase Authentication)
- **Build Tool**: Vite & esbuild

---

## 🚀 How to Run Locally

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Copy \`.env.example\` to \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`
Set your Gemini API key:
\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

---
*Created with Google AI Studio Build.*
`;
      zip.file('README.md', readmeContent);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `cartgo-source-code-${dateStr}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length);
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error('Download source code error:', err);
      return res.status(500).json({ error: 'Failed to generate source code zip file: ' + err.message });
    }
  });

  // In-memory store for pending account confirmation codes
  interface VerificationEntry {
    code: string;
    email: string;
    name: string;
    role: string;
    createdAt: number;
    expiresAt: number;
  }
  const pendingVerifications = new Map<string, VerificationEntry>();

  // API Endpoint: Send Registration Confirmation Code from cartgosupport@gmail.com
  app.post('/api/auth/send-verification-code', async (req, res) => {
    try {
      const { email, name, role } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      // Generate 6-digit confirmation code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry

      pendingVerifications.set(cleanEmail, {
        code,
        email: cleanEmail,
        name: name || 'Cart Go User',
        role: role || 'buyer',
        createdAt: now,
        expiresAt,
      });

      const senderEmail = process.env.GMAIL_SUPPORT_EMAIL || process.env.SMTP_USER || 'cartgosupport@gmail.com';
      const smtpPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASSWORD;
      let realEmailSent = false;
      let emailError: string | null = null;

      // Attempt real Gmail / SMTP dispatch if password/app password is provided
      if (smtpPassword) {
        try {
          const transporterConfig: any = process.env.SMTP_HOST
            ? {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 465,
                secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
                auth: {
                  user: senderEmail,
                  pass: smtpPassword,
                },
              }
            : {
                service: 'gmail',
                auth: {
                  user: senderEmail,
                  pass: smtpPassword,
                },
              };

          const transporter = nodemailer.createTransport(transporterConfig);

          const mailOptions = {
            from: `"Cart Go Support" <${senderEmail}>`,
            to: cleanEmail,
            subject: `Cart Go Account Confirmation Code: ${code}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 28px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #FF9900, #FF5500); padding: 10px 20px; border-radius: 12px; margin-bottom: 8px;">
                    <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Cart Go</span>
                  </div>
                  <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Official Account Confirmation Service</p>
                </div>

                <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="color: #9a3412; font-size: 15px; margin: 0 0 8px 0; font-weight: 800;">Hello ${name || 'Valued User'},</p>
                  <p style="color: #7c2d12; font-size: 13px; margin: 0; line-height: 1.6;">
                    Thank you for signing up for <strong>Cart Go</strong>. To finalize your registration and activate your account, please enter the following 6-digit confirmation code:
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <div style="display: inline-block; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #0f172a; background-color: #f8fafc; padding: 16px 32px; border-radius: 14px; border: 2px dashed #cbd5e1; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    ${code}
                  </div>
                  <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0 0; font-weight: 600;">⏰ This code is valid for 10 minutes.</p>
                </div>

                <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #475569; margin: 0; line-height: 1.5;">
                    🔒 <strong>Security Tip:</strong> Never share this confirmation code with anyone. Cart Go employees will never ask for your code.
                  </p>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0 0 16px 0;">
                  If you did not attempt to create a Cart Go account, please disregard this message or contact our official support team directly at <a href="mailto:${senderEmail}" style="color: #FF5500; text-decoration: none; font-weight: bold;">${senderEmail}</a>.
                </p>

                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0; font-weight: 500;">
                  © 2026 Cart Go Marketplace • Sent automatically from ${senderEmail}
                </p>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          realEmailSent = true;
          console.log(`[SMTP SUCCESS] Verification email sent to ${cleanEmail} from ${senderEmail}`);
        } catch (mailErr: any) {
          console.warn('[SMTP WARNING] Could not send via live SMTP:', mailErr.message);
          emailError = mailErr.message;
        }
      } else {
        console.log(`[SIMULATED DISPATCH] GMAIL_APP_PASSWORD not configured. Code ${code} generated for ${cleanEmail} from ${senderEmail}`);
      }

      return res.json({
        success: true,
        message: `Confirmation code sent from ${senderEmail}`,
        sender: senderEmail,
        recipient: cleanEmail,
        code, // Returned for instant testing and auto-fill in development environment
        realEmailSent,
        emailError,
        expiresInSeconds: 600,
      });
    } catch (err: any) {
      console.error('Send verification code error:', err);
      return res.status(500).json({ error: 'Failed to dispatch confirmation code: ' + err.message });
    }
  });

  // API Endpoint: Test Email Dispatch for Super Admin
  app.post('/api/admin/send-test-email', async (req, res) => {
    try {
      const { targetEmail } = req.body;
      const recipient = (targetEmail || 'cartgosupport@gmail.com').trim().toLowerCase();
      const senderEmail = process.env.GMAIL_SUPPORT_EMAIL || process.env.SMTP_USER || 'cartgosupport@gmail.com';
      const smtpPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASSWORD;

      if (!smtpPassword) {
        return res.json({
          success: false,
          configured: false,
          sender: senderEmail,
          recipient,
          error: 'GMAIL_APP_PASSWORD environment variable is not configured. To send real emails from cartgosupport@gmail.com, generate a Google 16-character App Password and add it to your project environment variables.',
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: senderEmail,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"Cart Go Support" <${senderEmail}>`,
        to: recipient,
        subject: `Cart Go Test Verification Dispatch - ${new Date().toLocaleTimeString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #FF5500;">Cart Go Support Email Test</h2>
            <p>This is a live test email sent directly from <strong>${senderEmail}</strong> to verify that your email confirmation service is working properly.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      return res.json({
        success: true,
        configured: true,
        sender: senderEmail,
        recipient,
        message: `Test email successfully delivered to ${recipient} from ${senderEmail}!`,
      });
    } catch (err: any) {
      console.error('Admin test email dispatch error:', err);
      return res.status(500).json({
        success: false,
        configured: true,
        error: err.message || 'Failed to send test email',
      });
    }
  });

  // API Endpoint: Check SMTP status
  app.get('/api/admin/smtp-status', (req, res) => {
    const senderEmail = process.env.GMAIL_SUPPORT_EMAIL || process.env.SMTP_USER || 'cartgosupport@gmail.com';
    const hasPassword = Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASSWORD);
    return res.json({
      sender: senderEmail,
      configured: hasPassword,
    });
  });

  // API Endpoint: Verify Confirmation Code
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();
      const entry = pendingVerifications.get(cleanEmail);

      if (!entry) {
        return res.status(400).json({
          error: 'No active confirmation code found for this email. Please request a new code.',
        });
      }

      if (Date.now() > entry.expiresAt) {
        pendingVerifications.delete(cleanEmail);
        return res.status(400).json({
          error: 'Verification code has expired. Please request a new code.',
        });
      }

      if (entry.code !== cleanCode) {
        return res.status(400).json({
          error: 'Invalid confirmation code! Please enter the exact 6-digit code sent from cartgosupport@gmail.com.',
        });
      }

      // Code matched successfully!
      pendingVerifications.delete(cleanEmail);

      return res.json({
        success: true,
        verified: true,
        email: cleanEmail,
        message: 'Account email confirmed successfully from cartgosupport@gmail.com.',
      });
    } catch (err: any) {
      console.error('Verify code error:', err);
      return res.status(500).json({ error: 'Verification failed: ' + err.message });
    }
  });

  // Explicitly serve manifest with application/manifest+json for Chromium/Android PWA criteria
  app.get(['/manifest.webmanifest', '/manifest.json'], (req, res, next) => {
    const manifestFile = req.path.includes('manifest.json') ? 'manifest.json' : 'manifest.webmanifest';
    const publicPath = path.join(process.cwd(), 'public', manifestFile);
    const distPath = path.join(process.cwd(), 'dist', manifestFile);
    
    if (fs.existsSync(distPath)) {
      res.setHeader('Content-Type', 'application/manifest+json');
      return res.sendFile(distPath);
    }
    if (fs.existsSync(publicPath)) {
      res.setHeader('Content-Type', 'application/manifest+json');
      return res.sendFile(publicPath);
    }
    next();
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
