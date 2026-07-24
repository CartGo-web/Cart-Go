/**
 * Utility functions for generating and sharing store and product links
 */

export function getShareableProductUrl(productId: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('product', productId);
  return url.toString();
}

export function getShareableStoreUrl(sellerId: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('store', sellerId);
  return url.toString();
}

export async function shareUrl(data: { title: string; text?: string; url: string }): Promise<'shared' | 'copied' | 'failed'> {
  // If Web Share API is available and user is on mobile/supported browser
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text || data.title,
        url: data.url,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'failed';
      }
      // Fallback to clipboard if share fails
    }
  }

  // Fallback to Clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(data.url);
      return 'copied';
    } else {
      // Legacy fallback
      const textArea = document.createElement('textarea');
      textArea.value = data.url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return 'copied';
    }
  } catch (err) {
    console.error('Failed to copy URL:', err);
    return 'failed';
  }
}
