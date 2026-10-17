'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Save, Plus, Trash2, UtensilsCrossed, Move, Type, 
  Undo2, Calendar, Star, Check, Search, Sparkles, Filter, 
  ArrowRight, RefreshCw, Eye, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { FloatingInput } from '@/components/ui/floating-input';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto:low,f_auto/');
  }
  return url;
};

export default function DailyMenuPage() {
  const [activeTab, setActiveTab] = useState<'selector' | 'poster'>('selector');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // All menu items & active specials
  const [allItems, setAllItems] = useState<any[]>([]);
  const [menuList, setMenuList] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");

  // Search & Filters for Selector tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlySpecialsFilter, setOnlySpecialsFilter] = useState(false);

  // Poster Editor States
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

  // Fetch all items and daily specials
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/daily-special');
      const data = await res.json();
      
      if (data.success) {
        const fetchedAll = data.allItems || [];
        const fetchedSpecials = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
        
        setAllItems(fetchedAll);
        setMenuList(fetchedSpecials);

        if (fetchedSpecials.length > 0 && !selectedMenuId) {
          loadMenuIntoCanvas(fetchedSpecials[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch daily specials:", e);
      toast.error("Failed to load daily menus");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Toggle Daily Special Status
  const handleToggleSpecial = async (item: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus = !item.isDailySpecial;
    setTogglingId(item._id);

    // Optimistic Update
    setAllItems(prev => prev.map(i => i._id === item._id ? { ...i, isDailySpecial: newStatus } : i));
    if (newStatus) {
      setMenuList(prev => [...prev, { ...item, isDailySpecial: true }]);
    } else {
      setMenuList(prev => prev.filter(i => (i._id || i.id) !== item._id));
      if (selectedMenuId === item._id && menuList.length > 1) {
        const remaining = menuList.filter(i => (i._id || i.id) !== item._id);
        if (remaining.length > 0) loadMenuIntoCanvas(remaining[0]);
      }
    }

    try {
      const res = await fetch('/api/admin/daily-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-special',
          id: item._id,
          isDailySpecial: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newStatus ? `⭐ "${item.name}" added to Today's Special!` : `Removed "${item.name}" from Today's Special`);
      } else {
        throw new Error(data.error || "Failed to update");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle item");
      // Revert on error
      fetchData();
    } finally {
      setTogglingId(null);
    }
  };

  // Function to load a specific menu's data into the canvas editor
  const loadMenuIntoCanvas = (menu: any) => {
    setSelectedMenuId(menu._id || menu.id);
    setName(menu.name || "");
    setPrice(menu.price ? String(menu.price) : "");
    setInStock(menu.inStock ?? true);
    
    if (menu.description) {
      const extractedItems = menu.description.split('\n')
        .map((line: string) => line.replace(/^[•\-*\s]+/, '').trim())
        .filter((line: string) => line.length > 0);
      setItems(extractedItems.length > 0 ? extractedItems : ["Rice", "Dal", "Sabji"]);
    } else {
      setItems(["Rice", "Dal", "Sabji"]);
    }
    
    setItemsPos({ x: 250, y: 320 });
    setItemScale(1);
    setHistory([]);
  };

  const handleMenuChange = (id: string) => {
    const selected = menuList.find(m => (m._id || m.id) === id) || allItems.find(m => m._id === id);
    if (selected) {
      loadMenuIntoCanvas(selected);
    }
  };

  const openInCanvas = (item: any) => {
    loadMenuIntoCanvas(item);
    setActiveTab('poster');
    toast.info(`Editing poster for "${item.name}"`);
  };

  // Canvas Drawing
  useEffect(() => {
    if (previewCanvasRef.current && !isLoading && activeTab === 'poster') {
      drawOnCanvas(previewCanvasRef.current, itemsPos, itemScale, manualDate);
    }
  }, [name, price, items, isLoading, itemsPos, itemScale, manualDate, activeTab]);

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
    } catch (e) {
      console.error("Drawing error", e);
    }
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
    if (!selectedMenuId) { toast.error("Please select a menu to edit."); return; }
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
          id: selectedMenuId,
          name,
          price,
          items,
          imageUrl: optimizedImageUrl,
          ImageURLs: [originalImageUrl, optimizedImageUrl],
          inStock,
          isDailySpecial: true,
          notifyUsers
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      
      toast.success("🎉 Daily special published successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save daily menu");
    } finally {
      setIsSaving(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(item => {
      if (item.category && item.category.trim()) set.add(item.category.trim());
    });
    return Array.from(set).sort();
  }, [allItems]);

  // Filtered menu items for the Selector tab
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesSpecialsOnly = !onlySpecialsFilter || item.isDailySpecial;

      return matchesSearch && matchesCategory && matchesSpecialsOnly;
    });
  }, [allItems, searchQuery, selectedCategory, onlySpecialsFilter]);

  const activeSpecialsCount = allItems.filter(i => i.isDailySpecial).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-primary/10 to-orange-500/10 p-6 rounded-2xl border border-primary/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline flex items-center gap-2">
                Today's Special Manager
                <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Select which menus display in Today's Special on the mobile app & customize daily posters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3.5 py-1.5 text-sm bg-white font-bold border-amber-300 shadow-sm text-amber-900 flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span>{activeSpecialsCount} Active Today</span>
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchData} 
            disabled={isLoading}
            className="rounded-full bg-white shadow-sm border hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md h-12 p-1 bg-muted/60 rounded-xl border">
          <TabsTrigger value="selector" className="rounded-lg font-bold flex items-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Star className="h-4 w-4 text-amber-500" />
            Select Menus ({activeSpecialsCount})
          </TabsTrigger>
          <TabsTrigger value="poster" className="rounded-lg font-bold flex items-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Type className="h-4 w-4 text-primary" />
            Poster & Details
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SELECTOR */}
        <TabsContent value="selector" className="space-y-6 mt-6">
          {/* Controls Bar: Search & Category Filter */}
          <Card className="border shadow-sm">
            <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dishes or thalis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background rounded-xl border-muted-foreground/20"
                />
              </div>

              {/* Category & Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 w-40 rounded-xl bg-background font-medium">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={onlySpecialsFilter ? "default" : "outline"}
                  onClick={() => setOnlySpecialsFilter(!onlySpecialsFilter)}
                  className="h-11 rounded-xl font-medium gap-1.5 transition-all shadow-sm"
                >
                  <Star className={`h-4 w-4 ${onlySpecialsFilter ? 'fill-white' : 'text-amber-500'}`} />
                  {onlySpecialsFilter ? "Showing Specials" : "Show Only Specials"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Notice Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <span className="font-bold">Instant App Sync:</span> Toggle any dish ON to display it under "Today's Special" on the mobile app home screen. Toggling OFF removes it from Today's Special while keeping it available in the standard menu.
            </div>
          </div>

          {/* Dishes Grid */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Loading menu items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-muted/20 rounded-2xl border border-dashed">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-700">No dishes found</p>
              <p className="text-sm text-muted-foreground mt-1">Try clearing search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isSpecial = item.isDailySpecial;
                const isToggling = togglingId === item._id;

                return (
                  <Card 
                    key={item._id} 
                    className={`transition-all border-2 rounded-2xl overflow-hidden relative shadow-sm ${
                      isSpecial 
                        ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20 shadow-amber-100' 
                        : 'border-border/60 bg-white hover:border-gray-300'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-[11px] font-semibold bg-gray-100 text-gray-700">
                                {item.category || 'General'}
                              </Badge>
                              {isSpecial && (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm">
                                  <Star className="h-3 w-3 fill-white" />
                                  Today's Special
                                </Badge>
                              )}
                              {!item.inStock && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Out of Stock
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug pt-1">
                              {item.name}
                            </h3>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-primary font-headline">
                              ₹{item.price}
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                            {item.description.replace(/^[•\-*\s]+/gm, '').replace(/\n/g, ', ')}
                          </p>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t flex items-center justify-between gap-2">
                        {/* Toggle Special Button */}
                        <Button
                          size="sm"
                          variant={isSpecial ? "destructive" : "default"}
                          disabled={isToggling}
                          onClick={(e) => handleToggleSpecial(item, e)}
                          className={`rounded-xl font-bold text-xs h-9 px-3 flex-1 gap-1.5 transition-all shadow-sm ${
                            isSpecial 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200' 
                              : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSpecial ? (
                            <>
                              <Star className="h-3.5 w-3.5 fill-white" />
                              Remove from Special
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Add to Today's Special
                            </>
                          )}
                        </Button>

                        {/* Edit in Poster Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInCanvas(item)}
                          className="rounded-xl h-9 px-3 text-xs font-semibold gap-1 hover:bg-muted shrink-0"
                          title="Edit Poster & Items"
                        >
                          <Type className="h-3.5 w-3.5 text-primary" />
                          <span>Poster</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: POSTER & DETAILS */}
        <TabsContent value="poster" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm">
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Active Menu Being Edited</Label>
              <h2 className="text-lg font-bold text-gray-900">{name || "Select a Menu"}</h2>
            </div>

            {/* Menu Dropdown Selector */}
            {menuList.length > 0 && (
              <div className="w-full sm:w-72">
                <Select value={selectedMenuId} onValueChange={handleMenuChange}>
                  <SelectTrigger className="w-full border-primary/20 bg-primary/5 font-semibold rounded-xl">
                    <SelectValue placeholder="Choose Menu to Edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuList.map(menu => (
                      <SelectItem key={menu._id || menu.id} value={menu._id || menu.id}>
                        ⭐ {menu.name} (₹{menu.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Side: Controls */}
            <Card className="border-0 shadow-md w-full rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-6">
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput label="Menu Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <FloatingInput label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                  
                  <div className="relative sm:col-span-2">
                    <Label className="text-xs text-muted-foreground ml-1 mb-1 flex items-center gap-1 font-semibold">
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
                  <Label className="font-semibold text-gray-800">Menu Items (Thali Bullets)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newItem} 
                      onChange={(e) => setNewItem(e.target.value)} 
                      placeholder="Add item (e.g. Basmati Rice, Cholar Dal...)" 
                      className="bg-background rounded-xl" 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <Button onClick={handleAddItem} size="icon" className="rounded-xl shrink-0"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full text-sm shadow-sm font-medium">
                        <span>{item}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-muted-foreground hover:text-red-500 ml-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3.5 rounded-xl bg-white shadow-sm">
                    <div>
                      <Label className="font-bold">In Stock</Label>
                      <p className="text-xs text-muted-foreground">Available for customers to order</p>
                    </div>
                    <Switch checked={inStock} onCheckedChange={setInStock} />
                  </div>

                  <div className="flex items-center justify-between border p-3.5 rounded-xl bg-primary/5 border-primary/20 shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-primary font-bold">Notify Users</Label>
                      <p className="text-xs text-muted-foreground">Send push notification to all users</p>
                    </div>
                    <Switch checked={notifyUsers} onCheckedChange={setNotifyUsers} />
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full h-13 text-base font-bold shadow-lg shadow-primary/20 rounded-xl" 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} 
                  Publish & Update Today's Special
                </Button>
              </CardContent>
            </Card>

            {/* Right Side: Interactive Poster */}
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="w-full max-w-[450px] space-y-4">
                <Label className="text-base font-bold text-gray-800 block text-center">
                  Live Poster Preview (Drag items text to move)
                </Label>
                
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-muted cursor-move">
                  {/* UNDO BUTTON */}
                  <div className="absolute top-3 left-3 z-10">
                    <Button 
                      type="button"
                      variant="secondary" 
                      onClick={(e) => { e.stopPropagation(); handleUndo(); }} 
                      disabled={history.length === 0}
                      className="rounded-full shadow-lg gap-2 px-4 bg-white/95 hover:bg-white text-black font-semibold border border-gray-200 pointer-events-auto transition-transform active:scale-95 text-xs h-9"
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Undo
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
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <Type className="h-4 w-4 text-primary" /> Menu Text Size
                    </Label>
                    <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-md">
                      {Math.round(itemScale * 100)}%
                    </span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
