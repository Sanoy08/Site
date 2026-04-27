// src/lib/imageUtils.ts

const PROXY_DOMAIN = 'https://images.bumbaskitchen.app';

export function optimizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';

  // ১. jodi URL-ti Cloudinary-r hoy
  if (url.includes('res.cloudinary.com')) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Cloudinary path example: /cloud_name/image/upload/v1777.../general/xyz.jpg
      const uploadIndex = pathParts.indexOf('upload');
      
      if (uploadIndex !== -1) {
        let startIndex = uploadIndex + 1;
        
        // jodi kono purono transformation thake (e.g. w_500), seta skip korbo
        if (pathParts[startIndex] && (pathParts[startIndex].includes('w_') || pathParts[startIndex].includes('q_'))) {
            startIndex++;
        }

        // version tag (v177...) skip korbo
        if (pathParts[startIndex] && pathParts[startIndex].startsWith('v') && !isNaN(parseInt(pathParts[startIndex].substring(1)))) {
          startIndex++;
        }

        // baki ongsho tuku nebo (jemon: general/abc.jpg ba dish/xyz.jpg)
        const cleanPath = pathParts.slice(startIndex).join('/'); 
        
        // chotto URL return korbo
        return `${PROXY_DOMAIN}/${cleanPath}`;
      }
    } catch (e) {
      // Error hole original URL tai return korbe
      return url;
    }
  }

  // Jodi URL-ti age thekei PROXY_DOMAIN er hoy, tobe seta sorasori return korbo
  return url;
}