// src/lib/compress-image.ts

export const compressImage = async (file: File, targetSizeKB: number = 100): Promise<File> => {
  // যদি ফাইলটি ইতিমধ্যে ছোট হয়, তাহলে ফেরত দিন
  if (file.size / 1024 <= targetSizeKB) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // ১. রেজোলিউশন কমানো (ম্যাক্সিমাম ১০২৪px রাখা ভালো নোটিফিকেশনের জন্য)
        const MAX_DIMENSION = 1024; 
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // ২. কোয়ালিটি কমিয়ে সাইজ ১০০ KB এর নিচে আনা
        let quality = 0.9; // শুরু ৯০% কোয়ালিটি দিয়ে
        
        const tryCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Compression failed"));
                return;
              }

              // সাইজ চেক (KB তে)
              const currentSizeKB = blob.size / 1024;
              
              if (currentSizeKB <= targetSizeKB || quality <= 0.1) {
                // টার্গেট সাইজে পৌঁছেছে অথবা কোয়ালিটি একেবারে শেষে
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`Image compressed: ${(file.size/1024).toFixed(2)}KB -> ${currentSizeKB.toFixed(2)}KB`);
                resolve(compressedFile);
              } else {
                // সাইজ এখনো বেশি, কোয়ালিটি আরও কমানো হচ্ছে
                quality -= 0.1;
                tryCompression(); // আবার চেষ্টা করুন
              }
            },
            'image/jpeg', // JPEG ফরম্যাট কম্প্রেসনের জন্য সেরা
            quality
          );
        };

        tryCompression();
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};