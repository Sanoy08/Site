'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, LayoutTemplate, RotateCcw, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

// আপনার ব্যাকগ্রাউন্ড প্রিসেটগুলো এখানে দেবেন
const PRESETS = [
  '/posters/bg-1.jpg',
  '/posters/bg-2.jpg',
  '/posters/bg-3.jpg'
];

type TextElement = {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export default function PosterMaker() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(PRESETS[0]);
  
  // ★ ডিফল্ট টেক্সট এবং তাদের পজিশন (আপনি পরে এগুলো হার্ডকোড করবেন)
  const [elements, setElements] = useState<TextElement[]>([
    { id: 'date', label: 'Date', text: 'Tomorrow, 15 Aug', x: 50, y: 100, fontSize: 32, color: '#FFFFFF' },
    { id: 'menu', label: 'Menu Name', text: 'Chicken Biryani Combo', x: 50, y: 200, fontSize: 48, color: '#FFD700' },
    { id: 'price', label: 'Price', text: '₹199 Only', x: 50, y: 300, fontSize: 40, color: '#4CAF50' },
    { id: 'time', label: 'Order By', text: 'Last Order: 10:00 AM', x: 50, y: 400, fontSize: 24, color: '#FF5252' },
  ]);

  // ★ রিয়েলটাইম X, Y দেখানোর স্টেট
  const [activeDragCoords, setActiveDragCoords] = useState<{id: string, x: number, y: number} | null>(null);

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    
    // এক্সপোর্ট করার সময় কোয়ালিটি ঠিক রাখার জন্য
    const canvas = await html2canvas(posterRef.current, {
      scale: 2, 
      useCORS: true,
      backgroundColor: null
    });
    
    const image = canvas.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.href = image;
    link.download = `bumbas-kitchen-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" /> Poster Maker
        </h1>
        <Button onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4" /> Download Poster
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* ★ Controls Section (Left Side) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold border-b pb-2">Select Background</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PRESETS.map((bg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedBg(bg)}
                  className={`h-24 w-16 bg-gray-200 rounded cursor-pointer border-2 flex-shrink-0 ${selectedBg === bg ? 'border-primary' : 'border-transparent'}`}
                >
                  {/* এখানে আপনি <Image /> ব্যবহার করবেন */}
                  <div className="w-full h-full bg-slate-300 text-[10px] flex items-center justify-center text-center">BG {idx+1}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-semibold border-b pb-2">Edit Contents</h3>
            {elements.map((el) => (
              <div key={el.id} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{el.label}</Label>
                <Input 
                  value={el.text}
                  onChange={(e) => handleTextChange(el.id, e.target.value)}
                />
              </div>
            ))}
          </Card>

          {/* ★ Developer Tool: X/Y Axis Display */}
          <Card className="p-4 bg-primary/10 border-primary/20">
            <h3 className="font-semibold text-primary flex items-center gap-2 text-sm mb-3">
              <MousePointer2 className="h-4 w-4" /> Developer Coordinates
            </h3>
            {activeDragCoords ? (
              <div className="font-mono text-sm space-y-1">
                <p>Element: <span className="font-bold">{activeDragCoords.id}</span></p>
                <p className="text-green-700">X (Left): {Math.round(activeDragCoords.x)}px</p>
                <p className="text-blue-700">Y (Top): {Math.round(activeDragCoords.y)}px</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Drag any text on the poster to see coordinates.</p>
            )}
          </Card>
        </div>

        {/* ★ Canvas Section (Right Side) */}
        <div className="lg:col-span-2 flex justify-center bg-gray-100 p-8 rounded-xl border border-dashed border-gray-300 overflow-hidden relative">
            
            {/* Landscape Mode Warning (CSS only approach) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 md:hidden bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full shadow-sm font-medium z-50">
              Please rotate your phone to landscape for better editing!
            </div>

            {/* The Poster Container (Fixed Aspect Ratio 9:16 for Status) */}
            <div 
              ref={posterRef}
              className="relative bg-white overflow-hidden shadow-2xl"
              style={{
                width: '360px',  // Standard preview width
                height: '640px', // Standard preview height (9:16)
                backgroundImage: `url(${selectedBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {elements.map((el) => (
                <motion.div
                  key={el.id}
                  drag
                  dragMomentum={false}
                  onDrag={(event, info) => {
                    // Update developer coordinates in realtime
                    setActiveDragCoords({
                      id: el.id,
                      x: info.point.x,
                      y: info.point.y
                    });
                  }}
                  onDragEnd={(event, info) => {
                     // Save final position back to state
                     setElements(elements.map(item => 
                        item.id === el.id ? { ...item, x: info.point.x, y: info.point.y } : item
                     ));
                  }}
                  style={{
                    position: 'absolute',
                    top: el.y,
                    left: el.x,
                    fontSize: `${el.fontSize}px`,
                    color: el.color,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.6)', // Text shadow for readability over images
                    cursor: 'grab',
                    whiteSpace: 'nowrap'
                  }}
                  whileHover={{ scale: 1.05, outline: '2px dashed #4CAF50' }}
                  whileDrag={{ cursor: 'grabbing', scale: 1.1 }}
                >
                  {el.text}
                </motion.div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
}
