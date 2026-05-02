'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, PaintBucket, RotateCcw, Edit3, AlignLeft, AlignCenter, AlignRight, Undo2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

const PRESETS = [
  'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1563379926898-05f45c51040c?q=80&w=1000&auto=format&fit=crop'
];

// ★ Next.js Font CSS Variable Classes
const FONTS = [
  { name: 'System Default', value: 'font-sans' },
  { name: 'Anek Bangla', value: 'font-anek' },
  { name: 'Atma', value: 'font-atma' },
  { name: 'Galada', value: 'font-galada' }
];

type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  fontClass: string; // Changed from fontFamily
};

const DEFAULT_ELEMENTS: TextElement[] = [
  { id: 'heading', text: 'বারের স্পেশাল লাঞ্চ/ডিনার', x: 180, y: 50, fontSize: 28, color: '#FFD700', align: 'center', fontClass: 'font-anek' },
  { id: 'menu', text: 'চিকেন বিরিয়ানি কম্বো', x: 180, y: 100, fontSize: 40, color: '#FFFFFF', align: 'center', fontClass: 'font-anek' },
  { id: 'price', text: 'মাত্র ১৯৯ টাকায়', x: 180, y: 170, fontSize: 48, color: '#4CAF50', align: 'center', fontClass: 'font-anek' },
  { id: 'deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 180, y: 300, fontSize: 16, color: '#FF5252', align: 'center', fontClass: 'font-anek' },
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(PRESETS[0]);
  
  const [elements, setElements] = useState<TextElement[]>(DEFAULT_ELEMENTS);
  const [history, setHistory] = useState<TextElement[][]>([]); 
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeId || editingId) {
      document.body.style.overscrollBehaviorY = 'contain';
    } else {
      document.body.style.overscrollBehaviorY = 'auto';
    }
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, [activeId, editingId]);

  const saveHistory = () => setHistory(prev => [...prev, elements]);

  const handleUndo = () => {
    if (history.length > 0) {
      setElements(history[history.length - 1]);
      setHistory(history.slice(0, -1));
      setActiveId(null);
    }
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
              style={{ width: '360px', height: '360px', backgroundImage: `url(${selectedBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
                    onDragEnd={(e, info) => setElements(elements.map(item => item.id === el.id ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y } : item))}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      fontSize: `${el.fontSize}px`, color: el.color, textAlign: el.align,
                      fontWeight: 'normal', cursor: isEditing ? 'text' : 'grab', whiteSpace: 'nowrap', touchAction: 'none',
                      translateX: el.align === 'center' ? '-50%' : el.align === 'right' ? '-100%' : '0%', translateY: '-50%'
                    }}
                    className={`p-1 ${el.fontClass} ${isActive && !isEditing ? 'ring-2 ring-dashed ring-white/70 bg-white/10 rounded' : ''}`}
                  >
                    {isEditing ? (
                        <input
                            autoFocus value={el.text}
                            onChange={(e) => handleTextChange(el.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            className="bg-transparent border-none outline-none p-0 m-0 w-full"
                            style={{ color: el.color, fontSize: `${el.fontSize}px`, textAlign: el.align, width: `${el.text.length + 2}ch` }}
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
            <h3 className="font-semibold text-sm flex items-center gap-2"><LayoutTemplate className="h-4 w-4"/> Background</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {PRESETS.map((bg, idx) => (
                <div key={idx} onClick={() => setSelectedBg(bg)} className={`h-14 w-14 rounded-lg cursor-pointer border-2 shrink-0 bg-muted ${selectedBg === bg ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent'}`} style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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

                        {/* ★ FONT DROPDOWN ★ */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1"><Type className="h-3 w-3"/> Font Style</Label>
                            <select 
                                value={activeElement.fontClass}
                                onChange={(e) => { saveHistory(); updateActiveElement({ fontClass: e.target.value }); }}
                                className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary ${activeElement.fontClass}`}
                            >
                                {FONTS.map(font => (
                                    <option key={font.name} value={font.value} className={font.value}>{font.name}</option>
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
                            <Slider value={[activeElement.fontSize]} min={12} max={80} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ fontSize: val[0] })} className="my-2" />
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
             <Button variant="outline" onClick={() => { saveHistory(); setElements(DEFAULT_ELEMENTS); setActiveId(null);}} className="w-full text-xs"><RotateCcw className="h-3 w-3 mr-2" /> Reset All Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}