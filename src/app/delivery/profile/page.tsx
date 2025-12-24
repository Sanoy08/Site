// src/app/delivery/profile/page.tsx

'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { LogOut, Wallet, ShieldCheck, BadgeIndianRupee } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DeliveryProfile() {
  const { user, token, logout } = useAuth(); // ★★★ Get Token
  const [stats, setStats] = useState({ cashInHand: 0, deliveredToday: 0 });
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
     if (!token) return;

     // ★★★ Add Authorization Header
     fetch('/api/delivery/stats', {
         headers: { 'Authorization': `Bearer ${token}` }
     })
     .then(res => res.json())
     .then(data => {
         if(data.success) setStats(data.stats);
     });
  }, [token]);

  const handleDepositRequest = async () => {
     if (!token) return;
     setDepositing(true);
     try {
         // ★★★ Add Authorization Header
         const res = await fetch('/api/delivery/deposit-request', { 
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
         });
         const data = await res.json();
         if(data.success) toast.success("Deposit request sent to Admin!");
         else toast.error(data.error);
     } catch(e) { toast.error("Error sending request"); }
     finally { setDepositing(false); }
  };

  return (
    <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center space-y-2">
        <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={user?.picture} />
            <AvatarFallback className="text-2xl font-bold bg-slate-200">DP</AvatarFallback>
        </Avatar>
        <div>
            <h2 className="font-bold text-xl text-slate-800">{user?.name}</h2>
            <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Verified Partner
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border-slate-100 shadow-sm">
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Delivered Today</p>
                  <p className="text-2xl font-black text-slate-800">{stats.deliveredToday}</p>
              </CardContent>
          </Card>
          <Card className="bg-white border-slate-100 shadow-sm">
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Trips</p>
                  <p className="text-2xl font-black text-slate-800">1</p>
              </CardContent>
          </Card>
      </div>

      <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Cash in Hand</p>
                    <h1 className="text-4xl font-bold mt-1">{formatPrice(stats.cashInHand)}</h1>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <BadgeIndianRupee className="w-6 h-6 text-green-400" />
                </div>
              </div>
              
              <div className="mt-6">
                  <Button 
                    onClick={handleDepositRequest} 
                    disabled={depositing || stats.cashInHand === 0}
                    className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12"
                  >
                      {depositing ? "Sending Request..." : "Deposit Cash to Admin"}
                  </Button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                      *Request admin to accept cash to clear balance
                  </p>
              </div>
          </CardContent>
      </Card>

      <Button variant="destructive" className="w-full h-12 rounded-xl font-bold shadow-sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}