// src/app/delivery/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, RefreshCw, CheckCircle2, Navigation, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth'; // ★★★ 1. useAuth ইমপোর্ট

export default function DeliveryHome() {
  const { token } = useAuth(); // ★★★ 2. টোকেন নেওয়া হলো
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [matchedOrder, setMatchedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery/todays-feed');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerify = async () => {
    if (otp.length < 4) return toast.error("Enter 4-digit OTP");
    setVerifying(true);

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
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setVerifying(false);
    }
  };

  const confirmDelivery = async () => {
    if (!matchedOrder || !token) return; // টোকেন না থাকলে রিটার্ন
    setVerifying(true);
    try {
        const res = await fetch('/api/delivery/confirm', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ★★★ 3. অথরাইজেশন হেডার যোগ করা হলো
            },
            body: JSON.stringify({ orderId: matchedOrder._id })
        });
        const data = await res.json();
        if(data.success) {
            toast.success("Delivery Successful! 🚀");
            setMatchedOrder(null);
            setOtp('');
            fetchOrders(); 
        } else {
            toast.error(data.error || "Failed to confirm");
        }
    } catch(e) { toast.error("Failed to confirm"); }
    finally { setVerifying(false); }
  };

  const handleResendOtp = async (orderId: string) => {
      setResending(orderId);
      try {
          const res = await fetch('/api/delivery/resend-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId })
          });
          const data = await res.json();
          
          if (data.success) {
              toast.success("OTP sent to Customer! 📲");
          } else {
              toast.error(data.error || "Failed to send");
          }
      } catch (e) {
          toast.error("Network error");
      } finally {
          setResending(null);
      }
  };

  const groupedOrders = orders.reduce((acc, order) => {
    const area = order.DeliveryAddress ? order.DeliveryAddress.split(',')[0].trim() : 'Unknown';
    if (!acc[area]) acc[area] = [];
    acc[area].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Magic Verification Box */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <CardContent className="p-5 space-y-4 relative z-10">
          <div className="space-y-1">
             <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" /> 
                Instant Verify
             </h2>
             <p className="text-blue-100 text-xs opacity-90">Ask customer for OTP at doorstep</p>
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="● ● ● ●" 
              className="text-center text-2xl tracking-[0.5em] font-bold h-14 bg-white/20 border-white/30 text-white placeholder:text-white/40 focus-visible:ring-white/50 focus-visible:bg-white/30 transition-all rounded-xl"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="tel"
              autoComplete="off"
            />
          </div>
          <Button 
            onClick={handleVerify} 
            disabled={verifying || otp.length < 4} 
            className="w-full h-12 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {verifying ? <RefreshCw className="animate-spin w-5 h-5" /> : "Verify & Deliver"}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Feed */}
      <div className="flex justify-between items-center px-1">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Today's Route <Badge variant="secondary" className="rounded-full px-2">{orders.length}</Badge>
        </h2>
        <Button variant="ghost" size="icon" onClick={fetchOrders} className="h-8 w-8 rounded-full hover:bg-slate-100"><RefreshCw size={16}/></Button>
      </div>

      {loading ? (
        <div className="space-y-4">
            {[1,2].map(i => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>
            ))}
        </div>
      ) : (
        Object.entries(groupedOrders).map(([area, areaOrders]) => (
          <div key={area} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                <MapPin className="w-3 h-3" /> {area}
            </div>
            {areaOrders.map((order: any) => (
              <Card key={order._id} className="border-0 shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-800 text-base">{order.Name}</h3>
                        <a href={`tel:${order.Phone}`} className="bg-green-50 p-2 rounded-full text-green-600 active:bg-green-100 transition-colors">
                            <Phone size={18} />
                        </a>
                    </div>
                    <p className="text-sm text-slate-500 leading-snug line-clamp-2 mb-3">{order.Address}</p>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-wrap">
                            {order.PaymentMethod === 'COD' ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold">
                                    COD: {formatPrice(order.FinalPrice)}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-green-50 text-green-700">Paid Online</Badge>
                            )}
                            <Badge variant="outline" className="text-xs text-slate-500">#{order.OrderNumber.slice(-6)}</Badge>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleResendOtp(order._id)}
                            disabled={resending === order._id}
                        >
                            {resending === order._id ? (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                                <Send className="w-3 h-3 mr-1" />
                            )}
                            Resend OTP
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
      
      {orders.length === 0 && !loading && (
          <div className="text-center py-10 text-slate-400">
              <p>No active orders for today.</p>
          </div>
      )}

      {/* ★★★ 4. Confirmation Dialog (Updated for Accessibility) ★★★ */}
      <Dialog open={!!matchedOrder} onOpenChange={() => setMatchedOrder(null)}>
        <DialogContent className="w-[90%] rounded-2xl p-0 overflow-hidden gap-0">
            {/* এক্সেসিবিলিটির জন্য হিডেন হেডার */}
            <DialogHeader className="sr-only">
                <DialogTitle>Confirm Delivery</DialogTitle>
                <DialogDescription>
                    Please verify the order details and collect cash if applicable before confirming delivery.
                </DialogDescription>
            </DialogHeader>

            <div className="bg-slate-900 p-6 text-white text-center">
                <h2 className="text-xl font-bold">Confirm Delivery?</h2>
                <p className="text-slate-400 text-sm mt-1">Check details carefully</p>
            </div>
            
            <div className="p-6 space-y-4">
                {matchedOrder && (
                    <>
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-2xl text-slate-800">{matchedOrder.Name}</h3>
                            <p className="text-slate-500 text-sm">{matchedOrder.Address}</p>
                        </div>

                        {(!matchedOrder.paymentStatus || matchedOrder.PaymentMethod === 'COD') ? (
                            <div className="bg-red-50 border-2 border-red-100 p-4 rounded-xl text-center space-y-1 animate-pulse">
                                <p className="text-xs text-red-600 font-bold uppercase tracking-widest">Collect Cash</p>
                                <p className="text-3xl font-black text-red-600">{formatPrice(matchedOrder.FinalPrice)}</p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-center">
                                <p className="text-sm font-bold text-green-700">✅ Already Paid Online</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button variant="outline" className="h-12 rounded-xl font-bold" onClick={() => setMatchedOrder(null)}>
                                Cancel
                            </Button>
                            <Button className="h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white" onClick={confirmDelivery}>
                                Confirm
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}