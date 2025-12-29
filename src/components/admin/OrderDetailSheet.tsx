// src/components/admin/OrderDetailSheet.tsx

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice } from '@/lib/utils';
import { User, MapPin, Phone, Clock, CreditCard, UtensilsCrossed } from 'lucide-react';

interface OrderDetailSheetProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailSheet({ order, isOpen, onClose }: OrderDetailSheetProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
          case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
          case 'Cooking': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col bg-gray-50/50">
        
        {/* Header */}
        <SheetHeader className="p-6 bg-white border-b">
          <div className="flex justify-between items-start">
            <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    Order #{order.OrderNumber}
                </SheetTitle>
                <SheetDescription className="mt-1">
                    Placed on {new Date(order.Timestamp).toLocaleString()}
                </SheetDescription>
            </div>
            <Badge variant="outline" className={`${getStatusColor(order.Status)} px-3 py-1 text-xs font-semibold`}>
                {order.Status}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-8">
                
                {/* Items List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" /> Order Items
                    </h3>
                    <div className="bg-white rounded-xl border p-1 shadow-sm divide-y divide-gray-100">
                        {order.Items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 text-primary rounded-md flex items-center justify-center font-bold text-sm">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                        {/* যদি কোন ভেরিয়েন্ট বা এডন থাকে */}
                                        {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                                    </div>
                                </div>
                                <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Payment Summary
                    </h3>
                    <div className="bg-white rounded-xl border p-4 shadow-sm space-y-3 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.Subtotal || order.FinalPrice)}</span>
                        </div>
                        {order.DeliveryCharge > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span>{formatPrice(order.DeliveryCharge)}</span>
                            </div>
                        )}
                        {order.Discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-{formatPrice(order.Discount)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg pt-1">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(order.FinalPrice)}</span>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-xs text-center text-muted-foreground mt-2">
                            Payment Method: <span className="font-semibold text-foreground uppercase">{order.PaymentMethod || 'COD'}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="h-4 w-4" /> Customer Details
                    </h3>
                    <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{order.Name}</p>
                                <p className="text-xs text-muted-foreground">Customer Name</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-mono">{order.Phone}</p>
                                <p className="text-xs text-muted-foreground">Phone Number</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-snug">{order.DeliveryAddress || order.Address}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Delivery Address</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}