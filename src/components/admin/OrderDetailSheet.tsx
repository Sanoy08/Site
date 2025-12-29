// src/components/admin/OrderDetailSheet.tsx

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from '@/lib/utils';
import { User, MapPin, Phone, Clock, FileText, X } from 'lucide-react';
import Image from 'next/image';

const STATUS_OPTIONS = ['Received', 'Cooking', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];

type OrderDetailSheetProps = {
    order: any | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
    onDownloadInvoice: (order: any) => void;
};

export function OrderDetailSheet({ order, open, onClose, onStatusChange, onDownloadInvoice }: OrderDetailSheetProps) {
    if (!order) return null;

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'Cooking': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col bg-gray-50/50">
                {/* Header */}
                <div className="p-6 bg-white border-b shadow-sm z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <SheetTitle className="text-xl font-bold font-mono text-primary">#{order.OrderNumber}</SheetTitle>
                            <SheetDescription>
                                Placed on {new Date(order.Timestamp).toLocaleString()}
                            </SheetDescription>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(order.Status)} px-3 py-1 text-xs font-bold`}>
                            {order.Status}
                        </Badge>
                    </div>
                </div>

                {/* Scrollable Body */}
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        
                        {/* Status Updater */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Update Status</label>
                            <Select defaultValue={order.Status} onValueChange={(val) => onStatusChange(order._id, val)}>
                                <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{order.Name}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {order.Phone}
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-gray-700">Delivery Address</p>
                                    <p className="text-muted-foreground leading-relaxed">{order.DeliveryAddress || order.Address}</p>
                                </div>
                            </div>
                            {order.Instructions && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                    <span className="font-bold">Note:</span> {order.Instructions}
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full block"></span> Order Items
                            </h3>
                            <div className="space-y-4">
                                {order.Items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="h-16 w-16 bg-gray-100 rounded-lg relative overflow-hidden shrink-0 border">
                                            {item.image?.url ? (
                                                <Image src={item.image.url} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300 text-xs">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name}</p>
                                                <p className="font-bold text-gray-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bill Details */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.Subtotal)}</span>
                            </div>
                            {order.Discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>- {formatPrice(order.Discount)}</span>
                                </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-lg text-gray-900">
                                <span>Total Amount</span>
                                <span>{formatPrice(order.FinalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Payment Mode</span>
                                <span className="uppercase font-semibold">{order.OrderType}</span>
                            </div>
                        </div>

                        {/* Meal Info */}
                        {order.MealTime && (
                            <div className="flex items-center justify-center gap-2 p-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                <Clock className="h-3 w-3" /> 
                                For {order.MealTime.toUpperCase()} • {new Date(order.PreferredDate).toDateString()}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 bg-white border-t z-10">
                    <Button className="w-full h-12 text-base shadow-lg shadow-primary/20" onClick={() => onDownloadInvoice(order)}>
                        <FileText className="mr-2 h-5 w-5" /> Download Invoice
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}