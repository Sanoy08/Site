// src/components/admin/OrderDetailSheet.tsx

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from '@/lib/utils';
import { 
    User, MapPin, Phone, Clock, FileText, X, 
    Calendar, CreditCard, ChevronRight, Truck, Utensils
} from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ✅ আমাদের ইমেজ অপটিমাইজেশন ইউটিলিটি
import { optimizeImageUrl } from '@/lib/imageUtils';

// ★★★ FIX: Removed intermediate statuses ★★★
const STATUS_OPTIONS = ['Pending Verification', 'Received', 'Delivered', 'Cancelled'];

type OrderDetailSheetProps = {
    order: any | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
    onDownloadInvoice: (order: any) => void;
};

export function OrderDetailSheet({ order, open, onClose, onStatusChange, onDownloadInvoice }: OrderDetailSheetProps) {
    if (!order) return null;

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Delivered': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '✅' };
            case 'Cancelled': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '❌' };
            case 'Received': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '📥' };
            case 'Pending Verification': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '🕒' };
        }
    };

    const statusStyle = getStatusStyles(order.Status);

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col bg-[#F9FAFB] border-l shadow-2xl">
                
                {/* --- HEADER (Sticky) --- */}
                <div className="bg-white px-6 py-5 border-b sticky top-0 z-20 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-gray-300">
                                    {order.OrderType.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">• {new Date(order.Timestamp).toLocaleString()}</span>
                            </div>
                            <SheetTitle className="text-2xl font-bold font-mono tracking-tight text-gray-900">
                                #{order.OrderNumber}
                            </SheetTitle>
                        </div>
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                                <X className="h-4 w-4" />
                            </Button>
                        </SheetClose>
                    </div>

                    {/* Status Updater Bar */}
                    <div className={`flex items-center justify-between p-1 pl-3 pr-1 rounded-xl border ${statusStyle.bg} ${statusStyle.border}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-base">{statusStyle.icon}</span>
                            <span className={`text-sm font-bold ${statusStyle.text}`}>{order.Status}</span>
                        </div>
                        <Select defaultValue={order.Status} onValueChange={(val) => onStatusChange(order._id, val)}>
                            <SelectTrigger className="h-9 w-[160px] bg-white border-0 shadow-sm rounded-lg text-xs font-semibold focus:ring-0">
                                <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-xs font-medium cursor-pointer">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* --- SCROLLABLE BODY --- */}
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        
                        {/* 1. Customer Details Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" /> Customer Details
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                            {order.Name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg leading-none">{order.Name}</p>
                                        <a href={`tel:${order.Phone}`} className="text-sm text-blue-600 hover:underline font-medium mt-1 inline-flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {order.Phone}
                                        </a>
                                    </div>
                                </div>
                                
                                <Separator className="bg-gray-100" />
                                
                                <div className="flex gap-3 items-start">
                                    <MapPin className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Delivery Address</p>
                                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                            {order.DeliveryAddress || order.Address}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Order Items */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <Utensils className="h-3.5 w-3.5" /> Order Summary
                                </h3>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-white border">{order.Items.length} Items</Badge>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {order.Items.map((item: any, idx: number) => (
                                    <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="h-16 w-16 bg-gray-100 rounded-xl relative overflow-hidden shrink-0 border border-gray-200">
                                            {item.image?.url ? (
                                                // ✅ অপটিমাইজড ইমেজ ব্যবহার করা হয়েছে
                                                <Image 
                                                    src={optimizeImageUrl(item.image.url)} 
                                                    alt={item.name} 
                                                    fill 
                                                    sizes="64px" // 16 * 4 = 64px
                                                    className="object-cover" 
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300 text-[10px]">No Image</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-gray-800 text-sm line-clamp-2 pr-2">{item.name}</p>
                                                <p className="font-bold text-gray-900 text-sm tabular-nums text-right">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">Qty: {item.quantity}</span>
                                                <span>@ {formatPrice(item.price)}/each</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Instructions & Meal Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Meal Time
                                </p>
                                <p className="text-sm font-semibold text-blue-900">
                                    {order.MealTime ? order.MealTime.toUpperCase() : 'INSTANT'}
                                </p>
                            </div>
                            <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl">
                                <p className="text-[10px] font-bold text-purple-600 uppercase mb-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Date
                                </p>
                                <p className="text-sm font-semibold text-purple-900">
                                    {order.PreferredDate ? new Date(order.PreferredDate).toLocaleDateString() : 'Today'}
                                </p>
                            </div>
                        </div>

                        {order.Instructions && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800 leading-relaxed relative">
                                <span className="absolute top-0 left-4 -translate-y-1/2 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-700 uppercase">
                                    Kitchen Note
                                </span>
                                {order.Instructions}
                            </div>
                        )}

                        {/* 4. Payment Bill (Receipt Style) */}
                        <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-gray-200 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>
                            
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">Payment Details</h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Item Total</span>
                                    <span className="font-medium tabular-nums">{formatPrice(order.Subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Charge</span>
                                    <span className="font-medium tabular-nums text-green-600">FREE</span>
                                </div>
                                {order.Discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount Applied</span>
                                        <span className="font-bold tabular-nums">- {formatPrice(order.Discount)}</span>
                                    </div>
                                )}
                                <Separator className="my-2 bg-gray-200" />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg text-gray-900">Grand Total</span>
                                    <span className="font-bold text-xl text-primary tabular-nums">{formatPrice(order.FinalPrice)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5" /> Payment Method
                                </span>
                                <Badge variant="outline" className="font-bold uppercase tracking-wide bg-gray-50 border-gray-200 text-gray-700">
                                    {order.OrderType}
                                </Badge>
                            </div>
                        </div>

                        {/* Bottom Spacer */}
                        <div className="h-10"></div>
                    </div>
                </ScrollArea>

                {/* --- FOOTER (Sticky) --- */}
                <div className="p-4 bg-white border-t sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Button 
                        className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]" 
                        onClick={() => onDownloadInvoice(order)}
                    >
                        <FileText className="mr-2 h-5 w-5" /> Download Invoice PDF
                    </Button>
                </div>

            </SheetContent>
        </Sheet>
    );
}