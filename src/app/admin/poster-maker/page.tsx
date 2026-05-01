'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, MousePointer2, PaintBucket, RotateCcw, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// Background Presets (1:1 Aspect Ratio Images)
const PRESETS = [
  'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1563379926898-05f45c51040c?q=80&w=1000&auto=format&fit=crop'
];

type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  shadow: boolean;
};

// ★ ডিফল্ট এলিমেন্ট (1:1 ক্যানভাসের জন্য পজিশন সেট করা)
const DEFAULT_ELEMENTS: TextElement[] = [
  { id: 'heading', text: 'বারের স্পেশাল লাঞ্চ/ডিনার', x: 20, y: 30, fontSize: 28, color: '#FFD700', shadow: true },
  { id: 'menu', text: 'চিকেন বিরিয়ানি কম্বো', x: 20, y: 80, fontSize: 36, color: '#FFFFFF', shadow: true },
  { id: 'price', text: 'মাত্র ১৯৯ টাকায়', x: 20, y: 150, fontSize: 42, color: '#4CAF50', shadow: true },
  { id: 'deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 20, y: 280, fontSize: 16, color: '#FF5252', shadow: false },
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(PRESETS[0]);
  const [elements, setElements] = useState<TextElement[]>(DEFAULT_ELEMENTS);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // Inline edit state
  const [devCoords, setDevCoords] = useState<{id: string, x: number, y: number} | null>(null);

  // ডিফল্ট স্ক্রলিং বন্ধ করা যাতে ড্র্যাগ করার সময় স্ক্রিন না নড়ে
  useEffect(() => {
    if (activeId || editingId) {
      document.body.style.overscrollBehaviorY = 'contain';
    } else {
      document.body.style.overscrollBehaviorY = 'auto';
    }
  }, [activeId, editingId]);

  const updateActiveElement = (updates: Partial<TextElement>) => {
    setElements(elements.map(el => el.id === activeId ? { ...el, ...updates } : el));
  };

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setActiveId(null); // সিলেকশন বর্ডার সরানোর জন্য
    setEditingId(null);
    
    toast.loading("Generating HD Square Poster...");
    try {
        const canvas = await html2canvas(posterRef.current, {
            scale: 3, 
            useCORS: true,
            backgroundColor: '#000'
        });
        
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = image;
        link.download = `BK-Offer-${new Date().getTime()}.jpg`;
        link.click();
        toast.success("Poster downloaded successfully!");
    } catch (e) {
        toast.error("Failed to generate poster");
    }
  };

  const activeElement = elements.find(e => e.id === activeId);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20 md:max-w-4xl md:pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 font-headline">
          <LayoutTemplate className="h-6 w-6 text-primary" /> Poster Maker
        </h1>
        <Button onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700 h-9 px-3 text-sm">
            <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        
        {/* ★ CANVAS SECTION (1:1 Ratio - Best for Mobile/Insta/FB) ★ */}
        <div className="w-full flex justify-center">
            <div 
              ref={posterRef}
              className="relative bg-black overflow-hidden shadow-2xl ring-2 ring-border/50 touch-none shrink-0"
              style={{
                width: '360px',
                height: '360px', // 1:1 Square Ratio
                backgroundImage: `url(${selectedBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onClick={(e) => {
                 if (e.target === posterRef.current) {
                     setActiveId(null);
                     setEditingId(null);
                 }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

              {elements.map((el) => {
                const isActive = activeId === el.id;
                const isEditing = editingId === el.id;

                return (
                  <motion.div
                    key={el.id}
                    // ★ Perfect Drag Logic
                    drag={!isEditing} // এডিট করার সময় ড্র্যাগ বন্ধ
                    dragMomentum={false}
                    initial={{ x: el.x, y: el.y }}
                    animate={{ x: el.x, y: el.y }}
                    transition={{ type: 'tween', duration: 0 }}
                    onPointerDown={() => {
                        if (!isEditing) setActiveId(el.id);
                    }}
                    onDoubleClick={() => {
                        setActiveId(el.id);
                        setEditingId(el.id);
                    }}
                    onDrag={(e, info) => {
                        setDevCoords({ id: el.id, x: el.x + info.offset.x, y: el.y + info.offset.y });
                    }}
                    onDragEnd={(e, info) => {
                        setElements(elements.map(item => 
                            item.id === el.id ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y } : item
                        ));
                    }}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      fontSize: `${el.fontSize}px`,
                      color: el.color,
                      fontWeight: 'bold',
                      textShadow: el.shadow ? '2px 3px 6px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.6)' : 'none',
                      cursor: isEditing ? 'text' : 'grab',
                      whiteSpace: 'nowrap',
                      touchAction: 'none' // Mobile scroll locking on drag
                    }}
                    className={`font-bengali p-1 ${isActive && !isEditing ? 'ring-2 ring-dashed ring-white/70 bg-white/10 rounded' : ''}`}
                  >
                    {isEditing ? (
                        // ★ INLINE EDITING INPUT ★
                        <input
                            autoFocus
                            value={el.text}
                            onChange={(e) => handleTextChange(el.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            className="bg-transparent border-none outline-none p-0 m-0 w-full text-center"
                            style={{ 
                                color: el.color, 
                                fontSize: `${el.fontSize}px`, 
                                textShadow: 'inherit',
                                width: `${el.text.length + 2}ch` // Auto width adjustment
                            }}
                        />
                    ) : (
                        <span className="select-none">{el.text}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
        </div>

        {/* ★ MOBILE CONTROLS SECTION ★ */}
        <div className="w-full space-y-4 max-w-[360px] md:max-w-xs shrink-0">
          
          <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded-lg font-medium">
             💡 <span className="text-primary font-bold">Double Tap</span> on any text to edit
          </div>

          <Card className="p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><LayoutTemplate className="h-4 w-4"/> Background</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {PRESETS.map((bg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedBg(bg)}
                  className={`h-14 w-14 rounded-lg cursor-pointer border-2 shrink-0 bg-muted ${selectedBg === bg ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent'}`}
                  style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
              ))}
            </div>
          </Card>

          <AnimatePresence mode="popLayout">
              {activeElement && (
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 20 }}
                  >
                      <Card className="p-4 shadow-sm border-primary/20 space-y-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <PaintBucket className="h-4 w-4 text-primary"/> Styling
                            </h3>
                            {/* Manual Edit Button for Mobile safety */}
                            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setEditingId(activeId)}>
                                <Edit3 className="h-3 w-3 mr-1" /> Edit Text
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-xs font-medium">Text Size</Label>
                                <span className="text-xs text-muted-foreground">{activeElement.fontSize}px</span>
                            </div>
                            <Slider 
                                value={[activeElement.fontSize]} 
                                min={12} max={80} step={1}
                                onValueChange={(val) => updateActiveElement({ fontSize: val[0] })}
                                className="my-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Color</Label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color" 
                                    value={activeElement.color}
                                    onChange={(e) => updateActiveElement({ color: e.target.value })}
                                    className="h-8 w-full rounded cursor-pointer border-0 p-0"
                                />
                                <Input 
                                    value={activeElement.color.toUpperCase()} 
                                    onChange={(e) => updateActiveElement({ color: e.target.value })}
                                    className="w-24 font-mono text-xs uppercase h-8"
                                />
                            </div>
                        </div>
                      </Card>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="pt-2">
             <Button variant="outline" onClick={() => {setElements(DEFAULT_ELEMENTS); setActiveId(null);}} className="w-full text-xs">
                <RotateCcw className="h-3 w-3 mr-2" /> Reset All Changes
             </Button>
          </div>

          {/* Dev Coords */}
          {devCoords && (
             <div className="bg-slate-900 rounded-lg p-3 text-green-400 font-mono text-[10px] mt-4">
                <p>ID: {devCoords.id}</p>
                <p>X: {Math.round(devCoords.x)}px | Y: {Math.round(devCoords.y)}px</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}