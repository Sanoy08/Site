'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, PaintBucket, RotateCcw, Edit3, AlignLeft, AlignCenter, AlignRight, Undo2, Type, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

// ★ Google Fonts Dropdown
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
};

// ★ PRESETS ARCHITECTURE (Image + Respective Elements)
type PosterPreset = {
  id: string;
  bgUrl: string;
  elements: TextElement[];
};

const POSTER_PRESETS: PosterPreset[] = [
  {
    id: 'preset-1',
    bgUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop',
    elements: [
      { id: 'heading', text: 'রবিবারের স্পেশাল লাঞ্চ', x: 180, y: 50, fontSize: 28, color: '#FFD700', align: 'center', fontFamily: '"Anek Bangla", sans-serif' },
      { id: 'menu', text: 'চিকেন বিরিয়ানি কম্বো', x: 180, y: 100, fontSize: 40, color: '#FFFFFF', align: 'center', fontFamily: '"Anek Bangla", sans-serif' },
      { id: 'price', text: 'মাত্র ১৯৯ টাকায়', x: 180, y: 170, fontSize: 48, color: '#4CAF50', align: 'center', fontFamily: '"Anek Bangla", sans-serif' },
      { id: 'deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 180, y: 300, fontSize: 16, color: '#FF5252', align: 'center', fontFamily: '"Anek Bangla", sans-serif' },
    ]
  },
  {
    id: 'preset-2',
    bgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    elements: [
      { id: 'heading', text: 'উইকেন্ড পিৎজা অফার', x: 180, y: 80, fontSize: 32, color: '#FF3366', align: 'center', fontFamily: '"Atma", system-ui' },
      { id: 'menu', text: 'চিকেন চিজ পিৎজা', x: 180, y: 130, fontSize: 36, color: '#FFFFFF', align: 'center', fontFamily: '"Atma", system-ui' },
      { id: 'price', text: 'সাথে কোল্ড ড্রিংক ফ্রি', x: 180, y: 190, fontSize: 24, color: '#00E5FF', align: 'center', fontFamily: '"Atma", system-ui' },
      { id: 'deadline', text: 'অর্ডার: রাত ৮টার মধ্যে', x: 180, y: 320, fontSize: 16, color: '#FFFFFF', align: 'center', fontFamily: 'sans-serif' },
    ]
  },
  {
    id: 'preset-3',
    bgUrl: 'https://images.unsplash.com/photo-1563379926898-05f45c51040c?q=80&w=1000&auto=format&fit=crop',
    elements: [
      { id: 'heading', text: 'মিনিমাল ডিনার থালি', x: 40, y: 60, fontSize: 24, color: '#333333', align: 'left', fontFamily: '"Galada", cursive' },
      { id: 'menu', text: 'মাটন কারি উইথ রাইস', x: 40, y: 110, fontSize: 32, color: '#000000', align: 'left', fontFamily: '"Anek Bangla", sans-serif' },
      { id: 'price', text: '₹249 Only', x: 40, y: 160, fontSize: 40, color: '#D32F2F', align: 'left', fontFamily: 'sans-serif' },
      { id: 'deadline', text: 'সীমিত স্টক! দ্রুত অর্ডার করুন', x: 40, y: 320, fontSize: 14, color: '#555555', align: 'left', fontFamily: '"Anek Bangla", sans-serif' },
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

  useEffect(() => {
    if (activeId || editingId) document.body.style.overscrollBehaviorY = 'contain';
    else document.body.style.overscrollBehaviorY = 'auto';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, [activeId, editingId]);

  const saveHistory = () => {
    setHistory(prev => [...prev, elements]);
  };

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
  };

  const updateActiveElement = (updates: Partial<TextElement>) => {
    setElements(elements.map(el => el.id === activeId ? { ...el, ...updates } : el));
  };

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (!activeId) return;
    saveHistory();
    let newX = 180;
    if (alignment === 'left') newX = 20;
    if (alignment === 'right') newX = 340;
    updateActiveElement({ align: alignment, x: newX });
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setActiveId(null); setEditingId(null);
    
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(posterRef.current!, { scale: 3, useCORS: true, backgroundColor: '#000' });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = `BK-Offer-${new Date().getTime()}.jpg`;
            link.click();
        } catch (e) {}
    }, 100);
  };

  const activeElement = elements.find(e => e.id === activeId);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20 md:max-w-4xl md:pb-10">
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><LayoutTemplate className="h-6 w-6 text-primary" /> Poster Maker</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleUndo} disabled={history.length === 0} className="h-9 px-3"><Undo2 className="h-4 w-4" /></Button>
            <Button onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700 h-9 px-3 text-sm"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        
        {/* CANVAS */}
        <div className="w-full flex justify-center">
            <div 
              ref={posterRef}
              className="relative bg-black overflow-hidden shadow-2xl ring-2 ring-border/50 touch-none shrink-0"
              style={{ width: '360px', height: '360px', backgroundImage: `url(${activePreset.bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              onClick={(e) => { if (e.target === posterRef.current) { setActiveId(null); setEditingId(null); } }}
            >
              {elements.map((el) => {
                const isActive = activeId === el.id;
                const isEditing = editingId === el.id;

                return (
                  <motion.div
                    key={el.id}
                    drag={!isEditing}
                    dragMomentum={false}
                    initial={{ x: el.x, y: el.y }}
                    animate={{ x: el.x, y: el.y }}
                    transition={{ type: 'tween', duration: 0 }}
                    onPointerDown={() => { if (!isEditing && activeId !== el.id) setActiveId(el.id); }}
                    onDragStart={() => saveHistory()}
                    onDoubleClick={() => { setActiveId(el.id); setEditingId(el.id); }}
                    onDragEnd={(e, info) => setElements(elements.map(item => item.id === el.id ? { ...item, x: Math.round(item.x + info.offset.x), y: Math.round(item.y + info.offset.y) } : item))}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, color: el.color, textAlign: el.align,
                      fontWeight: 'normal', cursor: isEditing ? 'text' : 'grab', whiteSpace: 'nowrap', touchAction: 'none',
                      translateX: el.align === 'center' ? '-50%' : el.align === 'right' ? '-100%' : '0%', translateY: '-50%'
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
                            style={{ color: el.color, fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, textAlign: el.align, width: `${el.text.length + 2}ch` }}
                        />
                    ) : (<span className="select-none">{el.text}</span>)}
                  </motion.div>
                );
              })}
            </div>
        </div>

        {/* CONTROLS */}
        <div className="w-full space-y-4 max-w-[360px] md:max-w-xs shrink-0">
          <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded-lg font-medium">
             💡 <span className="text-primary font-bold">Double Tap</span> on any text to edit
          </div>

          <Card className="p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><LayoutTemplate className="h-4 w-4"/> Theme Presets</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {POSTER_PRESETS.map((preset) => (
                <div key={preset.id} onClick={() => handlePresetChange(preset)} className={`h-14 w-14 rounded-lg cursor-pointer border-2 shrink-0 bg-muted ${activePreset.id === preset.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} style={{ backgroundImage: `url(${preset.bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              ))}
            </div>
          </Card>

          <AnimatePresence mode="popLayout">
              {activeElement && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                      <Card className="p-4 shadow-sm border-primary/20 space-y-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm flex items-center gap-2"><PaintBucket className="h-4 w-4 text-primary"/> Styling</h3>
                            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setEditingId(activeId)}><Edit3 className="h-3 w-3 mr-1" /> Edit Text</Button>
                        </div>

                        {/* FONT DROPDOWN */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1"><Type className="h-3 w-3"/> Font Style</Label>
                            <select 
                                value={activeElement.fontFamily}
                                onChange={(e) => { saveHistory(); updateActiveElement({ fontFamily: e.target.value }); }}
                                className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary`}
                                style={{ fontFamily: activeElement.fontFamily }}
                            >
                                {FONTS.map(font => (
                                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* ALIGN */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Quick Align</Label>
                            <div className="flex gap-2">
                                <Button size="sm" variant={activeElement.align === 'left' ? 'default' : 'outline'} className="flex-1 h-8" onClick={() => alignText('left')}><AlignLeft className="h-4 w-4" /></Button>
                                <Button size="sm" variant={activeElement.align === 'center' ? 'default' : 'outline'} className="flex-1 h-8" onClick={() => alignText('center')}><AlignCenter className="h-4 w-4" /></Button>
                                <Button size="sm" variant={activeElement.align === 'right' ? 'default' : 'outline'} className="flex-1 h-8" onClick={() => alignText('right')}><AlignRight className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="flex justify-between"><Label className="text-xs font-medium">Text Size</Label><span className="text-xs text-muted-foreground">{activeElement.fontSize}px</span></div>
                            <Slider value={[activeElement.fontSize]} min={12} max={120} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ fontSize: val[0] })} className="my-2" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Color</Label>
                            <div className="flex items-center gap-3">
                                <input type="color" value={activeElement.color} onPointerDown={() => saveHistory()} onChange={(e) => updateActiveElement({ color: e.target.value })} className="h-8 w-full rounded cursor-pointer border-0 p-0" />
                                <Input value={activeElement.color.toUpperCase()} onChange={(e) => { saveHistory(); updateActiveElement({ color: e.target.value }); }} className="w-24 font-mono text-xs uppercase h-8" />
                            </div>
                        </div>
                      </Card>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="pt-2">
             <Button variant="outline" onClick={() => { saveHistory(); setElements(activePreset.elements); setActiveId(null);}} className="w-full text-xs"><RotateCcw className="h-3 w-3 mr-2" /> Reset All Changes</Button>
          </div>
        </div>
      </div>

      {/* ★ DEVELOPER OUTPUT BOX (পরবর্তীতে হাইড করে দেবেন) ★ */}
      <div className="mt-8 pt-8 border-t border-dashed">
        <div className="bg-slate-900 rounded-xl p-4 md:p-6 shadow-inner relative group">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-400 font-mono text-sm font-semibold flex items-center gap-2"><Code className="h-4 w-4" /> Live Coordinates (For Developer)</h3>
              <Button 
                 size="sm" variant="secondary" className="h-7 text-xs" 
                 onClick={() => {
                     navigator.clipboard.writeText(JSON.stringify(elements, null, 2));
                     toast.success("Copied to clipboard!");
                 }}
              >
                  Copy JSON
              </Button>
           </div>
           <pre className="text-slate-300 font-mono text-[10px] md:text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(elements, null, 2)}
           </pre>
           <p className="text-slate-500 text-[10px] mt-4 italic">// Copy this JSON and paste it inside the POSTER_PRESETS array in your code to save your design permanently.</p>
        </div>
      </div>

    </div>
  );
}