'use client';

import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Download, MapPin, Phone, User, Clock, Utensils, X } from 'lucide-react';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

type Order = {
  _id: string;
  OrderNumber: string;
  Name: string;
  Phone: string;
  Timestamp: string;
  Status: string;
  FinalPrice: number;
  Items: any[];
  OrderType: string;
  Address: string;
  DeliveryAddress?: string;
  Subtotal: number;
  Discount: number;
  Note?: string;
};

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
};

export function OrderDetailSheet({ order, open, onClose }: Props) {
  if (!order) return null;

  const handleDownload = () => {
      try {
          if (typeof generateInvoice === 'function') {
            generateInvoice(order);
            toast.success("Invoice downloaded");
          }
      } catch (e) { console.error(e); }
  };

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
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-gray-50/50">
        
        {/* Header */}
        <div className="p-6 bg-white border-b sticky top-0 z-10">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <SheetTitle className="text-xl font-bold font-mono text-primary">{order.OrderNumber}</SheetTitle>
                    <SheetDescription>{new Date(order.Timestamp).toLocaleString()}</SheetDescription>
                </div>
                <Badge variant="outline" className={`${getStatusColor(order.Status)}`}>{order.Status}</Badge>
            </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6 pb-20">
                
                {/* Items List */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-500 mb-3 flex items-center gap-2">
                        <Utensils className="h-4 w-4" /> Ordered Items ({order.Items.length})
                    </h3>
                    <div className="space-y-3">
                        {order.Items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm py-2 border-b border-dashed last:border-0">
                                <div className="flex gap-3">
                                    <span className="font-bold text-gray-500 w-4">{item.quantity}x</span>
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Customer Info</h3>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User className="h-4 w-4" /></div>
                        <div>
                            <p className="text-sm font-medium">{order.Name}</p>
                            <p className="text-xs text-muted-foreground">Customer</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Phone className="h-4 w-4" /></div>
                        <div>
                            <p className="text-sm font-medium">{order.Phone}</p>
                            <p className="text-xs text-muted-foreground">Contact</p>
                        </div>
                    </div>
                    {order.OrderType === 'Delivery' && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><MapPin className="h-4 w-4" /></div>
                            <div>
                                <p className="text-sm font-medium leading-tight">{order.DeliveryAddress || order.Address}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Delivery Address</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bill Summary */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-500 mb-3">Payment Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.Subtotal || order.FinalPrice)}</span>
                        </div>
                        {order.Discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>- {formatPrice(order.Discount)}</span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(order.FinalPrice)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t sticky bottom-0 z-10 grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={onClose}>
                Close
            </Button>
            <Button className="w-full gap-2" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Invoice
            </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}