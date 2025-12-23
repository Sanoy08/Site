'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Calendar, Clock, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth'; // ★★★ 1. Import useAuth

export default function DeliveryHistory() {
    const { token } = useAuth(); // ★★★ 2. Get Token
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return; // টোকেন না থাকলে কল করব না

        fetch('/api/delivery/history', {
            headers: {
                'Authorization': `Bearer ${token}` // ★★★ 3. Add Header
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) setHistory(data.orders);
        })
        .finally(() => setLoading(false));
    }, [token]); // টোকেন ডিপেন্ডেন্সি

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-slate-400">Loading history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-2">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Past Deliveries <Badge variant="secondary" className="rounded-full">{history.length}</Badge>
            </h2>

            {history.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400">No deliveries found yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((order) => (
                        <Card key={order._id} className="border-0 shadow-sm ring-1 ring-slate-100">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800">{order.Name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {order.deliveredAt ? format(new Date(order.deliveredAt), 'dd MMM, hh:mm a') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{formatPrice(order.FinalPrice)}</p>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-green-200 bg-green-50 text-green-700">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-2 rounded-lg flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-600 line-clamp-2">{order.Address}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}