// src/app/delivery/profile/page.tsx

'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { LogOut, Wallet, ShieldCheck, Star, ChevronRight, Settings, Clock, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DeliveryProfile() {
  const { user, logout } = useAuth(); // ★ token রিমুভ করা হয়েছে
  const [stats, setStats] = useState({ cashInHand: 0, deliveredToday: 0 });
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Data
  const loadData = async () => {
     if(!user) return; // ইউজার চেক
     
     // 1. Get Stats (Cash in Hand) - কুকি অটোমেটিক যাবে
     fetch('/api/delivery/stats')
        .then(res => res.json())
        .then(data => { if(data.success) setStats(data.stats); });

     // 2. Check Pending Request - কুকি অটোমেটিক যাবে
     fetch('/api/delivery/deposit-request')
        .then(res => res.json())
        .then(data => { if(data.success) setPendingRequest(data.pendingRequest); });
  };

  useEffect(() => { loadData(); }, [user]);

  const handleDepositRequest = async () => {
     if (!user) return;
     setLoading(true);
     try {
         const res = await fetch('/api/delivery/deposit-request', { 
            method: 'POST',
            // Headers নেই, কুকি যাবে
         });
         const data = await res.json();
         if(data.success) {
             toast.success("Deposit Request Sent!");
             loadData(); // Refresh to show pending state
         } else {
             toast.error(data.error || "Failed");
         }
     } catch(e) { toast.error("Error sending request"); }
     finally { setLoading(false); }
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header */}
      <div className="flex items-center gap-4 pt-4">
        <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-2 ring-blue-100">
            <AvatarImage src={user?.picture} />
            <AvatarFallback className="bg-slate-200 font-bold text-xl">DP</AvatarFallback>
        </Avatar>
        <div>
            <h2 className="font-bold text-2xl text-slate-800">{user?.name || 'Partner'}</h2>
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 w-fit px-2 py-0.5 rounded-full mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </div>
        </div>
      </div>

      {/* Wallet Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cash Floating</p>
                    <h1 className="text-4xl font-bold mt-1 tracking-tight">{formatPrice(stats.cashInHand)}</h1>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                    <Wallet className="w-6 h-6 text-green-400" />
                </div>
              </div>
              
              {/* Dynamic Button State */}
              {pendingRequest ? (
                  <div className="w-full bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                      <span className="font-bold text-yellow-400">Approval Pending: {formatPrice(pendingRequest.amount)}</span>
                  </div>
              ) : (
                  <Button 
                    onClick={handleDepositRequest} 
                    disabled={loading || stats.cashInHand <= 0}
                    className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 rounded-xl border-0 transition-all active:scale-95"
                  >
                      {loading ? "Processing..." : "Deposit Cash to Admin"}
                  </Button>
              )}
              
              {stats.cashInHand === 0 && !pendingRequest && (
                  <p className="text-center text-xs text-slate-500 mt-2">No cash to deposit.</p>
              )}
          </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                  <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">4.9</p>
              <p className="text-xs text-slate-400 font-medium">Rating</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-purple-50 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                  <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.deliveredToday}</p>
              <p className="text-xs text-slate-400 font-medium">Orders Today</p>
          </div>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
          {[
              { label: 'Delivery History', icon: ChevronRight },
              { label: 'Help & Support', icon: ChevronRight },
              { label: 'Terms & Conditions', icon: ChevronRight },
          ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <item.icon className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
          ))}
      </div>

      <Button variant="ghost" className="w-full text-red-500 font-bold hover:bg-red-50 hover:text-red-600 h-12 rounded-xl" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}