// src/components/Chatbot.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ChevronRight, Sparkles, Tag, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; 

type ProductSuggestion = {
  id: string;
  name: string;
  price: string | number;
  slug: string;
};

type Message = {
  role: 'user' | 'ai';
  content: string;
  products?: ProductSuggestion[];
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth(); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const pathname = usePathname();

  useEffect(() => {
    const savedChat = localStorage.getItem('bumbas_chat_history');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      const userName = user?.name || null;
      const greeting = userName 
        ? `Hello ${userName}! 👋 Welcome back to Bumba's Kitchen. Ki khete chan ajke?` 
        : "Hello! 👋 Welcome to Bumba's Kitchen. Ki khete chan ajke?";
      setMessages([{ role: 'ai', content: greeting }]);
    }
  }, [user?.name]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('bumbas_chat_history', JSON.stringify(messages));
    }
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // SCROLL LOCK LOGIC
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClearChat = () => {
    localStorage.removeItem('bumbas_chat_history');
    const userName = user?.name || null;
    const greeting = userName 
        ? `Hello ${userName}! 👋 Notun kore shuru kora jak.` 
        : "Chat cleared! 🧹 How can I help you now?";
    setMessages([{ role: 'ai', content: greeting }]);
  };

  const handleSend = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim()) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: messageToSend } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: newMessages.map(m => ({ role: m.role, content: m.content })),
          userName: user?.name || "Guest"
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

  const handleProductClick = (slug: string) => {
    setIsOpen(false);
    router.push(`/menus/${slug}`);
  };

  const quickChips = [
    { label: "Today's Special 🍗", text: "Ajker special ki ache?", icon: Sparkles },
    { label: "Offers 🏷️", text: "Kono offer ache ekhon?", icon: Tag },
    { label: "Track Order 📦", text: "Track my order BK-", icon: Package },
  ];

  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed bottom-24 z-[100] flex flex-col gap-4 w-full sm:w-auto sm:right-6 pointer-events-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 pointer-events-auto"
            />

            {/* CHAT WINDOW */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-[92vw] sm:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px] pointer-events-auto self-center sm:self-end z-50 relative"
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
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleClearChat} 
                    title="Clear Chat"
                    className="hover:bg-white/20 text-white rounded-full h-8 w-8"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 text-white rounded-full h-8 w-8">
                    <X size={18} />
                  </Button>
                </div>
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

                        {msg.role === 'ai' && msg.products && msg.products.length > 0 && (
                          <div className="mt-2 flex flex-col gap-2 w-[85%]">
                              {msg.products.map((product, pIdx) => (
                                  <button
                                      key={pIdx}
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
              <div className="p-3 bg-white dark:bg-slate-900 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type here..."
                  className="flex-1 border-gray-200 dark:border-gray-700 focus-visible:ring-primary rounded-xl h-10"
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-10 h-10 p-0 rounded-xl shadow-sm shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              
               {/* Quick Chips */}
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto custom-scrollbar">
                  {quickChips.map((chip, i) => (
                      <button
                          key={i}
                          onClick={() => {
                              if (chip.label.includes("Track")) {
                                  setInput(chip.text); 
                              } else {
                                  handleSend(chip.text);
                              }
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-primary hover:text-white transition-colors text-slate-600 dark:text-slate-300"
                      >
                          <chip.icon size={12} />
                          {chip.label}
                      </button>
                  ))}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        // ★★★ FIX: Removed hover opacity, added opacity-100 and solid bg-primary ★★★
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 pointer-events-auto self-end mr-6 sm:mr-0 z-[60] opacity-100 hover:shadow-2xl"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}