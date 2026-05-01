'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, MousePointer2, Type, PaintBucket, Maximize, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// আপনার ব্যাকগ্রাউন্ড প্রিসেটগুলো (Image URLs)
const PRESETS = [
  'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop', // Dark Burger (Demo)
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop', // Pizza (Demo)
  'https://images.unsplash.com/photo-1563379926898-05f45c51040c?q=80&w=1000&auto=format&fit=crop' // Minimal (Demo)
];

type TextElement = {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  shadow: boolean;
};

// ★ বাংলা ডিফল্টস 
const DEFAULT_ELEMENTS: TextElement[] = [
  { id: 'heading', label: 'Heading', text: 'রবিবারের স্পেশাল লাঞ্চ', x: 0, y: -200, fontSize: 36, color: '#FFD700', shadow: true },
  { id: 'menu', label: 'Menu Name', text: 'চিকেন বিরিয়ানি কম্বো', x: 0, y: -100, fontSize: 42, color: '#FFFFFF', shadow: true },
  { id: 'price', label: 'Price', text: 'মাত্র ১৯৯ টাকায়', x: 0, y: 50, fontSize: 50, color: '#4CAF50', shadow: true },
  { id: 'deadline', label: 'Order Deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 0, y: 220, fontSize: 18, color: '#FF5252', shadow: false },
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(PRESETS[0]);
  const [elements, setElements] = useState<TextElement[]>(DEFAULT_ELEMENTS);
  
  // কোন টেক্সটটা এডিট করা হচ্ছে
  const [activeId, setActiveId] = useState<string>('heading');
  
  // ★ ডেভেলপার X, Y (রিয়েলটাইম)
  const [devCoords, setDevCoords] = useState<{id: string, x: number, y: number} | null>(null);

  // Landscape Warning Logic
  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  const updateActiveElement = (updates: Partial<TextElement>) => {
    setElements(elements.map(el => el.id === activeId ? { ...el, ...updates } : el));
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    toast.loading("Generating high-quality poster...");
    try {
        const canvas = await html2canvas(posterRef.current, {
            scale: 3, // 3x scale for ultra HD export
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

  const resetToDefault = () => {
    setElements(DEFAULT_ELEMENTS);
    setDevCoords(null);
  };

  const activeElement = elements.find(e => e.id === activeId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 font-headline">
            <LayoutTemplate className="h-6 w-6 text-primary" /> Poster Studio
            </h1>
            <p className="text-muted-foreground text-sm">Design social media posters in seconds.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={resetToDefault} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700 flex-1 sm:flex-auto">
                <Download className="h-4 w-4" /> Export HD
            </Button>
        </div>
      </div>

      {/* Mobile Landscape Warning */}
      {isPortrait && (
          <div className="md:hidden bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              For the best editing experience, please rotate your phone to landscape mode.
          </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ★ LEFT SIDEBAR: Text Inputs & Presets ★ */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 flex items-center gap-2"><LayoutTemplate className="h-4 w-4"/> Backgrounds</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {PRESETS.map((bg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedBg(bg)}
                  className={`h-20 w-14 rounded-lg cursor-pointer border-2 shrink-0 overflow-hidden bg-muted transition-transform hover:scale-105 ${selectedBg === bg ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-transparent'}`}
                  style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold border-b pb-2 flex items-center gap-2"><Type className="h-4 w-4"/> Poster Content</h3>
            <div className="space-y-4">
                {elements.map((el) => (
                <div 
                    key={el.id} 
                    className={`space-y-1.5 p-3 rounded-xl border transition-colors cursor-pointer ${activeId === el.id ? 'bg-primary/5 border-primary/30' : 'bg-transparent border-border hover:bg-muted/50'}`}
                    onClick={() => setActiveId(el.id)}
                >
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{el.label}</Label>
                    <Input 
                        value={el.text}
                        onChange={(e) => handleTextChange(el.id, e.target.value)}
                        className="font-bengali" // Add your bengali font class here if any
                    />
                </div>
                ))}
            </div>
          </Card>
        </div>

        {/* ★ CENTER: The Canvas ★ */}
        <div className="lg:col-span-5 flex justify-center items-start pt-4 lg:pt-0">
            <div 
              ref={posterRef}
              className="relative bg-black overflow-hidden shadow-2xl rounded-sm ring-1 ring-border/50"
              style={{
                width: '360px',  // Mobile Story/Status standard width
                height: '640px', // 9:16 aspect ratio
                backgroundImage: `url(${selectedBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Optional: Dark overlay to make text pop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />

              {/* Center Anchor Point for Absolute Positioning */}
              <div className="absolute top-1/2 left-1/2 w-0 h-0">
                  {elements.map((el) => (
                    <motion.div
                      key={el.id}
                      drag
                      dragConstraints={posterRef}
                      dragElastic={0}
                      dragMomentum={false}
                      onPointerDown={() => setActiveId(el.id)}
                      onDrag={(event, info) => {
                        setDevCoords({ id: el.id, x: el.x + info.offset.x, y: el.y + info.offset.y });
                      }}
                      onDragEnd={(event, info) => {
                        setElements(elements.map(item => 
                            item.id === el.id ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y } : item
                        ));
                      }}
                      style={{
                        position: 'absolute',
                        x: el.x, // Framer motion optimized X
                        y: el.y, // Framer motion optimized Y
                        fontSize: `${el.fontSize}px`,
                        color: el.color,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: el.shadow ? '2px 3px 6px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.5)' : 'none',
                        cursor: 'grab',
                        whiteSpace: 'nowrap',
                        // Center align logic based on anchor
                        translateX: '-50%',
                        translateY: '-50%'
                      }}
                      whileHover={{ outline: '1px dashed rgba(255,255,255,0.5)', outlineOffset: '4px' }}
                      whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                      className={`font-bengali ${activeId === el.id ? 'ring-2 ring-dashed ring-primary ring-offset-4 ring-offset-transparent' : ''}`}
                    >
                      {el.text}
                    </motion.div>
                  ))}
              </div>
            </div>
        </div>

        {/* ★ RIGHT SIDEBAR: Style Controls & Dev Info ★ */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 space-y-6 shadow-sm sticky top-24">
            <div>
                <h3 className="font-semibold border-b pb-2 flex items-center gap-2 mb-4 text-primary">
                   <PaintBucket className="h-4 w-4"/> Styling: {activeElement?.label}
                </h3>
            </div>

            {activeElement ? (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-sm font-medium">Text Size</Label>
                            <span className="text-xs text-muted-foreground">{activeElement.fontSize}px</span>
                        </div>
                        <Slider 
                            value={[activeElement.fontSize]} 
                            min={10} max={100} step={1}
                            onValueChange={(val) => updateActiveElement({ fontSize: val[0] })}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Color</Label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={activeElement.color}
                                onChange={(e) => updateActiveElement({ color: e.target.value })}
                                className="h-10 w-full rounded cursor-pointer border-0 p-0"
                            />
                            <Input 
                                value={activeElement.color.toUpperCase()} 
                                onChange={(e) => updateActiveElement({ color: e.target.value })}
                                className="w-24 font-mono text-xs uppercase"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Click a text to edit styling.</p>
            )}
          </Card>

          {/* ★ Developer Tool: X/Y Axis Display ★ */}
          <Card className="p-4 bg-slate-900 text-green-400 border-slate-800 shadow-inner font-mono text-xs">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-3">
              <MousePointer2 className="h-4 w-4" /> Final Coordinates
            </h3>
            {devCoords ? (
              <div className="space-y-1.5 opacity-90">
                <p className="text-slate-300">ID: <span className="text-white font-bold">{devCoords.id}</span></p>
                <p>x: <span className="text-yellow-300">{Math.round(devCoords.x)}</span>,</p>
                <p>y: <span className="text-blue-300">{Math.round(devCoords.y)}</span></p>
                <p className="text-[10px] text-slate-500 mt-2">// Copy these values to DEFAULT_ELEMENTS</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">Drag text to reveal X,Y...</p>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}