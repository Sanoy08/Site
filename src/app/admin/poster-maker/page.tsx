'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, Edit3, AlignLeft, AlignCenter, AlignRight, Undo2, Code, Type, Palette, Scaling, X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// ★ Color Wheel
import { ChromePicker } from 'react-color';

const FONTS = [
  { name: 'System Default', value: 'sans-serif' },
  { name: 'Anek Bangla', value: '"Anek Bangla", sans-serif' },
  { name: 'Atma', value: '"Atma", system-ui' },
  { name: 'Galada', value: '"Galada", cursive' }
];

type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  rotation: number;
};

type PosterPreset = {
  id: string;
  bgUrl: string;
  elements: TextElement[];
};

// ★ PRESETS
const POSTER_PRESETS: PosterPreset[] = [
  {
    id: 'preset-1',
    bgUrl: 'https://images.bumbaskitchen.app/dhhfisazd/IMG_20260503_075105_urswie.png',
    elements: [
      { id: 'Dinner', text: 'রবিবারের স্পেশাল লাঞ্চ', x: 180, y: 50, fontSize: 28, color: '#FFD700', align: 'center', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
      { id: 'Lunch', text: 'চিকেন বিরিয়ানি কম্বো', x: 180, y: 100, fontSize: 40, color: '#FFFFFF', align: 'center', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
      { id: 'price', text: 'মাত্র ১৯৯ টাকায়', x: 180, y: 170, fontSize: 48, color: '#4CAF50', align: 'center', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
      { id: 'deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 180, y: 300, fontSize: 16, color: '#FF5252', align: 'center', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
    ]
  },
  {
    id: 'preset-2',
    bgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    elements: [
      { id: 'heading', text: 'উইকেন্ড পিৎজা অফার', x: 180, y: 80, fontSize: 32, color: '#FF3366', align: 'center', fontFamily: '"Atma", system-ui', rotation: -5 },
      { id: 'menu', text: 'চিকেন চিজ পিৎজা', x: 180, y: 130, fontSize: 36, color: '#FFFFFF', align: 'center', fontFamily: '"Atma", system-ui', rotation: 0 },
      { id: 'price', text: 'সাথে কোল্ড ড্রিংক ফ্রি', x: 180, y: 190, fontSize: 24, color: '#00E5FF', align: 'center', fontFamily: '"Atma", system-ui', rotation: 5 },
      { id: 'deadline', text: 'অর্ডার: রাত ৮টার মধ্যে', x: 180, y: 320, fontSize: 16, color: '#FFFFFF', align: 'center', fontFamily: 'sans-serif', rotation: 0 },
    ]
  },
  {
    id: 'preset-3',
    bgUrl: 'https://images.unsplash.com/photo-1563379926898-05f45c51040c?q=80&w=1000&auto=format&fit=crop',
    elements: [
      { id: 'heading', text: 'মিনিমাল ডিনার থালি', x: 20, y: 60, fontSize: 24, color: '#333333', align: 'left', fontFamily: '"Galada", cursive', rotation: 0 },
      { id: 'menu', text: 'মাটন কারি উইথ রাইস', x: 20, y: 110, fontSize: 32, color: '#000000', align: 'left', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
      { id: 'price', text: '₹249 Only', x: 20, y: 160, fontSize: 40, color: '#D32F2F', align: 'left', fontFamily: 'sans-serif', rotation: 0 },
      { id: 'deadline', text: 'সীমিত স্টক! দ্রুত অর্ডার করুন', x: 20, y: 320, fontSize: 14, color: '#555555', align: 'left', fontFamily: '"Anek Bangla", sans-serif', rotation: 0 },
    ]
  }
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<PosterPreset>(POSTER_PRESETS[0]);
  
  const [elements, setElements] = useState<TextElement[]>(activePreset.elements);
  const [history, setHistory] = useState<TextElement[][]>([]); 
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Prevent scroll when dragging/editing
  useEffect(() => {
    if (activeId || editingId || showColorPicker) document.body.style.overscrollBehaviorY = 'contain';
    else document.body.style.overscrollBehaviorY = 'auto';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, [activeId, editingId, showColorPicker]);

  const saveHistory = () => setHistory(prev => [...prev, elements]);

  const handleUndo = () => {
    if (history.length > 0) {
      setElements(history[history.length - 1]);
      setHistory(history.slice(0, -1));
      setActiveId(null);
    }
  };

  const handlePresetChange = (preset: PosterPreset) => {
    saveHistory();
    setActivePreset(preset);
    setElements(preset.elements);
    setActiveId(null);
    setEditingId(null);
    setShowColorPicker(false);
  };

  const updateActiveElement = (updates: Partial<TextElement>) => {
    setElements(elements.map(el => el.id === activeId ? { ...el, ...updates } : el));
  };

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  // ★ Flawless Alignment Logic
  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (!activeId) return;
    saveHistory();
    let newX = 180; // Default Center
    if (alignment === 'left') newX = 20; // Snap to left margin
    if (alignment === 'right') newX = 340; // Snap to right margin
    updateActiveElement({ align: alignment, x: newX });
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setActiveId(null); setEditingId(null); setShowColorPicker(false);
    
    toast.loading("Generating 2000x2000 HD Poster...");

    setTimeout(async () => {
        try {
            // ★ MAGIC: 2000px output from 360px container
            const exportScale = 2000 / 360; 

            const canvas = await html2canvas(posterRef.current!, { 
                scale: exportScale, 
                useCORS: true, 
                backgroundColor: '#000' 
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = `BK-Offer-${new Date().getTime()}.jpg`;
            link.click();
            toast.success("Poster generated successfully!");
        } catch (e) {
            toast.error("Error generating poster");
        }
    }, 200);
  };

  const activeElement = elements.find(e => e.id === activeId);

  return (
    <div className="max-w-lg mx-auto md:max-w-4xl space-y-3 pb-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white dark:bg-card p-3 rounded-xl border shadow-sm">
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" /> Poster Maker
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleUndo} disabled={history.length === 0} className="h-8 px-2">
                <Undo2 className="h-4 w-4" />
            </Button>
            <Button onClick={handleDownload} className="gap-1.5 bg-green-600 hover:bg-green-700 h-8 px-3 text-xs md:text-sm">
                <Download className="h-3.5 w-3.5" /> Export HD
            </Button>
        </div>
      </div>

      {/* TOP PRESETS */}
      <Card className="p-3 shadow-sm flex items-center gap-3 overflow-x-auto scrollbar-hide border-primary/10">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 pl-1">Themes:</span>
        <div className="flex gap-2">
          {POSTER_PRESETS.map((preset) => (
            <div 
              key={preset.id} 
              onClick={() => handlePresetChange(preset)} 
              className={`h-10 w-10 md:h-12 md:w-12 rounded-lg cursor-pointer border-2 shrink-0 bg-muted transition-all ${activePreset.id === preset.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} 
              // ★ FIX: backgroundSize: '100% 100%' prevents any cropping of image
              style={{ backgroundImage: `url(${preset.bgUrl})`, backgroundSize: '100% 100%', backgroundPosition: 'center' }} 
            />
          ))}
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-3 items-center md:items-start relative">
        
        {/* ★ CANVAS SECTION */}
        <div className="w-full flex justify-center shrink-0 md:w-[360px]">
            <div 
              ref={posterRef}
              className="relative bg-black overflow-hidden shadow-xl ring-1 ring-border touch-none"
              // ★ FIX: backgroundSize: '100% 100%'
              style={{ width: '360px', height: '360px', backgroundImage: `url(${activePreset.bgUrl})`, backgroundSize: '100% 100%', backgroundPosition: 'center' }}
              onClick={(e) => { 
                if (e.target === posterRef.current) { 
                  setActiveId(null); 
                  setEditingId(null); 
                  setShowColorPicker(false);
                } 
              }}
            >
              {elements.map((el) => {
                const isActive = activeId === el.id;
                const isEditing = editingId === el.id;

                return (
                  <motion.div
                    key={el.id}
                    drag={!isEditing}
                    dragMomentum={false}
                    // ★ Framer motion controls X and Y strictly
                    initial={{ x: el.x, y: el.y }}
                    animate={{ x: el.x, y: el.y }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onPointerDown={() => { 
                        if (!isEditing && activeId !== el.id) {
                            setActiveId(el.id);
                            setShowColorPicker(false);
                        }
                    }}
                    onDragStart={() => saveHistory()}
                    onDoubleClick={() => { setActiveId(el.id); setEditingId(el.id); }}
                    onDragEnd={(e, info) => {
                        let finalX = el.x + info.offset.x;
                        let finalY = el.y + info.offset.y;
                        
                        // ★ MAGNETIC SNAPPING (Only snaps on drop to prevent lag)
                        if (Math.abs(finalX - 180) < 20) finalX = 180; // Center X
                        if (Math.abs(finalY - 180) < 20) finalY = 180; // Center Y
                        if (Math.abs(finalX - 20) < 15) finalX = 20;   // Left
                        if (Math.abs(finalX - 340) < 15) finalX = 340; // Right

                        setElements(elements.map(item => item.id === el.id ? { ...item, x: Math.round(finalX), y: Math.round(finalY) } : item));
                    }}
                    style={{
                      position: 'absolute', top: 0, left: 0, // Core wrapper stays at 0,0
                      touchAction: 'none',
                      zIndex: isActive ? 20 : 1
                    }}
                  >
                    {/* ★ INNER WRAPPER (Handles Alignment without breaking Drag) ★ */}
                    <div 
                        style={{
                            transform: `translate(${el.align === 'center' ? '-50%' : el.align === 'right' ? '-100%' : '0%'}, -50%) rotate(${el.rotation || 0}deg)`,
                            fontSize: `${el.fontSize}px`, 
                            fontFamily: el.fontFamily, 
                            color: el.color, 
                            textAlign: el.align,
                            fontWeight: 'normal', 
                            cursor: isEditing ? 'text' : 'grab', 
                            whiteSpace: 'nowrap',
                            textShadow: el.shadow ? '2px 3px 6px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.6)' : 'none',
                        }}
                        className={`p-1 ${isActive && !isEditing ? 'ring-2 ring-dashed ring-white/70 bg-white/10 rounded' : ''}`}
                    >
                        {isEditing ? (
                            <input
                                autoFocus value={el.text}
                                onChange={(e) => handleTextChange(el.id, e.target.value)}
                                onBlur={() => setEditingId(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                className="bg-transparent border-none outline-none p-0 m-0 w-full"
                                style={{ color: el.color, fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, textAlign: el.align, width: `${Math.max(el.text.length, 1) + 2}ch` }}
                            />
                        ) : (<span className="select-none">{el.text}</span>)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
        </div>

        {/* STYLING CONTROLS */}
        <div className="w-full flex-1 max-w-[360px] md:max-w-full">
          
          <AnimatePresence mode="popLayout">
              {activeElement ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card className="p-3 shadow-sm border-primary/20 relative overflow-hidden bg-card">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        
                        <div className="flex items-center justify-between mb-3 pb-2 border-b">
                            <h3 className="font-semibold text-xs flex items-center gap-1.5 text-primary uppercase tracking-wider">
                                <Edit3 className="h-3.5 w-3.5"/> Element Styling
                            </h3>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                Double Tap to Edit
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 relative">
                            
                            {/* Font Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Type className="h-3 w-3"/> Font</Label>
                                <select 
                                    value={activeElement.fontFamily}
                                    onChange={(e) => { saveHistory(); updateActiveElement({ fontFamily: e.target.value }); }}
                                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    style={{ fontFamily: activeElement.fontFamily }}
                                >
                                    {FONTS.map(font => <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>)}
                                </select>
                            </div>

                            {/* Alignment */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><AlignLeft className="h-3 w-3"/> Align</Label>
                                <div className="flex gap-1">
                                    <Button size="sm" variant={activeElement.align === 'left' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('left')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant={activeElement.align === 'center' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('center')}><AlignCenter className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant={activeElement.align === 'right' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('right')}><AlignRight className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>

                            {/* Size Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Scaling className="h-3 w-3"/> Size</Label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">{activeElement.fontSize}px</span>
                                </div>
                                <div className="pt-1">
                                  <Slider value={[activeElement.fontSize]} min={12} max={100} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ fontSize: val[0] })} />
                                </div>
                            </div>

                            {/* Rotate Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><RotateCw className="h-3 w-3"/> Rotate</Label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">{activeElement.rotation || 0}°</span>
                                </div>
                                <div className="pt-1">
                                  <Slider value={[activeElement.rotation || 0]} min={-180} max={180} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ rotation: val[0] })} />
                                </div>
                            </div>

                            {/* Color Wheel Picker */}
                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Palette className="h-3 w-3"/> Color</Label>
                                <div className="flex items-center gap-2 relative">
                                    <div 
                                        className="h-8 w-10 rounded cursor-pointer border border-border shadow-sm shrink-0" 
                                        style={{ backgroundColor: activeElement.color }}
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                    />
                                    <Input 
                                        value={activeElement.color.toUpperCase()} 
                                        onChange={(e) => { saveHistory(); updateActiveElement({ color: e.target.value }); }} 
                                        className="w-full text-xs h-8 font-mono px-2" 
                                    />
                                    
                                    {showColorPicker && (
                                        <div className="absolute top-10 right-0 sm:left-0 z-50">
                                            <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                                            <div className="relative bg-white p-2 rounded-xl shadow-2xl border border-border">
                                                <div className="flex justify-between items-center pb-2 mb-2 border-b">
                                                    <span className="text-xs font-semibold">Pick Color</span>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowColorPicker(false)}><X className="h-3 w-3"/></Button>
                                                </div>
                                                <ChromePicker 
                                                    color={activeElement.color} 
                                                    onChange={(color) => updateActiveElement({ color: color.hex })}
                                                    onChangeComplete={() => saveHistory()}
                                                    disableAlpha={true}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                      </Card>
                  </motion.div>
              ) : (
                  <div className="h-[140px] flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
                      <LayoutTemplate className="h-6 w-6 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No Element Selected</p>
                      <p className="text-xs opacity-70">Tap on any text inside the canvas to edit styles.</p>
                  </div>
              )}
          </AnimatePresence>
        </div>
      </div>

      {/* DEVELOPER OUTPUT BOX */}
      <div className="mt-8 pt-4 border-t border-dashed">
        <div className="bg-slate-900 rounded-xl p-4 shadow-inner relative group">
           <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-400 font-mono text-xs font-semibold flex items-center gap-1.5"><Code className="h-3.5 w-3.5" /> Live Coordinates</h3>
              <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={() => { navigator.clipboard.writeText(JSON.stringify(elements, null, 2)); toast.success("Copied!"); }}>Copy JSON</Button>
           </div>
           <pre className="text-slate-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
              {JSON.stringify(elements, null, 2)}
           </pre>
        </div>
      </div>

    </div>
  );
}
