// src/components/Chatbot.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ★★★ টাইপ আপডেট (slug যুক্ত করা হয়েছে) ★★★
type ProductSuggestion = {
  id: string;
  name: string;
  price: string | number;
  slug: string; // নতুন ফিল্ড
};

type Message = {
  role: 'user' | 'ai';
  content: string;
  products?: ProductSuggestion[];
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! 👋 Welcome to Bumba's Kitchen. Ki khete chan ajke?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })) 
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { 
            role: 'ai', 
            content: data.reply, 
            products: data.products || [] 
        }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Network error! Try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ★★★ নতুন হ্যান্ডলার: Slug দিয়ে রাউটিং ★★★
  const handleProductClick = (slug: string) => {
    setIsOpen(false);
    // সরাসরি ডিটেইলস পেজে নিয়ে যাবে
    router.push(`/menus/${slug}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Bumba's Assistant</h3>
                  <span className="text-[10px] text-white/80 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 text-white rounded-full h-8 w-8">
                <X size={18} />
              </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-gray-50 dark:bg-black/20 p-4 overflow-y-auto custom-scrollbar">
               <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      
                      <div
                        className={cn(
                          "max-w-[85%] px-4 py-3 text-sm shadow-sm",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* ★★★ Product Buttons ★★★ */}
                      {msg.role === 'ai' && msg.products && msg.products.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2 w-[85%]">
                            {msg.products.map((product, pIdx) => (
                                <button
                                    key={pIdx}
                                    // এখানে slug পাস করা হচ্ছে
                                    onClick={() => handleProductClick(product.slug)}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-primary/20 rounded-xl hover:border-primary hover:shadow-md transition-all group text-left w-full"
                                >
                                    <div>
                                        <p className="font-semibold text-xs text-slate-800 dark:text-white">{product.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">₹{product.price}</p>
                                    </div>
                                    <div className="bg-primary/10 p-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ChevronRight size={14} className="text-primary group-hover:text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="self-start bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 w-16">
                      <div className="flex gap-1 justify-center">
                         <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                         <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                         <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
               </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 border-gray-200 dark:border-gray-700 focus-visible:ring-primary rounded-xl"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-11 h-11 p-0 rounded-xl shadow-sm shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}