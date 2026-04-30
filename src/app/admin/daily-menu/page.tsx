// src/app/admin/daily-menu/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus, Trash2, UtensilsCrossed, Move } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingInput } from '@/components/ui/floating-input';

// ★★★ HELPER: Cloudinary Image Optimizer for Push Notifications ★★★
const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto:low,f_auto/');
  }
  return url;
};

// ★ কনস্ট্যান্ট ইমেজের লিংক (আসল থালির ছবি)
const CONSTANT_THALI_IMAGE = "https://res.cloudinary.com/dk1acdtja/image/upload/v1777168123/IMG_20260426_071347_fltctm.jpg";

export default function DailyMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("Special Veg Thali");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(true);
  
  const [items, setItems] = useState<string[]>(["Rice", "Dal"]);
  const [newItem, setNewItem] = useState("");

  // ★★★ DRAG & DROP STATES ★★★
  // Element gulor by default position
  const [positions, setPositions] = useState({
      date: { x: 330, y: 123 },
      price: { x: 79, y: 231 },
      items: { x: 250, y: 320 }
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
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

  // Live Preview Update (Positions change holeo update hobe)
  useEffect(() => {
    if (previewCanvasRef.current && !isLoading) {
        drawOnCanvas(previewCanvasRef.current, positions);
    }
  }, [name, price, items, isLoading, positions]);

  const handleAddItem = () => {
      if (newItem.trim()) {
          setItems([...items, newItem.trim()]);
          setNewItem("");
      }
  };

  const handleRemoveItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  // ★★★ Drawing Function - Now supports dynamic positions and UNLIMITED items ★★★
  const drawOnCanvas = async (canvas: HTMLCanvasElement, currentPos: typeof positions) => {
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
        const dateText = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;

        ctx.save();
        ctx.translate(currentPos.date.x, currentPos.date.y); 
        ctx.rotate(-4.39 * Math.PI / 180); 
        ctx.fillStyle = "#00355b"; 
        ctx.font = "900 15px Montserrat, sans-serif"; 
        ctx.fillText(dateText, 0, 0);
        ctx.restore();

        // Items (UNLIMITED ITEMS)
        ctx.save();
        ctx.translate(currentPos.items.x, currentPos.items.y); 
        ctx.fillStyle = "#ffffffff"; 
        ctx.font = "500 24px 'Anek Bangla', sans-serif"; 

        const lineHeight = 30;
        let currentY = -(items.length * lineHeight / 2) + (lineHeight / 2);
        
        // Ekhane theke slice() tule dewa hoyeche tai joto items thakbe shob ashbe
        items.forEach(item => {
            ctx.fillText(item, 0, currentY); 
            currentY += lineHeight;
        });
        ctx.restore();

        // Price
        ctx.save();
        ctx.translate(currentPos.price.x, currentPos.price.y);
        ctx.fillStyle = "#000000ff"; 
        ctx.font = "italic bold 32px sans-serif"; 
        ctx.fillText(`₹${price || '0'}`, 0, 0);
        ctx.restore();

      } catch (e) {
          console.error("Drawing error", e);
      }
  };

  // ★★★ DRAG & DROP LOGIC ★★★
  const getMousePos = (e: React.PointerEvent) => {
      const rect = previewCanvasRef.current!.getBoundingClientRect();
      const scaleX = 500 / rect.width;
      const scaleY = 500 / rect.height;
      return { 
          x: (e.clientX - rect.left) * scaleX, 
          y: (e.clientY - rect.top) * scaleY 
      };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (!previewCanvasRef.current) return;
      const mouse = getMousePos(e);

      const itemsHeight = items.length * 30;
      
      // Click detection boundaries (Generous area for easy mobile tapping)
      const boxes = {
          items: { x: positions.items.x - 150, y: positions.items.y - itemsHeight/2 - 20, w: 300, h: itemsHeight + 40 },
          price: { x: positions.price.x - 50, y: positions.price.y - 30, w: 100, h: 60 },
          date:  { x: positions.date.x - 60, y: positions.date.y - 30, w: 120, h: 60 }
      };

      if (mouse.x > boxes.items.x && mouse.x < boxes.items.x + boxes.items.w && mouse.y > boxes.items.y && mouse.y < boxes.items.y + boxes.items.h) {
          setDragging('items');
          dragOffset.current = { x: positions.items.x - mouse.x, y: positions.items.y - mouse.y };
      } else if (mouse.x > boxes.price.x && mouse.x < boxes.price.x + boxes.price.w && mouse.y > boxes.price.y && mouse.y < boxes.price.y + boxes.price.h) {
          setDragging('price');
          dragOffset.current = { x: positions.price.x - mouse.x, y: positions.price.y - mouse.y };
      } else if (mouse.x > boxes.date.x && mouse.x < boxes.date.x + boxes.date.w && mouse.y > boxes.date.y && mouse.y < boxes.date.y + boxes.date.h) {
          setDragging('date');
          dragOffset.current = { x: positions.date.x - mouse.x, y: positions.date.y - mouse.y };
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!dragging) return;
      const mouse = getMousePos(e);
      setPositions(prev => ({
          ...prev,
          [dragging]: { 
              x: mouse.x + dragOffset.current.x, 
              y: mouse.y + dragOffset.current.y 
          }
      }));
  };

  const handlePointerUp = () => {
      setDragging(null);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    if (!price) {
        toast.error("Please enter a price.");
        return;
    }

    setIsSaving(true);

    try {
        // ★ 1. Update the actual canvas with current dragged positions
        await drawOnCanvas(canvasRef.current, positions);
        
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
        const optimizedImageUrl = getOptimizedNotificationImage(originalImageUrl);

        const res = await fetch('/api/admin/daily-special', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, price, items, 
                ImageURLs: [CONSTANT_THALI_IMAGE, optimizedImageUrl],
                imageUrl: optimizedImageUrl, 
                inStock, notifyUsers
            })
        });

        const data = await res.json();
        if (res.ok) {
            toast.success("Menu Updated & Poster Published! 🚀");
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

            {/* Right Side: Live Preview Canvas with Drag & Drop */}
            <div className="flex flex-col items-center justify-start space-y-4">
                <Label className="text-lg font-semibold text-muted-foreground">Live Interactive Poster</Label>
                
                <div className="relative w-full max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-muted cursor-move group">
                    <canvas 
                        ref={previewCanvasRef} 
                        className="w-full h-full object-contain touch-none"
                        style={{ touchAction: 'none' }} 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full shadow-lg opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Move className="h-5 w-5" />
                    </div>
                </div>
                
                <p className="text-sm font-medium text-primary text-center px-4 bg-primary/10 py-2 rounded-lg">
                    ✨ Drag the <strong>Items</strong>, <strong>Price</strong> or <strong>Date</strong> directly on the poster to reposition them before publishing!
                </p>
            </div>
        </div>
    </div>
  );
}
