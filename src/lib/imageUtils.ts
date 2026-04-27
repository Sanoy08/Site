// src/lib/imageUtils.ts

const PROXY_DOMAIN = 'https://images.bumbaskitchen.app';

export function optimizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Jodi url-e 'res.cloudinary.com' thake, sudhu path-tuku nebo
  if (url.includes('res.cloudinary.com')) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Cloudinary path: /cloud_name/image/upload/v1234/folder/id.jpg
      // Amader dorkar sudhu 'folder/id.jpg' (last parts)
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Version part (v177...) skip korar jonno logic
        const cleanPath = pathParts.slice(uploadIndex + 2).join('/'); 
        return `${PROXY_DOMAIN}/${cleanPath}`;
      }
    } catch (e) {
      return url;
    }
  }

  return url;
}