'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toJpeg } from 'html-to-image';
import { Download, LayoutTemplate, Edit3, AlignLeft, AlignCenter, AlignRight, Undo2, Code, Type, Palette, Scaling, X, RotateCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// ★ Capacitor Imports
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// ★ Color Wheel Import
import { ChromePicker } from 'react-color';

const FONTS = [
  { name: 'System Default', value: 'sans-serif' },
  { name: 'Solaiman Lipi', value: '"Solaiman Lipi", sans-serif' },
  { name: 'Kalpurush', value: '"Kalpurush", sans-serif' },
  { name: 'Siyam Rupali', value: '"Siyam Rupali", sans-serif' },
  { name: 'Hind Siliguri', value: '"Hind Siliguri", sans-serif' },
  { name: 'Baloo Da 2', value: '"Baloo Da 2", cursive' },
  { name: 'Lohit Bengali', value: '"Lohit Bengali", sans-serif' },
  { name: 'Tiro Bangla', value: '"Tiro Bangla", serif' },
  { name: 'Noto Serif Bengali', value: '"Noto Serif Bengali", serif' },
  { name: 'Mina', value: '"Mina", sans-serif' },
  { name: 'Bornomala', value: '"Bornomala", sans-serif' },
  { name: 'Bornomala Vintage', value: '"Bornomala Vintage", sans-serif' },
  { name: 'Ekushey Lal Sabuj', value: '"Ekushey Lal Sabuj", sans-serif' },
  { name: 'Adorsho Lipi', value: '"Adorsho Lipi", sans-serif' },
  { name: 'Charukola', value: '"Charukola", sans-serif' },
  { name: 'AB Shapla', value: '"AB Shapla", sans-serif' },
  { name: 'Ekushey Mukto', value: '"Ekushey Mukto", sans-serif' },
  { name: 'Bensen', value: '"Bensen", sans-serif' },
  { name: 'Bensen Handwriting', value: '"Bensen Handwriting", cursive' },
  { name: 'Ekushey Saraswatii', value: '"Ekushey Saraswatii", sans-serif' },
  { name: 'Atma', value: '"Atma", system-ui' },
  { name: 'Charu Chandan', value: '"Charu Chandan", sans-serif' },
  { name: 'Ekushey Azad', value: '"Ekushey Azad", sans-serif' },
  { name: 'Noto Sans Bengali', value: '"Noto Sans Bengali", sans-serif' },
  { name: 'Google Sans', value: '"Google Sans", sans-serif' },
  { name: 'Anek Bangla', value: '"Anek Bangla", sans-serif' },
  { name: 'Hoogli', value: '"Hoogli", sans-serif' },
  { name: 'Bornoporichay', value: '"Bornoporichay", sans-serif' },
  { name: 'Aikya', value: '"Aikya", sans-serif' },
  { name: 'Kalaa', value: '"Kalaa", sans-serif' },
  { name: 'Mukti', value: '"Mukti", sans-serif' },
  { name: 'UN Bangla', value: '"UN Bangla", sans-serif' },
  { name: 'Tuli', value: '"Tuli", cursive' },
  { name: 'Alkatra', value: '"Alkatra", cursive' },
  { name: 'Galada', value: '"Galada", cursive' },
  { name: 'Sapa', value: '"Sapa", sans-serif' },
  { name: 'Somoyer Srot', value: '"Somoyer Srot", sans-serif' },
  { name: 'Abu Sayed', value: '"Abu Sayed", sans-serif' },
  { name: 'Nilima', value: '"Nilima", sans-serif' },
  { name: 'Ekush', value: '"Ekush", sans-serif' },
  { name: 'Ekushey Aloucik', value: '"Ekushey Aloucik", sans-serif' }
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

const POSTER_PRESETS: PosterPreset[] = [
  {
    id: 'preset-1',
    bgUrl: 'https://images.bumbaskitchen.app/dhhfisazd/both_z7nfww.jpg',
    elements: [
      {
        id: "heading",
        text: "রবিবারের স্পেশাল\nমেনু",
        x: 210,
        y: 63,
        fontSize: 34,
        color: "#ff0000",
        align: "center",
        fontFamily: "\"Ekush\", sans-serif",
        rotation: 0
      },
      {
        id: "menu",
        text: "এখানে মেনু লিখুন...",
        x: 128,
        y: 215,
        fontSize: 12,
        color: "#0013a5",
        align: "center",
        fontFamily: "\"Ekushey Aloucik\", sans-serif",
        rotation: 0
      },
      {
        id: "price",
        text: "এখানে মেনু লিখুন...",
        x: 279,
        y: 256,
        fontSize: 12,
        color: "#0013a5",
        align: "center",
        fontFamily: "\"Ekushey Aloucik\", sans-serif",
        rotation: 0
      },
      {
        id: "deadline",
        text: "অর্ডার দেওয়ার শেষ সময় ২০/২৩/২৬ সকাল ১০:৩০",
        x: 180,
        y: 335,
        fontSize: 16,
        color: "#ffffff",
        align: "center",
        fontFamily: "\"Alkatra\", cursive",
        rotation: 0
      }
    ]
  },
  {
    id: 'preset-2',
    bgUrl: 'https://images.bumbaskitchen.app/dhhfisazd/lunch_oapbyb.jpg',
    elements: [
      { id: 'heading', text: 'উইকেন্ড পিৎজা অফার', x: 180, y: 80, fontSize: 32, color: '#FF3366', align: 'center', fontFamily: '"Atma", system-ui', rotation: -5 },
      { id: 'menu', text: 'চিকেন চিজ পিৎজা', x: 180, y: 130, fontSize: 36, color: '#FFFFFF', align: 'center', fontFamily: '"Atma", system-ui', rotation: 0 },
      { id: 'price', text: 'সাথে কোল্ড ড্রিংক ফ্রি', x: 180, y: 190, fontSize: 24, color: '#00E5FF', align: 'center', fontFamily: '"Atma", system-ui', rotation: 5 },
      { id: 'deadline', text: 'অর্ডার: রাত ৮টার মধ্যে', x: 180, y: 320, fontSize: 16, color: '#FFFFFF', align: 'center', fontFamily: 'sans-serif', rotation: 0 },
    ]
  },
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<PosterPreset>(POSTER_PRESETS[0]);
  
  const [elements, setElements] = useState<TextElement[]>(activePreset.elements);
  const [history, setHistory] = useState<TextElement[][]>([]); 
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const [snapLines, setSnapLines] = useState({ x: false, y: false });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);

  useEffect(() => {
    if (activeId || editingId || showColorPicker || isFontDropdownOpen) document.body.style.overscrollBehaviorY = 'contain';
    else document.body.style.overscrollBehaviorY = 'auto';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, [activeId, editingId, showColorPicker, isFontDropdownOpen]);

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
    setIsFontDropdownOpen(false);
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
    
    // UI Selection clear
    setActiveId(null); 
    setEditingId(null); 
    setSnapLines({ x: false, y: false }); 
    setShowColorPicker(false); 
    setIsFontDropdownOpen(false);
    
    toast.loading("Generating 2000x2000 HD Poster...");

    setTimeout(async () => {
        try {
            const exportScale = 2000 / 360; 
            
            // html-to-image ব্যবহার করে রেন্ডারিং (text shifting problem solved)
            const base64ImageString = await toJpeg(posterRef.current, {
                quality: 0.95,
                width: 360 * exportScale,
                height: 360 * exportScale,
                style: {
                    transform: `scale(${exportScale})`,
                    transformOrigin: 'top left',
                    width: '360px',
                    height: '360px'
                },
                pixelRatio: 1, // অতিরিক্ত স্কেলিং বন্ধ করার জন্য
                backgroundColor: '#000',
            });

            const fileName = `BK-Offer-${new Date().getTime()}.jpg`;

            if (Capacitor.isNativePlatform()) {
                const base64Data = base64ImageString.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache 
                });

                await Share.share({
                    title: 'Bumba\'s Kitchen Offer',
                    text: 'Check out our new offer poster!',
                    url: savedFile.uri,
                    dialogTitle: 'Share Poster'
                });
                
                toast.dismiss();
                toast.success("Poster generated successfully!");
            } else {
                const link = document.createElement('a');
                link.href = base64ImageString;
                link.download = fileName;
                link.click();
                
                toast.dismiss();
                toast.success("Poster downloaded successfully!");
            }
        } catch (e) {
            console.error(e);
            toast.dismiss();
            toast.error("Error generating poster");
        }
    }, 300); // UI clear হওয়ার জন্য একটু বেশি সময় দেওয়া হলো
};

  const activeElement = elements.find(e => e.id === activeId);

  const getPreviewText = (text: string, fontName: string) => {
    const cleanText = text.trim();
    if (!cleanText) return fontName;
    return cleanText.split('\n')[0];
  };

  return (
    <div className="w-full mx-auto md:max-w-4xl space-y-3 pb-10">
      
      {/* HEADER */}
      <div className="mx-2 sm:mx-0 flex items-center justify-between bg-white dark:bg-card p-3 rounded-xl border shadow-sm">
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
      <Card className="mx-2 sm:mx-0 p-3 shadow-sm flex items-center gap-3 overflow-x-auto scrollbar-hide border-primary/10">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 pl-1">Themes:</span>
        <div className="flex gap-2">
          {POSTER_PRESETS.map((preset) => (
            <div 
              key={preset.id} 
              onClick={() => handlePresetChange(preset)} 
              className={`h-10 w-10 md:h-12 md:w-12 rounded-lg cursor-pointer border-2 shrink-0 bg-muted transition-all ${activePreset.id === preset.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} 
              style={{ backgroundImage: `url(${preset.bgUrl})`, backgroundSize: '100% 100%', backgroundPosition: 'center' }} 
            />
          ))}
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-start relative mt-4">
        
        {/* CANVAS SECTION */}
        <div className="w-full flex justify-center shrink-0 py-1">
            <div 
              ref={posterRef}
              className="relative bg-black overflow-hidden shadow-xl ring-1 ring-border touch-none shrink-0"
              // ★ BLURRY BACKGROUND FIX: Removed background properties from style
              style={{ width: '360px', height: '360px' }}
              onClick={(e) => { 
                if (e.target === posterRef.current || (e.target as HTMLElement).tagName === 'IMG') { 
                  setActiveId(null); 
                  setEditingId(null); 
                  setShowColorPicker(false);
                  setIsFontDropdownOpen(false);
                } 
              }}
            >
              {/* ★ HIGH-RES IMAGE TAG INSTEAD OF CSS BACKGROUND ★ */}
              <img 
                src={activePreset.bgUrl} 
                alt="Background" 
                crossOrigin="anonymous" 
                className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none" 
              />

              {snapLines.x && <div className="absolute top-0 bottom-0 left-[180px] w-px bg-cyan-400 shadow-[0_0_8px_cyan] z-50 pointer-events-none" />}
              {snapLines.y && <div className="absolute left-0 right-0 top-[180px] h-px bg-cyan-400 shadow-[0_0_8px_cyan] z-50 pointer-events-none" />}

              {elements.map((el) => {
  const isActive = activeId === el.id;
  const isEditing = editingId === el.id;
  const isDragging = draggingId === el.id;

  const lines = el.text.split('\n');
  const maxLineLength = Math.max(...lines.map(l => l.length), 1);

  return (
    <motion.div
      key={el.id}
      drag={!isEditing}
      dragMomentum={false}
      // ★ FIX 1: Nested transform বন্ধ করার জন্য x, y এর মান 0 রাখুন
      initial={{ x: 0, y: 0 }}
      animate={isDragging ? undefined : { x: 0, y: 0 }}
      transition={{ type: 'tween', duration: 0 }}
      onPointerDown={() => { 
          if (!isEditing && activeId !== el.id) {
              setActiveId(el.id);
              setShowColorPicker(false);
              setIsFontDropdownOpen(false);
          }
      }}
      onDragStart={() => {
          saveHistory();
          setDraggingId(el.id);
      }}
      onDoubleClick={() => { setActiveId(el.id); setEditingId(el.id); }}
      onDrag={(e, info) => {
          // info.offset ব্যবহার করে snapping ক্যালকুলেট করা হচ্ছে
          const currentX = el.x + info.offset.x;
          const currentY = el.y + info.offset.y;
          setSnapLines({
              x: Math.abs(currentX - 180) < 12,
              y: Math.abs(currentY - 180) < 12
          });
      }}
      onDragEnd={(e, info) => {
          setSnapLines({ x: false, y: false });
          setDraggingId(null);
          
          // ★ FIX 2: info.offset থেকে সরাসরি পজিশন আপডেট করা
          let finalX = el.x + info.offset.x;
          let finalY = el.y + info.offset.y;
          
          if (Math.abs(finalX - 180) < 12) finalX = 180;
          if (Math.abs(finalY - 180) < 12) finalY = 180;

          setElements(elements.map(item => item.id === el.id ? { ...item, x: Math.round(finalX), y: Math.round(finalY) } : item));
      }}
      style={{
        position: 'absolute', 
        top: el.y,   // ★ FIX 3: Framer Motion-এর বদলে সরাসরি Absolute Top/Left ব্যবহার করা
        left: el.x,  
        touchAction: 'none',
        zIndex: isActive ? 20 : 10
      }}
    >
      <div 
          style={{
              transform: `translate(${el.align === 'center' ? '-50%' : el.align === 'right' ? '-100%' : '0%'}, -50%) rotate(${el.rotation || 0}deg)`,
              // ★ FIX 4: html2canvas যাতে height-এর সঠিক bounding box পায়
              display: 'inline-block',
              width: 'max-content',
              fontSize: `${el.fontSize}px`, 
              fontFamily: el.fontFamily, 
              color: el.color, 
              textAlign: el.align,
              fontWeight: 'normal', 
              cursor: isEditing ? 'text' : 'grab', 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.2',
              textShadow: 'none',
          }}
          className={`p-1 ${isActive && !isEditing ? 'ring-2 ring-dashed ring-white/70 bg-white/10 rounded' : ''}`}
      >
          {isEditing ? (
              <textarea
                  autoFocus 
                  value={el.text}
                  onChange={(e) => handleTextChange(el.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  wrap="off"
                  className="bg-transparent border-none outline-none p-0 m-0 resize-none overflow-hidden block"
                  style={{ 
                      color: el.color, 
                      fontSize: `${el.fontSize}px`, 
                      fontFamily: el.fontFamily, 
                      textAlign: el.align, 
                      lineHeight: '1.2',
                      width: `${maxLineLength + 2}ch`,
                      height: `${lines.length * 1.25}em`
                  }}
              />
          ) : (
              <span className="select-none block">{el.text}</span> // Added block here
          )}
      </div>
    </motion.div>
  );
})}
            </div>
        </div>

        {/* STYLING CONTROLS */}
        <div className="w-full flex-1 max-w-[360px] md:max-w-full mx-auto px-2 sm:px-0">
          
          <AnimatePresence mode="popLayout">
              {activeElement ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card className="p-3 shadow-sm border-primary/20 relative bg-card rounded-xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
                        
                        <div className="flex items-center justify-between mb-3 pb-2 border-b">
                            <h3 className="font-semibold text-xs flex items-center gap-1.5 text-primary uppercase tracking-wider pl-2">
                                <Edit3 className="h-3.5 w-3.5"/> Element Styling
                            </h3>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                Double Tap to Edit
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 pl-2">
                            
                            <div className="space-y-1.5 relative">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Type className="h-3 w-3"/> Font</Label>
                                
                                <div 
                                    className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm cursor-pointer hover:bg-accent/50"
                                    onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                    style={{ fontFamily: activeElement.fontFamily }}
                                >
                                    <span className="truncate pr-2">
                                        {getPreviewText(activeElement.text, FONTS.find(f => f.value === activeElement.fontFamily)?.name || 'Font')}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                                </div>

                                <AnimatePresence>
                                {isFontDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsFontDropdownOpen(false)} />
                                        
                                        <motion.div 
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-[52px] left-0 w-[150%] md:w-full bg-white dark:bg-card border shadow-xl rounded-md z-[70] max-h-56 overflow-y-auto py-1"
                                        >
                                            {FONTS.map(font => (
                                                <div 
                                                    key={font.value}
                                                    className={`cursor-pointer px-3 py-2 text-base md:text-lg hover:bg-muted transition-colors truncate ${activeElement.fontFamily === font.value ? 'bg-primary/10 text-primary' : ''}`}
                                                    style={{ fontFamily: font.value }}
                                                    onClick={() => {
                                                        saveHistory();
                                                        updateActiveElement({ fontFamily: font.value });
                                                        setIsFontDropdownOpen(false);
                                                    }}
                                                >
                                                    {getPreviewText(activeElement.text, font.name)}
                                                </div>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><AlignLeft className="h-3 w-3"/> Align</Label>
                                <div className="flex gap-1">
                                    <Button size="sm" variant={activeElement.align === 'left' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('left')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant={activeElement.align === 'center' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('center')}><AlignCenter className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant={activeElement.align === 'right' ? 'default' : 'outline'} className="flex-1 h-8 px-0" onClick={() => alignText('right')}><AlignRight className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Scaling className="h-3 w-3"/> Size</Label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">{activeElement.fontSize}px</span>
                                </div>
                                <div className="pt-1">
                                  <Slider value={[activeElement.fontSize]} min={12} max={100} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ fontSize: val[0] })} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><RotateCw className="h-3 w-3"/> Rotate</Label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">{activeElement.rotation || 0}°</span>
                                </div>
                                <div className="pt-1">
                                  <Slider value={[activeElement.rotation || 0]} min={-180} max={180} step={1} onPointerDown={() => saveHistory()} onValueChange={(val) => updateActiveElement({ rotation: val[0] })} />
                                </div>
                            </div>

                            <div className="space-y-1.5 col-span-2 sm:col-span-1 relative">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1"><Palette className="h-3 w-3"/> Color</Label>
                                <div className="flex items-center gap-2">
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
                                </div>
                                
                                <AnimatePresence>
                                {showColorPicker && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                      className="absolute bottom-full mb-2 left-0 z-[100]"
                                    >
                                        <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                                        <div className="relative z-50 bg-white p-2 rounded-xl shadow-2xl border border-border">
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
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>

                        </div>
                      </Card>
                  </motion.div>
              ) : (
                  <div className="h-[140px] flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground mx-2 sm:mx-0">
                      <LayoutTemplate className="h-6 w-6 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No Element Selected</p>
                      <p className="text-xs opacity-70">Tap on any text inside the canvas to edit styles.</p>
                  </div>
              )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-dashed px-2 sm:px-0">
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