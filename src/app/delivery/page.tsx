// src/app/delivery/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Navigation, Phone, MapPin, Package, ArrowRight, IndianRupee, ScanLine, Wallet, Bike, ChevronRight, Check, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function DeliveryHome() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  // States for Modals
  const [matchedOrder, setMatchedOrder] = useState<any | null>(null); 
  const [viewOrder, setViewOrder] = useState<any | null>(null); 
  
  // Stats
  const [stats, setStats] = useState({ todayEarnings: 0, todayTrips: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery/todays-feed');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setStats({ todayEarnings: 0, todayTrips: data.orders.length });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // --- Handlers ---
  const handleVerify = async () => {
    if (otp.length < 4) return toast.error("Enter 4-digit OTP");
    setVerifying(true);
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      const res = await fetch('/api/delivery/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();

      if (data.success) {
        setMatchedOrder(data.order);
      } else {
        toast.error(data.error || "Invalid OTP");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setVerifying(false);
    }
  };

  const confirmDelivery = async () => {
    if (!matchedOrder) return;
    try {
        const res = await fetch('/api/delivery/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: matchedOrder._id })
        });
        const data = await res.json();
        if(data.success) {
            toast.success("Delivery Successful! 🚀");
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
            setMatchedOrder(null);
            setOtp('');
            fetchOrders(); 
        } else {
            toast.error(data.error);
        }
    } catch(e) { toast.error("Failed to confirm"); }
  };

  return (
    <div className="pb-32 space-y-6 px-4 pt-4 animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-full -mr-4 -mt-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Cash Collected</p>
            <h3 className="text-3xl font-black tracking-tight">₹{stats.todayEarnings}</h3>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-lg shadow-slate-100 border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 bg-blue-50 rounded-full -mr-4 -mt-4">
                <Bike className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Trips</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.todayTrips}</h3>
        </div>
      </div>

      {/* 2. Verification Module */}
      <div className="relative z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl opacity-30 blur-lg"></div>
        <Card className="relative border-0 bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/50">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">Verify Order</h2>
                        <p className="text-xs text-slate-500">Ask customer for 4-digit PIN</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full animate-pulse">
                        <ScanLine className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <Input 
                        placeholder="● ● ● ●" 
                        className="flex-1 text-center text-3xl tracking-[0.5em] font-bold h-16 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all shadow-inner"
                        maxLength={4}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
                        type="tel"
                        autoComplete="off"
                    />
                    <Button 
                        onClick={handleVerify} 
                        disabled={verifying || otp.length < 4} 
                        className="h-16 w-16 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl transition-all active:scale-95"
                    >
                        {verifying ? <RefreshCw className="animate-spin" /> : <ArrowRight size={24} />}
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 3. Orders Feed */}
      <div>
        <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="font-bold text-slate-800 text-lg">Active Tasks</h2>
            <Button variant="ghost" size="sm" onClick={fetchOrders} className="h-8 w-8 p-0 rounded-full hover:bg-slate-200">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
            </Button>
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl bg-white" />)}
            </div>
        ) : orders.length === 0 ? (
            <div className="text-center py-16">
                <div className="inline-block p-6 rounded-full bg-slate-100 mb-4">
                    <Package className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-600 font-bold">All caught up!</h3>
                <p className="text-slate-400 text-sm mt-1">Waiting for new orders...</p>
            </div>
        ) : (
            <div className="space-y-5">
                {orders.map((order: any) => (
                <div key={order._id} className="group relative bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-100 border border-slate-100 hover:shadow-xl transition-all">
                    {/* ★★★ Change: Always show Collect Cash Badge ★★★ */}
                    <div className="absolute top-5 right-5">
                        <Badge variant="secondary" className="bg-red-50 text-red-600 font-bold border-red-100">
                            Collect Cash
                        </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-6">
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{order.Name}</h3>
                        <p className="text-slate-500 text-xs font-mono">#{order.OrderNumber}</p>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-4 space-y-6 border-l-2 border-dashed border-slate-100 ml-2">
                        <div className="relative">
                            <div className="absolute -left-[23px] top-0 bg-white p-1 rounded-full border border-slate-100">
                                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Pick up</p>
                            <p className="text-sm font-semibold text-slate-700">Bumba's Kitchen HQ</p>
                        </div>
                        <div className="relative">
                             <div className="absolute -left-[23px] top-0 bg-blue-50 p-1 rounded-full border border-blue-100">
                                <MapPin className="w-3 h-3 text-blue-600" />
                            </div>
                            <p className="text-xs text-blue-500 font-bold uppercase mb-0.5">Drop off</p>
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{order.Address}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex flex-col">
                            {/* ★★★ Change: Always show 'To Collect' ★★★ */}
                            <span className="text-[10px] text-slate-400 font-bold uppercase">To Collect</span>
                            <span className="font-bold text-lg text-red-600">{formatPrice(order.FinalPrice)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl h-10 px-4 font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
                                onClick={() => setViewOrder(order)}
                            >
                                <FileText className="w-4 h-4 mr-2" /> Details
                            </Button>

                            <a href={`tel:${order.Phone}`}>
                                <Button size="sm" className="rounded-xl h-10 px-4 bg-slate-900 text-white font-bold shadow-lg active:scale-95 transition-transform">
                                    <Phone className="w-4 h-4 mr-2" /> Call
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>

      {/* 4. Slide to Confirm Dialog */}
      <Dialog open={!!matchedOrder} onOpenChange={() => setMatchedOrder(null)}>
        <DialogContent className="w-[90%] max-w-sm rounded-[2.5rem] p-0 overflow-hidden border-0 bg-white">
            <div className="p-8 pb-10 text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-2 animate-bounce">
                    <Package className="w-10 h-10 text-green-600" />
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Delivery Ready?</h2>
                    <p className="text-slate-500 text-sm mt-2 px-4">
                        Confirm that you have handed over the items to <span className="font-bold text-slate-900">{matchedOrder?.Name}</span>
                    </p>
                </div>

                {/* ★★★ Change: Always show Cash Collection Box ★★★ */}
                <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl my-4">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Cash to Collect</p>
                    <p className="text-4xl font-black text-red-600">{formatPrice(matchedOrder?.FinalPrice)}</p>
                </div>

                <SwipeButton onConfirm={confirmDelivery} />
                
                <button onClick={() => setMatchedOrder(null)} className="text-slate-400 text-xs font-bold hover:text-slate-600 mt-4">
                    CANCEL
                </button>
            </div>
        </DialogContent>
      </Dialog>

      {/* 5. New Order Details Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="w-[95%] max-w-md rounded-2xl">
            <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>#{viewOrder?.OrderNumber}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
                {viewOrder?.Instructions && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-2">
                        <Info className="w-5 h-5 text-yellow-600 shrink-0" />
                        <p className="text-xs text-yellow-700 font-medium">"{viewOrder.Instructions}"</p>
                    </div>
                )}

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Items</p>
                    {viewOrder?.Items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-white border w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold text-slate-700">
                                    {item.quantity}x
                                </div>
                                <span className="font-medium text-sm text-slate-800">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-600">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(viewOrder?.Subtotal)}</span>
                    </div>
                    {viewOrder?.Discount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                            <span>Discount</span>
                            <span>-{formatPrice(viewOrder?.Discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-slate-800 pt-2">
                        <span>Total to Collect</span>
                        <span>{formatPrice(viewOrder?.FinalPrice)}</span>
                    </div>
                    
                    {/* ★★★ Change: Force Cash display in details too ★★★ */}
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Payment Method</span>
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">Cash on Delivery</Badge>
                    </div>
                </div>

                <Button className="w-full font-bold bg-slate-900" onClick={() => setViewOrder(null)}>
                    Close
                </Button>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Swipe Button Component
function SwipeButton({ onConfirm }: { onConfirm: () => void }) {
    const [drag, setDrag] = useState(false);
    const [width, setWidth] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDrag = (e: any) => {
        if(!containerRef.current || confirmed) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        
        setWidth(offsetX);
        
        if (offsetX > rect.width * 0.9) {
            setConfirmed(true);
            setWidth(rect.width);
            onConfirm();
        }
    };

    const endDrag = () => {
        if (!confirmed) setWidth(0);
        setDrag(false);
    };

    return (
        <div 
            ref={containerRef}
            className={`relative h-16 w-full bg-slate-100 rounded-full overflow-hidden select-none touch-none ${confirmed ? 'bg-green-500' : ''}`}
            onTouchMove={handleDrag}
            onMouseMove={drag ? handleDrag : undefined}
            onTouchEnd={endDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
        >
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-sm uppercase tracking-widest transition-opacity duration-300 ${confirmed ? 'opacity-0' : 'text-slate-400 opacity-50'}`}>
                Slide to Complete
            </div>
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-white text-sm uppercase tracking-widest transition-opacity duration-300 ${confirmed ? 'opacity-100' : 'opacity-0'}`}>
                Completed!
            </div>
            <div 
                className="absolute top-1 left-1 bottom-1 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-75 ease-linear"
                style={{ width: Math.max(56, width), maxWidth: 'calc(100% - 8px)' }}
                onMouseDown={() => setDrag(true)}
                onTouchStart={() => setDrag(true)}
            >
                {confirmed ? (
                    <Check className="w-6 h-6 text-green-600" />
                ) : (
                    <div className="flex items-center gap-1">
                        <ChevronRight className="w-5 h-5 text-slate-900 ml-1" />
                        <ChevronRight className="w-5 h-5 text-slate-300 -ml-3" />
                    </div>
                )}
            </div>
        </div>
    );
}