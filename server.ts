import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

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
