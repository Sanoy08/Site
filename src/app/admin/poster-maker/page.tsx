'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, PaintBucket, RotateCcw, MousePointer2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

// ★ বাংলা ডিফল্টস (X=180 মানে 360px ক্যানভাসের একদম মাঝখান)
const DEFAULT_ELEMENTS: TextElement[] = [
  { id: 'heading', text: 'রবিবারের স্পেশাল লাঞ্চ', x: 180, y: 80, fontSize: 32, color: '#FFD700', shadow: true },
  { id: 'menu', text: 'চিকেন বিরিয়ানি কম্বো', x: 180, y: 160, fontSize: 38, color: '#FFFFFF', shadow: true },
  { id: 'price', text: 'মাত্র ১৯৯ টাকায়', x: 180, y: 250, fontSize: 46, color: '#4CAF50', shadow: true },
  { id: 'deadline', text: 'অর্ডার দেওয়ার শেষ সময় কাল সকাল ১০:৩০', x: 180, y: 450, fontSize: 16, color: '#FF5252', shadow: false },
];

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(PRESETS[0]);
  const [elements, setElements] = useState<TextElement[]>(DEFAULT_ELEMENTS);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [devCoords, setDevCoords] = useState<{id: string, x: number, y: number} | null>(null);

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setActiveId(null); // সিলেকশন বর্ডার সরানোর জন্য
    setEditingId(null);
    toast.loading("Generating HD poster...");
    
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(posterRef.current!, {
                scale: 3, 
                useCORS: true,
                backgroundColor: '#000',
                logging: false
            });
            const image = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.href = image;
            link.download = `BK-Offer-${Date.now()}.jpg`;
            link.click();
            toast.success("Poster downloaded!");
        } catch (e) {
            toast.error("Failed to generate poster");
        }
    }, 300);
  };

  const activeElement = elements.find(e => e.id === activeId);

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-32">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" /> Poster
        </h1>
        <Button onClick={handleDownload} size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      {/* Background Selector */}
      <Card className="p-3 shadow-sm border-0 bg-white">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Backgrounds</p>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {PRESETS.map((bg, idx) => (
            <div 
              key={idx} onClick={() => setSelectedBg(bg)}
              className={`h-16 w-12 rounded-md cursor-pointer border-2 shrink-0 bg-muted transition-transform ${selectedBg === bg ? 'border-primary scale-105 shadow-md' : 'border-transparent'}`}
              style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ))}
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground bg-blue-50 text-blue-600 py-1.5 rounded-full border border-blue-100">
        💡 Double-tap any text to edit directly on screen
      </p>

      {/* ★ CANVAS CONTAINER ★ */}
      <div className="flex justify-center items-center">
          <div 
            ref={posterRef}
            className="relative bg-black shadow-2xl rounded-md ring-1 ring-border/50 touch-none"
            style={{
              width: '360px',  
              height: '640px', 
              backgroundImage: `url(${selectedBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden'
            }}
            onClick={(e) => {
               // ক্যানভাসের ফাঁকা জায়গায় ক্লিক করলে সিলেকশন हटে যাবে
               if (e.target === posterRef.current) {
                   setActiveId(null);
                   setEditingId(null);
               }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

            {/* Render Draggable Elements */}
            {elements.map((el) => (
               <DraggableText 
                  key={el.id} 
                  el={el} 
                  isActive={activeId === el.id}
                  isEditing={editingId === el.id}
                  onSelect={() => setActiveId(el.id)}
                  onEdit={() => setEditingId(el.id)}
                  onStopEdit={() => setEditingId(null)}
                  updateElement={updateElement}
                  setDevCoords={setDevCoords}
               />
            ))}
          </div>
      </div>

      {/* ★ FLOATING MOBILE TOOLBAR (Show only when text is selected) ★ */}
      {activeElement && !editingId && (
          <div className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border ring-1 ring-black/5 z-50 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                     <PaintBucket className="h-4 w-4 text-primary"/> Edit Style
                  </h3>
                  <button onClick={() => setActiveId(null)} className="text-muted-foreground hover:text-gray-900"><CheckCircle2 className="h-5 w-5"/></button>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                      <Label className="text-xs font-semibold w-12">Size</Label>
                      <Slider 
                          value={[activeElement.fontSize]} min={12} max={80} step={1}
                          onValueChange={(val) => updateElement(activeElement.id, { fontSize: val[0] })}
                          className="flex-1"
                      />
                      <span className="text-xs font-mono w-6">{activeElement.fontSize}</span>
                  </div>

                  <div className="flex items-center gap-4">
                      <Label className="text-xs font-semibold w-12">Color</Label>
                      <input 
                          type="color" value={activeElement.color}
                          onChange={(e) => updateElement(activeElement.id, { color: e.target.value })}
                          className="h-8 w-full flex-1 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <Input 
                          value={activeElement.color.toUpperCase()} 
                          onChange={(e) => updateElement(activeElement.id, { color: e.target.value })}
                          className="w-20 h-8 font-mono text-[10px] uppercase"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Developer Logs */}
      {devCoords && (
          <div className="mt-8 p-3 bg-slate-900 rounded-xl text-green-400 font-mono text-[10px] shadow-inner">
             <div className="flex items-center gap-2 text-white mb-1"><MousePointer2 className="h-3 w-3"/> Coordinates</div>
             ID: {devCoords.id} | X: {Math.round(devCoords.x)} | Y: {Math.round(devCoords.y)}
          </div>
      )}
    </div>
  );
}


// ★★★ Separate Component for Smooth Dragging & Inline Editing ★★★
function DraggableText({ el, isActive, isEditing, onSelect, onEdit, onStopEdit, updateElement, setDevCoords }: any) {
    // Separate Framer Motion values to prevent re-render locking
    const x = useMotionValue(el.x);
    const y = useMotionValue(el.y);
    const textRef = useRef<HTMLDivElement>(null);
    let tapTimer = useRef<number>(0);

    useEffect(() => {
        x.set(el.x);
        y.set(el.y);
    }, [el.x, el.y, x, y]);

    // Handle Double Tap Logic natively
    const handlePointerDown = () => {
        const now = Date.now();
        if (now - tapTimer.current < 300) {
            onEdit(); // Double tap triggered
        } else {
            onSelect(); // Single tap triggered
        }
        tapTimer.current = now;
    };

    // Auto focus when entering edit mode and put cursor at end
    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textRef.current);
            range.collapse(false); // cursor to the end
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing]);

    return (
        <motion.div
            style={{ x, y, position: 'absolute', top: 0, left: 0 }}
            drag={!isEditing} // Edit করার সময় Drag বন্ধ
            dragMomentum={false}
            onPointerDown={handlePointerDown}
            onDragEnd={() => {
                const finalX = x.get();
                const finalY = y.get();
                updateElement(el.id, { x: finalX, y: finalY });
                setDevCoords({ id: el.id, x: finalX, y: finalY });
            }}
            className="z-10"
        >
            {/* CSS Transform used to center the text exactly at the X,Y coordinate */}
            <div 
               className="relative"
               style={{ transform: 'translateX(-50%)' }} 
            >
                <div 
                    ref={textRef}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        updateElement(el.id, { text: e.currentTarget.innerText });
                        onStopEdit();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent new lines
                            textRef.current?.blur();
                        }
                    }}
                    className={`font-bold text-center whitespace-nowrap outline-none transition-all ${isActive && !isEditing ? 'ring-2 ring-primary ring-dashed ring-offset-4 ring-offset-transparent rounded-sm' : ''} ${isEditing ? 'bg-black/40 px-2 rounded-sm ring-2 ring-white' : ''}`}
                    style={{ 
                        fontSize: el.fontSize, 
                        color: el.color, 
                        textShadow: el.shadow ? '2px 3px 6px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.6)' : 'none',
                        cursor: isEditing ? 'text' : 'grab'
                    }}
                >
                    {el.text}
                </div>
            </div>
        </motion.div>
    );
}