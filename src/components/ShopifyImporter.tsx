import React, { useState } from 'react';
import {
  Store,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PackageCheck,
  Sparkles,
  ArrowRight,
  Key,
  FileSpreadsheet,
  RefreshCw,
  Check,
  FileText,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';
import { formatPKR } from '../utils/formatters';

interface ShopifyProduct {
  id: string | number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string | string[];
  variants?: Array<{
    price: string | number;
    compare_at_price?: string | number | null;
    inventory_quantity?: number;
  }>;
  images?: Array<{
    src: string;
  }>;
  image?: {
    src: string;
  };
}

interface ParsedImportProduct {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  additionalImages: string[];
  stock: number;
  deliveryFee: number;
  selected: boolean;
  vendor?: string;
}

interface ShopifyImporterProps {
  onSuccess: (count: number) => void;
}

const DEMO_SHOPIFY_URLS = [
  'https://kith.com',
  'https://www.gymshark.com',
  'https://www.allbirds.com',
  'https://shop.fentybeauty.com',
];

export const ShopifyImporter: React.FC<ShopifyImporterProps> = ({ onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const [importMethod, setImportMethod] = useState<'url' | 'token' | 'csv'>('url');

  // URL Import State
  const [storeUrl, setStoreUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed Products State
  const [parsedProducts, setParsedProducts] = useState<ParsedImportProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importCompletedCount, setImportCompletedCount] = useState<number | null>(null);

  // Helper to map Shopify product type or tags to CartGo category
  const mapShopifyCategory = (productType?: string, tags?: string | string[]): string => {
    const combined = `${productType || ''} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`.toLowerCase();
    
    if (combined.includes('phone') || combined.includes('electronic') || combined.includes('gadget') || combined.includes('watch') || combined.includes('camera')) {
      return 'electronics';
    }
    if (combined.includes('cloth') || combined.includes('apparel') || combined.includes('shirt') || combined.includes('shoe') || combined.includes('fashion') || combined.includes('dress') || combined.includes('pant')) {
      return 'fashion';
    }
    if (combined.includes('home') || combined.includes('kitchen') || combined.includes('furniture') || combined.includes('decor')) {
      return 'home';
    }
    if (combined.includes('beauty') || combined.includes('skincare') || combined.includes('cosmetic') || combined.includes('makeup') || combined.includes('perfume')) {
      return 'beauty';
    }
    if (combined.includes('sport') || combined.includes('gym') || combined.includes('fitness') || combined.includes('outdoor')) {
      return 'sports';
    }
    if (combined.includes('toy') || combined.includes('game') || combined.includes('kid') || combined.includes('baby')) {
      return 'toys';
    }
    if (combined.includes('book') || combined.includes('stationery') || combined.includes('office')) {
      return 'books';
    }
    if (combined.includes('auto') || combined.includes('car') || combined.includes('bike') || combined.includes('motor')) {
      return 'automotive';
    }
    return CATEGORIES[0].id; // Default category
  };

  // Strip HTML tags from description
  const cleanDescription = (html?: string): string => {
    if (!html) return 'Imported directly from Shopify store catalog with original product specification & guarantee.';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.trim().slice(0, 500) || 'Imported directly from Shopify store catalog.';
  };

  // 1-Click Fetch Products from Shopify Store URL
  const fetchFromShopifyUrl = async (urlInput: string) => {
    setError(null);
    setLoading(true);
    setParsedProducts([]);
    setImportCompletedCount(null);

    let cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setError('Please enter a valid Shopify Store URL or domain (e.g., brand.myshopify.com).');
      setLoading(false);
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      // Remove trailing slashes
      cleanUrl = cleanUrl.replace(/\/+$/, '');
      const endpoint = `${cleanUrl}/products.json?limit=250`;

      let productsRaw: ShopifyProduct[] = [];

      // Strategy 1: Direct fetch
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.products)) {
            productsRaw = data.products;
          }
        }
      } catch (directErr) {
        console.warn('Direct fetch failed, trying CORS proxy...', directErr);
      }

      // Strategy 2: If direct fetch failed or was blocked by CORS, try CORS proxy fallback
      if (productsRaw.length === 0) {
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(endpoint)}`;
        const proxyResp = await fetch(proxyUrl);
        if (proxyResp.ok) {
          const data = await proxyResp.json();
          if (data && Array.isArray(data.products)) {
            productsRaw = data.products;
          }
        } else {
          // Fallback Strategy 3: AllOrigins proxy
          const fallbackProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`;
          const fbResp = await fetch(fallbackProxy);
          if (fbResp.ok) {
            const data = await fbResp.json();
            if (data && Array.isArray(data.products)) {
              productsRaw = data.products;
            }
          }
        }
      }

      if (productsRaw.length === 0) {
        throw new Error('No products found or the store endpoint is protected. You can try uploading a Shopify CSV export file or using an Admin Access Token.');
      }

      // Convert raw Shopify products to CartGo format
      const mappedProducts: ParsedImportProduct[] = productsRaw.map((sp) => {
        const mainVariant = sp.variants && sp.variants.length > 0 ? sp.variants[0] : null;
        const priceNum = mainVariant ? parseFloat(String(mainVariant.price)) : 1000;
        const origPriceNum = mainVariant && mainVariant.compare_at_price ? parseFloat(String(mainVariant.compare_at_price)) : priceNum * 1.25;

        // Extract images
        let mainImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        const addImgs: string[] = [];

        if (sp.images && sp.images.length > 0) {
          mainImg = sp.images[0].src;
          sp.images.slice(1, 6).forEach((img) => addImgs.push(img.src));
        } else if (sp.image && sp.image.src) {
          mainImg = sp.image.src;
        }

        const stockNum = mainVariant && typeof mainVariant.inventory_quantity === 'number' && mainVariant.inventory_quantity > 0
          ? mainVariant.inventory_quantity
          : 25;

        return {
          title: sp.title,
          description: cleanDescription(sp.body_html),
          price: Math.round(priceNum) || 999,
          originalPrice: Math.round(origPriceNum) || Math.round(priceNum * 1.25),
          category: mapShopifyCategory(sp.product_type, sp.tags),
          imageUrl: mainImg,
          additionalImages: addImgs,
          stock: stockNum,
          deliveryFee: 0,
          selected: true,
          vendor: sp.vendor,
        };
      });

      setParsedProducts(mappedProducts);
    } catch (err: any) {
      console.error('Shopify Import Error:', err);
      setError(err.message || 'Failed to connect to Shopify store. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Admin Access Token Fetch
  const fetchWithAdminToken = async () => {
    setError(null);
    setLoading(true);
    setParsedProducts([]);
    setImportCompletedCount(null);

    let cleanUrl = storeUrl.trim();
    if (!cleanUrl || !accessToken.trim()) {
      setError('Please provide both Shopify Store Domain and Admin Access Token.');
      setLoading(false);
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      cleanUrl = cleanUrl.replace(/\/+$/, '');
      const endpoint = `${cleanUrl}/admin/api/2024-01/products.json?limit=250`;
      
      const response = await fetch(endpoint, {
        headers: {
          'X-Shopify-Access-Token': accessToken.trim(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API responded with status ${response.status}. Verify your token & domain permissions.`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from Shopify Admin API.');
      }

      const mappedProducts: ParsedImportProduct[] = data.products.map((sp: ShopifyProduct) => {
        const mainVariant = sp.variants && sp.variants.length > 0 ? sp.variants[0] : null;
        const priceNum = mainVariant ? parseFloat(String(mainVariant.price)) : 1000;
        const origPriceNum = mainVariant && mainVariant.compare_at_price ? parseFloat(String(mainVariant.compare_at_price)) : priceNum * 1.25;

        let mainImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        const addImgs: string[] = [];

        if (sp.images && sp.images.length > 0) {
          mainImg = sp.images[0].src;
          sp.images.slice(1, 6).forEach((img) => addImgs.push(img.src));
        }

        return {
          title: sp.title,
          description: cleanDescription(sp.body_html),
          price: Math.round(priceNum) || 999,
          originalPrice: Math.round(origPriceNum) || Math.round(priceNum * 1.25),
          category: mapShopifyCategory(sp.product_type, sp.tags),
          imageUrl: mainImg,
          additionalImages: addImgs,
          stock: mainVariant?.inventory_quantity || 30,
          deliveryFee: 0,
          selected: true,
          vendor: sp.vendor,
        };
      });

      setParsedProducts(mappedProducts);
    } catch (err: any) {
      console.error('Shopify Token Import Error:', err);
      setError(err.message || 'Failed to fetch from Shopify Admin API.');
    } finally {
      setLoading(false);
    }
  };

  // CSV / JSON File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setParsedProducts([]);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          const productsRaw = Array.isArray(json) ? json : json.products || [];
          
          const mapped: ParsedImportProduct[] = productsRaw.map((sp: any) => ({
            title: sp.title || 'Imported Shopify Item',
            description: cleanDescription(sp.body_html || sp.description),
            price: parseFloat(sp.price || sp.variants?.[0]?.price || '999'),
            originalPrice: parseFloat(sp.originalPrice || sp.variants?.[0]?.compare_at_price || '1200'),
            category: mapShopifyCategory(sp.product_type, sp.tags),
            imageUrl: sp.images?.[0]?.src || sp.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
            additionalImages: [],
            stock: 25,
            deliveryFee: 0,
            selected: true,
          }));

          setParsedProducts(mapped);
        } else {
          // Parse CSV (simple line parser)
          const lines = content.split('\n');
          if (lines.length < 2) throw new Error('CSV file is empty or missing rows.');

          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
          const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('name'));
          const bodyIdx = headers.findIndex((h) => h.includes('body') || h.includes('description'));
          const priceIdx = headers.findIndex((h) => h.includes('variant price') || h.includes('price'));
          const imageIdx = headers.findIndex((h) => h.includes('image src') || h.includes('image'));
          const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('category'));

          const items: ParsedImportProduct[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Basic CSV split
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());

            const productTitle = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx] : '';
            if (!productTitle) continue;

            const productPrice = priceIdx !== -1 && cols[priceIdx] ? parseFloat(cols[priceIdx]) : 1200;
            const productImage = imageIdx !== -1 && cols[imageIdx] ? cols[imageIdx] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
            const productType = typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx] : '';
            const productBody = bodyIdx !== -1 && cols[bodyIdx] ? cols[bodyIdx] : '';

            // Avoid duplicate rows for same title in Shopify CSV variants
            if (!items.some((it) => it.title === productTitle)) {
              items.push({
                title: productTitle,
                description: cleanDescription(productBody),
                price: Math.round(productPrice) || 999,
                originalPrice: Math.round(productPrice * 1.3),
                category: mapShopifyCategory(productType),
                imageUrl: productImage.startsWith('http') ? productImage : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
                additionalImages: [],
                stock: 20,
                deliveryFee: 0,
                selected: true,
              });
            }
          }

          if (items.length === 0) {
            throw new Error('Could not parse products from CSV file. Ensure it contains a Title column.');
          }

          setParsedProducts(items);
        }
      } catch (err: any) {
        console.error('File Parse Error:', err);
        setError(err.message || 'Failed to parse file.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    const allSelected = parsedProducts.every((p) => p.selected);
    setParsedProducts((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const toggleSelectProduct = (index: number) => {
    setParsedProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  // Final 1-Click Batch Import to Firestore
  const executeBatchImport = async () => {
    if (!currentUser) {
      setError('You must be logged in as a seller to import store products.');
      return;
    }

    const selectedToImport = parsedProducts.filter((p) => p.selected);
    if (selectedToImport.length === 0) {
      setError('Please select at least one product to import.');
      return;
    }

    setImporting(true);
    setError(null);
    setImportProgress(0);

    const sellerStoreName = userProfile?.displayName || currentUser.email?.split('@')[0] || 'Official Store';

    try {
      let count = 0;
      for (const prod of selectedToImport) {
        const newProductData = {
          title: prod.title,
          description: prod.description,
          price: prod.price,
          originalPrice: prod.originalPrice || Math.round(prod.price * 1.25),
          category: prod.category,
          imageUrl: prod.imageUrl,
          additionalImages: prod.additionalImages || [],
          stock: prod.stock || 20,
          sellerId: currentUser.uid,
          sellerName: sellerStoreName,
          rating: 5.0,
          reviewCount: 0,
          salesCount: 0,
          isFlashSale: false,
          deliveryFee: prod.deliveryFee || 0,
          createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, 'products'), newProductData);
        count++;
        setImportProgress(Math.round((count / selectedToImport.length) * 100));
      }

      setImportCompletedCount(count);
      setParsedProducts([]);
      onSuccess(count);
    } catch (err: any) {
      console.error('Batch Import Firestore Error:', err);
      setError('Failed to write imported products to database: ' + (err.message || 'Error occurred'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#008060] via-[#004C3F] to-slate-900 text-white rounded-xl p-5 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[11px] font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Official Shopify Store Bridge</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-300 shrink-0" />
            <span>1-Click Shopify Store Integration</span>
          </h2>
          <p className="text-xs text-emerald-100/90 max-w-xl">
            Import your entire Shopify product catalog, images, pricing, and stock levels directly into your CartGo marketplace store in seconds.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs hidden sm:block">
          <div className="text-center">
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wide">Automated Sync</div>
          </div>
        </div>
      </div>

      {/* Import Method Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setImportMethod('url')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            importMethod === 'url'
              ? 'bg-white text-[#008060] shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LinkIcon className="w-4 h-4 text-[#008060]" />
          <span>1-Click Store URL</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMethod('token')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            importMethod === 'token'
              ? 'bg-white text-[#008060] shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4 text-[#008060]" />
          <span>Shopify Admin API Key</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMethod('csv')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            importMethod === 'csv'
              ? 'bg-white text-[#008060] shadow-xs border border-slate-200 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#008060]" />
          <span>Upload CSV / JSON Export</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Import Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {importCompletedCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm block">Import Successful!</span>
              <span>Successfully imported {importCompletedCount} Shopify products directly to your live marketplace store.</span>
            </div>
          </div>
        </div>
      )}

      {/* Method 1: Store URL */}
      {importMethod === 'url' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              Shopify Store Web Address / Domain Name
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. kith.com or my-store.myshopify.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFromShopifyUrl(storeUrl)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => fetchFromShopifyUrl(storeUrl)}
                className="px-5 py-2.5 bg-[#008060] hover:bg-[#006048] disabled:bg-slate-300 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Store...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Fetch Store Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Demo Stores Quick-Click */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#008060]" />
              <span>Or click a sample live Shopify store URL to test 1-click import:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_SHOPIFY_URLS.map((demoUrl) => (
                <button
                  key={demoUrl}
                  type="button"
                  onClick={() => {
                    setStoreUrl(demoUrl);
                    fetchFromShopifyUrl(demoUrl);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 text-[11px] font-bold rounded-lg transition-all"
                >
                  {demoUrl.replace('https://', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Method 2: Admin Access Token */}
      {importMethod === 'token' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Shopify Shop Domain
              </label>
              <input
                type="text"
                placeholder="e.g. my-brand.myshopify.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Admin API Access Token (shpat_xxx)
              </label>
              <input
                type="password"
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={fetchWithAdminToken}
            className="w-full py-2.5 bg-[#008060] hover:bg-[#006048] disabled:bg-slate-300 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating & Fetching...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Connect & Import via Admin API</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Method 3: CSV/JSON File Drag and Drop */}
      {importMethod === 'csv' && (
        <div className="space-y-3">
          <label className="block text-xs font-extrabold text-slate-800">
            Select Shopify Exported Products File (.csv or .json)
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-[#008060] rounded-2xl p-6 text-center bg-slate-50/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept=".csv, .json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="space-y-2 flex flex-col items-center">
              <div className="p-3 bg-emerald-100 text-[#008060] rounded-full group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-extrabold text-slate-800">
                Click or Drag Shopify Products CSV / JSON file here
              </div>
              <p className="text-[10px] text-slate-500 max-w-sm">
                Supports standard Shopify Admin product CSV exports (including Title, Body HTML, Variant Price, Image Src).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Products Preview List */}
      {parsedProducts.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/60 p-3.5 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#008060]" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Ready to Import ({parsedProducts.filter((p) => p.selected).length} / {parsedProducts.length} selected)
                </h4>
                <p className="text-[11px] text-slate-600">Review discovered items before publishing to your store.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all"
              >
                {parsedProducts.every((p) => p.selected) ? 'Deselect All' : 'Select All'}
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={executeBatchImport}
                className="px-4 py-1.5 bg-gradient-to-r from-[#008060] to-emerald-700 hover:from-[#006048] hover:to-emerald-800 text-white rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Publish {parsedProducts.filter((p) => p.selected).length} Items Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Product Cards Table */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
            {parsedProducts.map((p, idx) => (
              <div
                key={idx}
                className={`pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                  p.selected ? 'bg-white shadow-2xs border border-emerald-100' : 'opacity-60 bg-slate-100/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={p.selected}
                    onChange={() => toggleSelectProduct(idx)}
                    className="w-4 h-4 text-[#008060] rounded border-slate-300 focus:ring-[#008060] cursor-pointer"
                  />
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-extrabold text-slate-800 truncate">{p.title}</h5>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-extrabold text-[#008060]">{formatPKR(p.price)}</span>
                      {p.originalPrice && (
                        <span className="line-through text-slate-400">{formatPKR(p.originalPrice)}</span>
                      )}
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded capitalize font-bold">
                        {p.category}
                      </span>
                      {p.vendor && <span className="text-slate-400 truncate">Vendor: {p.vendor}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-700 shrink-0">
                  Stock: {p.stock}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
