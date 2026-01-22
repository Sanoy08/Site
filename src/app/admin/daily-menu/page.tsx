// src/app/admin/daily-menu/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingInput } from '@/components/ui/floating-input';

// ★★★ HELPER: Cloudinary Image Optimizer for Push Notifications ★★★
// এটি নিশ্চিত করে যে ছবির সাইজ 500x500px এবং 100KB এর নিচে থাকে
const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  
  if (url.includes('cloudinary.com')) {
    // w_500, h_500: Exact dimensions
    // c_fill: Crop to fill
    // q_auto:low: Aggressive compression for small file size
    // f_auto: Efficient format (webp/avif)
    return url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto:low,f_auto/');
  }
  
  return url;
};

export default function DailyMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("Special Veg Thali");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  
  // ★ Default: Always ON
  const [notifyUsers, setNotifyUsers] = useState(true);
  
  const [items, setItems] = useState<string[]>(["Rice", "Dal"]);
  const [newItem, setNewItem] = useState("");

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        // ★★★ Fix: Remove Token Check
        try {
            // ★★★ Fix: Remove Header
            const res = await fetch('/api/admin/daily-special');
            const data = await res.json();
            if (data.success && data.data) {
                const d = data.data;
                setName(d.name);
                setPrice(d.price);
                setInStock(d.inStock);
                
                if (d.description) {
                    const extractedItems = d.description.split('\n')
                        .map((line: string) => line.replace(/^•\s*/, '').trim())
                        .filter((line: string) => line.length > 0);
                    setItems(extractedItems);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  // Live Preview Update
  useEffect(() => {
    if (previewCanvasRef.current && !isLoading) {
        drawOnCanvas(previewCanvasRef.current);
    }
  }, [name, price, items, isLoading]);

  const handleAddItem = () => {
      if (newItem.trim()) {
          setItems([...items, newItem.trim()]);
          setNewItem("");
      }
  };

  const handleRemoveItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  // Drawing Function
  const drawOnCanvas = async (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const SCALE_FACTOR = 3;
      canvas.width = 500 * SCALE_FACTOR;
      canvas.height = 500 * SCALE_FACTOR;
      
      ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

      try {
        await document.fonts.ready;

        const bgImage = new Image();
        bgImage.src = '/daily.jpg'; 
        bgImage.crossOrigin = "anonymous";

        await new Promise((resolve) => {
            bgImage.onload = resolve;
            bgImage.onerror = resolve; 
        });

        if (bgImage.complete && bgImage.naturalHeight !== 0) {
            ctx.drawImage(bgImage, 0, 0, 500, 500);
        } else {
            ctx.fillStyle = "#FFF8E1";
            ctx.fillRect(0, 0, 500, 500);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Date
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const dateText = `${day}/${month}/${year}`;

        ctx.save();
        ctx.translate(330, 123); 
        ctx.rotate(-4.39 * Math.PI / 180); 
        ctx.fillStyle = "#00355b"; 
        ctx.font = "900 15px Montserrat, sans-serif"; 
        ctx.fillText(dateText, 0, 0);
        ctx.restore();

        // Items
        ctx.save();
        ctx.translate(250, 320); 
        ctx.fillStyle = "#ffffffff"; 
        ctx.font = "500 24px 'Anek Bangla', sans-serif"; 

        const lineHeight = 30;
        let currentY = -(items.length * lineHeight / 2) + (lineHeight / 2);
        
        const displayItems = items.slice(0, 6);
        displayItems.forEach(item => {
            ctx.fillText(item, 0, currentY); 
            currentY += lineHeight;
        });
        ctx.restore();

        // Price
        ctx.save();
        ctx.translate(79, 231);
        ctx.fillStyle = "#000000ff"; 
        ctx.font = "italic bold 32px sans-serif"; 
        ctx.fillText(`₹${price || '0'}`, 0, 0);
        ctx.restore();

      } catch (e) {
          console.error("Drawing error", e);
      }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    if (!price) {
        toast.error("Please enter a price.");
        return;
    }

    setIsSaving(true);
    // ★★★ Fix: Remove Token Logic

    try {
        // 1. Generate Canvas Image
        await drawOnCanvas(canvasRef.current);
        
        // 2. Create Blob
        const blob = await new Promise<Blob | null>(resolve => 
            canvasRef.current?.toBlob(resolve, 'image/webp', 0.9)
        );
        if (!blob) throw new Error("Image generation failed");

        // 3. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', blob);
        
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhhfisazd";
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "bumbas-kitchen-uploads";
        formData.append('upload_preset', uploadPreset);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.secure_url) throw new Error("Upload failed");

        const originalImageUrl = uploadData.secure_url;

        // ★★★ 4. Optimize Image URL for Notification (500x500, <100kb) ★★★
        const optimizedImageUrl = getOptimizedNotificationImage(originalImageUrl);

        // 5. Update Database with Optimized Image URL
        // ★★★ Fix: Remove Authorization Header
        const res = await fetch('/api/admin/daily-special', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                price,
                items, 
                imageUrl: optimizedImageUrl, // এখানে অপ্টিমাইজড লিংক পাঠানো হচ্ছে
                inStock,
                notifyUsers
            })
        });

        const data = await res.json();
        if (res.ok) {
            toast.success("Menu Updated & Poster Published! 🚀");
            // notifyUsers state is kept as TRUE
        } else {
            toast.error(data.error || "Failed to update");
        }

    } catch (e) {
        console.error(e);
        toast.error("Error saving menu");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold font-headline">Daily Menu Manager</h1>
                <p className="text-sm text-muted-foreground">Create & publish today's special menu.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side: Controls */}
            <div className="space-y-6">
                <Card className="border-0 shadow-md h-full">
                    <CardContent className="p-6 space-y-6">
                        
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="grid grid-cols-1 gap-4">
                            <FloatingInput label="Menu Name" value={name} onChange={(e) => setName(e.target.value)} />
                            <FloatingInput label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>

                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                            <Label>Menu Items</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={newItem} 
                                    onChange={(e) => setNewItem(e.target.value)} 
                                    placeholder="Add item (e.g. Rice)" 
                                    className="bg-background"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                />
                                <Button onClick={handleAddItem} size="icon"><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-background border px-3 py-1 rounded-full text-sm shadow-sm animate-in zoom-in">
                                        <span>{item}</span>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-muted-foreground hover:text-red-500 ml-1"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border p-3 rounded-xl">
                                <div className="space-y-0.5"><Label>In Stock</Label></div>
                                <Switch checked={inStock} onCheckedChange={setInStock} />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-xl bg-primary/5 border-primary/20">
                                <div className="space-y-0.5">
                                    <Label className="text-primary font-semibold">Notify Users</Label>
                                    <p className="text-xs text-muted-foreground">Send push notification to all users</p>
                                </div>
                                <Switch checked={notifyUsers} onCheckedChange={setNotifyUsers} />
                            </div>
                        </div>

                        <Button onClick={handleSave} className="w-full h-12 text-lg shadow-lg shadow-primary/20" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            Publish Menu
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Side: Live Preview Canvas */}
            <div className="flex flex-col items-center justify-start space-y-4">
                <Label className="text-lg font-semibold text-muted-foreground">Live Poster Preview</Label>
                <div className="relative w-full max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-muted">
                    <canvas 
                        ref={previewCanvasRef} 
                        className="w-full h-full object-contain"
                    />
                </div>
                <p className="text-xs text-muted-foreground text-center italic">
                    * This image updates automatically as you type.
                </p>
            </div>
        </div>
    </div>
  );
}