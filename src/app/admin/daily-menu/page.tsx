// src/app/admin/daily-menu/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus, Trash2, UtensilsCrossed, Move, Type, Undo2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingInput } from '@/components/ui/floating-input';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // ★ Added Select Imports

const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto:low,f_auto/');
  }
  return url;
};

const CONSTANT_THALI_IMAGE = "https://res.cloudinary.com/dk1acdtja/image/upload/v1777168123/IMG_20260426_071347_fltctm.jpg";

export default function DailyMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // ★ New States for Multiple Menus
  const [menuList, setMenuList] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");

  const [name, setName] = useState("Special Veg Thali");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(true);
  
  const [items, setItems] = useState<string[]>(["Rice", "Dal"]);
  const [newItem, setNewItem] = useState("");

  const [manualDate, setManualDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [itemsPos, setItemsPos] = useState({ x: 250, y: 320 });
  const [itemScale, setItemScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [history, setHistory] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const saveToHistory = () => {
    const currentState = {
      items: [...items],
      itemsPos: { ...itemsPos },
      itemScale: itemScale,
      manualDate: manualDate
    };
    setHistory(prev => [...prev.slice(-19), currentState]); 
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast.info("No more steps to undo");
      return;
    }
    const lastState = history[history.length - 1];
    setItems(lastState.items);
    setItemsPos(lastState.itemsPos);
    setItemScale(lastState.itemScale);
    setManualDate(lastState.manualDate);
    setHistory(prev => prev.slice(0, -1));
    toast.success("Action undone");
  };

  // ★ Fetch all daily special menus
  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/daily-special');
            const data = await res.json();
            
            if (data.success && data.data) {
                // Handle both single object (old API) and array (new API)
                const fetchedMenus = Array.isArray(data.data) ? data.data : [data.data];
                setMenuList(fetchedMenus);

                if (fetchedMenus.length > 0) {
                    loadMenuIntoCanvas(fetchedMenus[0]); // Load the first menu by default
                }
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  // ★ Function to load a specific menu's data into the UI
  const loadMenuIntoCanvas = (menu: any) => {
      setSelectedMenuId(menu._id || menu.id); // Assuming backend sends _id or id
      setName(menu.name || "");
      setPrice(menu.price || "");
      setInStock(menu.inStock ?? true);
      
      if (menu.description) {
          const extractedItems = menu.description.split('\n')
              .map((line: string) => line.replace(/^•\s*/, '').trim())
              .filter((line: string) => line.length > 0);
          setItems(extractedItems);
      } else {
          setItems([]);
      }
      
      // Reset canvas positions and history when changing menu
      setItemsPos({ x: 250, y: 320 });
      setItemScale(1);
      setHistory([]);
  };

  // ★ Handle Dropdown Change
  const handleMenuChange = (id: string) => {
      const selected = menuList.find(m => (m._id || m.id) === id);
      if (selected) {
          loadMenuIntoCanvas(selected);
      }
  };

  useEffect(() => {
    if (previewCanvasRef.current && !isLoading) {
        drawOnCanvas(previewCanvasRef.current, itemsPos, itemScale, manualDate);
    }
  }, [name, price, items, isLoading, itemsPos, itemScale, manualDate]);

  const handleAddItem = () => {
      if (newItem.trim()) {
          saveToHistory();
          setItems([...items, newItem.trim()]);
          setNewItem("");
      }
  };

  const handleRemoveItem = (index: number) => {
      saveToHistory();
      setItems(items.filter((_, i) => i !== index));
  };

  const drawOnCanvas = async (canvas: HTMLCanvasElement, currentItemsPos: typeof itemsPos, currentScale: number, targetDate: string) => {
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
        await new Promise((resolve) => { bgImage.onload = resolve; bgImage.onerror = resolve; });

        if (bgImage.complete && bgImage.naturalHeight !== 0) {
            ctx.drawImage(bgImage, 0, 0, 500, 500);
        } else {
            ctx.fillStyle = "#FFF8E1";
            ctx.fillRect(0, 0, 500, 500);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const dateObj = new Date(targetDate);
        const dateText = format(dateObj, "dd/MM/yy");

        ctx.save();
        ctx.translate(330, 123); 
        ctx.rotate(-4.39 * Math.PI / 180); 
        ctx.fillStyle = "#00355b"; 
        ctx.font = "900 15px Montserrat, sans-serif"; 
        ctx.fillText(dateText, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.translate(79, 231);
        ctx.fillStyle = "#000000ff"; 
        ctx.font = "italic bold 32px sans-serif"; 
        ctx.fillText(`₹${price || '0'}`, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.translate(currentItemsPos.x, currentItemsPos.y); 
        ctx.scale(currentScale, currentScale);
        ctx.fillStyle = "#ffffffff"; 
        ctx.font = "500 24px 'Anek Bangla', sans-serif"; 

        const lineHeight = 30;
        let currentY = -(items.length * lineHeight / 2) + (lineHeight / 2);
        items.forEach(item => {
            ctx.fillText(item, 0, currentY); 
            currentY += lineHeight;
        });
        ctx.restore();
      } catch (e) { console.error("Drawing error", e); }
  };

  const getMousePos = (e: React.PointerEvent) => {
      const rect = previewCanvasRef.current!.getBoundingClientRect();
      const scaleX = 500 / rect.width;
      const scaleY = 500 / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (!previewCanvasRef.current) return;
      const mouse = getMousePos(e);
      const itemsHeight = items.length * 30;
      const boxW = 300 * itemScale;
      const boxH = (itemsHeight + 40) * itemScale;
      const boxX = itemsPos.x - boxW / 2;
      const boxY = itemsPos.y - boxH / 2;

      if (mouse.x > boxX && mouse.x < boxX + boxW && mouse.y > boxY && mouse.y < boxY + boxH) {
          saveToHistory(); 
          setIsDragging(true);
          dragOffset.current = { x: itemsPos.x - mouse.x, y: itemsPos.y - mouse.y };
      } 
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      const mouse = getMousePos(e);
      setItemsPos({ x: mouse.x + dragOffset.current.x, y: mouse.y + dragOffset.current.y });
  };

  const handlePointerUp = () => { setIsDragging(false); };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    if (!selectedMenuId) { toast.error("Please select a menu to edit."); return; } // ★ Check if menu is selected
    if (!price) { toast.error("Please enter a price."); return; }
    
    setIsSaving(true);
    try {
        await drawOnCanvas(canvasRef.current, itemsPos, itemScale, manualDate);
        const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/webp', 0.9));
        if (!blob) throw new Error("Image generation failed");
        
        const formData = new FormData();
        formData.append('file', blob);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhhfisazd";
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "bumbas-kitchen-uploads";
        formData.append('upload_preset', uploadPreset);
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadData.secure_url) throw new Error("Upload failed");
        
        const originalImageUrl = uploadData.secure_url;
        const optimizedImageUrl = getOptimizedNotificationImage(originalImageUrl);
        
        const res = await fetch('/api/admin/daily-special', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedMenuId, // ★ ID পাঠানো হচ্ছে ব্যাকএন্ডে
                name, price, items, 
                ImageURLs: [CONSTANT_THALI_IMAGE, optimizedImageUrl],
                imageUrl: optimizedImageUrl, 
                inStock, notifyUsers
            })
        });
        
        if (res.ok) { toast.success("Menu Updated & Poster Published! 🚀"); } else { toast.error("Failed to update"); }
    } catch (e) { toast.error("Error saving menu"); } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="w-full pb-10 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full text-primary"><UtensilsCrossed className="h-6 w-6" /></div>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Daily Menu Manager</h1>
                    <p className="text-sm text-muted-foreground">Select, Reposition & Scale your menu live.</p>
                </div>
            </div>

            {/* ★ Dropdown to select which Daily Menu to edit */}
            {menuList.length > 0 && (
                <div className="w-full sm:w-64">
                    <Select value={selectedMenuId} onValueChange={handleMenuChange}>
                        <SelectTrigger className="w-full border-primary/20 bg-primary/5 font-semibold">
                            <SelectValue placeholder="Select Daily Menu" />
                        </SelectTrigger>
                        <SelectContent>
                            {menuList.map(menu => (
                                <SelectItem key={menu._id || menu.id} value={menu._id || menu.id}>
                                    {menu.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Side: Controls */}
            <Card className="border-0 shadow-md w-full">
                <CardContent className="p-4 sm:p-6 space-y-6">
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingInput label="Menu Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <FloatingInput label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                        
                        <div className="relative sm:col-span-2">
                            <Label className="text-xs text-muted-foreground ml-1 mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Menu Date
                            </Label>
                            <Input 
                                type="date" 
                                value={manualDate} 
                                onChange={(e) => { saveToHistory(); setManualDate(e.target.value); }} 
                                className="h-12 rounded-xl bg-muted/20 border-primary/10 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                        <Label>Menu Items</Label>
                        <div className="flex gap-2">
                            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add item..." className="bg-background" onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}/>
                            <Button onClick={handleAddItem} size="icon"><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-background border px-3 py-1 rounded-full text-sm shadow-sm">
                                    <span>{item}</span>
                                    <button onClick={() => handleRemoveItem(idx)} className="text-muted-foreground hover:text-red-500 ml-1"><Trash2 className="h-3 w-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border p-3 rounded-xl"><Label>In Stock</Label><Switch checked={inStock} onCheckedChange={setInStock} /></div>
                        <div className="flex items-center justify-between border p-3 rounded-xl bg-primary/5 border-primary/20">
                            <div className="space-y-0.5"><Label className="text-primary font-semibold">Notify Users</Label><p className="text-xs text-muted-foreground">Send push notification</p></div>
                            <Switch checked={notifyUsers} onCheckedChange={setNotifyUsers} />
                        </div>
                    </div>

                    <Button onClick={handleSave} className="w-full h-12 text-lg shadow-lg shadow-primary/20" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Publish Menu
                    </Button>
                </CardContent>
            </Card>

            {/* Right Side: Interactive Poster */}
            <div className="flex flex-col items-center space-y-4 w-full">
                <div className="w-full max-w-[450px] space-y-4">
                    <Label className="text-lg font-semibold text-muted-foreground block text-center">Interactive Poster Preview</Label>
                    
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-muted cursor-move">
                        
                        {/* UNDO BUTTON */}
                        <div className="absolute top-3 left-3 z-10">
                            <Button 
                                type="button"
                                variant="secondary" 
                                onClick={(e) => { e.stopPropagation(); handleUndo(); }} 
                                disabled={history.length === 0}
                                className="rounded-full shadow-lg gap-2 px-4 bg-white/95 hover:bg-white text-black font-semibold border border-gray-200 pointer-events-auto transition-transform active:scale-95"
                            >
                                <Undo2 className="h-4 w-4" /> Undo
                            </Button>
                        </div>

                        {/* Move Icon */}
                        <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full shadow-lg opacity-80 pointer-events-none z-10">
                            <Move className="h-4 w-4" />
                        </div>

                        <canvas 
                            ref={previewCanvasRef} 
                            className="w-full h-full object-contain touch-none"
                            style={{ touchAction: 'none' }} 
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                        />
                    </div>
                    
                    {/* Scale Slider Control */}
                    <div className="w-full bg-white p-4 rounded-xl border shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2 text-sm"><Type className="h-4 w-4 text-primary" /> Menu Text Size</Label>
                            <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">{Math.round(itemScale * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0.5" max="2" step="0.05" value={itemScale} 
                            onMouseDown={saveToHistory}
                            onTouchStart={saveToHistory}
                            onChange={(e) => setItemScale(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
