// src/app/admin/orders/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, RefreshCcw, ShoppingBag, Search, FileText, Download, 
  X, MapPin, Phone, User, Calendar, CreditCard, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPrice, cn } from '@/lib/utils';
import { generateInvoice } from '@/lib/invoiceGenerator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
  DeliveryCharge?: number;
};

const STATUS_OPTIONS = ['Received', 'Cooking', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  
  // ★ ডিটেইলস ভিউ স্টেট
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { user } = useAuth();

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        toast.error(data.error || "Failed to load orders.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== 'All') {
        result = result.filter(o => o.Status === statusFilter);
    }

    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(o => 
            o.OrderNumber.toLowerCase().includes(lowerQ) || 
            o.Name.toLowerCase().includes(lowerQ) ||
            o.Phone.includes(lowerQ)
        );
    }
    setFilteredOrders(result);
  }, [searchQuery, statusFilter, orders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    
    // Optimistic Update
    const updatedOrders = orders.map(o => o._id === orderId ? { ...o, Status: newStatus } : o);
    setOrders(updatedOrders);
    
    // যদি ডিটেইলস ভিউ খোলা থাকে, সেটাও আপডেট করা
    if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, Status: newStatus });
    }

    try {
        const res = await fetch('/api/admin/orders/status', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ orderId, status: newStatus })
        });

        if (res.ok) {
            toast.success(`Order marked as ${newStatus}`);
        } else {
            toast.error("Update failed!");
            fetchOrders();
        }
    } catch (error) {
        console.error(error);
        toast.error("Network error");
        fetchOrders();
    }
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
          case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
          case 'Cooking': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  const handleDownloadInvoice = (e: any, order: Order) => {
      e.stopPropagation(); // ক্লিক যাতে প্যারেন্টে না যায়
      try {
          if (typeof generateInvoice === 'function') {
            generateInvoice(order);
            toast.success("Invoice downloaded");
          } else {
            toast.error("Invoice generator not found");
          }
      } catch (e) {
          console.error(e);
          toast.error("Failed to generate invoice");
      }
  };

  // ★ অর্ডার ডিটেইলস ওপেন করা
  const openOrderDetails = (order: Order) => {
      setSelectedOrder(order);
      setIsSheetOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
       
       <div className="flex flex-col gap-6 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-primary" /> Orders
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Manage customer orders.</p>
            </div>
            <Button size="sm" onClick={fetchOrders} variant="outline" className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Order #, Name, Phone..." 
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {filteredOrders.map(order => (
            <Card 
                key={order._id} 
                className="border shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => openOrderDetails(order)}
            >
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-mono text-sm font-bold text-foreground">{order.OrderNumber}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.Timestamp).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(order.Status)} border font-normal`}>
                            {order.Status}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-b border-dashed">
                         <div>
                             <p className="text-sm font-semibold">{order.Name}</p>
                             <p className="text-xs text-muted-foreground">{order.Phone}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-sm font-bold text-primary">{formatPrice(order.FinalPrice)}</p>
                             <p className="text-xs text-muted-foreground">{order.OrderType}</p>
                         </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">{order.Items.length} Items</span>
                        <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50" onClick={(e) => handleDownloadInvoice(e, order)}>
                                <Download className="h-4 w-4" />
                            </Button>
                            <ChevronRight className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      {/* Desktop View: Table */}
      <Card className="hidden md:block overflow-hidden border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead className="pl-6">Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredOrders.map(order => (
                    <TableRow 
                        key={order._id} 
                        className="hover:bg-muted/20 transition-colors cursor-pointer group"
                        onClick={() => openOrderDetails(order)}
                    >
                        <TableCell className="pl-6 font-mono font-medium text-sm text-primary group-hover:underline">
                            {order.OrderNumber}
                        </TableCell>
                        <TableCell>
                            <div className="font-medium text-sm">{order.Name}</div>
                            <div className="text-xs text-muted-foreground">{order.Phone}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {new Date(order.Timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary" className="font-normal text-xs bg-background border">
                                {order.OrderType}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-sm">{formatPrice(order.FinalPrice)}</TableCell>
                        <TableCell>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Select 
                                    defaultValue={order.Status} 
                                    onValueChange={(val) => handleStatusChange(order._id, val)}
                                >
                                    <SelectTrigger className={`w-[130px] h-8 text-xs font-medium border-0 shadow-sm ${getStatusColor(order.Status)}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => handleDownloadInvoice(e, order)}
                            >
                                <Download className="h-4 w-4 mr-2" /> PDF
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ★★★ ORDER DETAILS SHEET (SIDE DRAWER) ★★★ */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[100%] sm:w-[540px] p-0 flex flex-col h-full bg-gray-50/50">
            {selectedOrder && (
                <>
                    <SheetHeader className="px-6 py-4 bg-white border-b sticky top-0 z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <SheetTitle className="text-xl font-mono font-bold text-primary">
                                    {selectedOrder.OrderNumber}
                                </SheetTitle>
                                <SheetDescription className="text-xs mt-1">
                                    Placed on {new Date(selectedOrder.Timestamp).toLocaleString()}
                                </SheetDescription>
                            </div>
                            <Badge className={cn("px-3 py-1 text-sm", getStatusColor(selectedOrder.Status))}>
                                {selectedOrder.Status}
                            </Badge>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-6">
                        <div className="space-y-6">
                            
                            {/* 1. Customer Details */}
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Customer Info
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Name</p>
                                        <p className="font-medium">{selectedOrder.Name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Phone</p>
                                        <p className="font-medium">{selectedOrder.Phone}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Delivery Address
                                        </p>
                                        <p className="font-medium mt-0.5">{selectedOrder.DeliveryAddress || selectedOrder.Address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Order Items */}
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-primary" /> Items Ordered
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.Items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start text-sm pb-3 border-b border-dashed last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {item.quantity} x {item.name}
                                                </p>
                                                {item.variant && (
                                                    <p className="text-xs text-muted-foreground">Var: {item.variant}</p>
                                                )}
                                            </div>
                                            <p className="font-bold text-gray-700">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Payment Summary */}
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" /> Payment Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(selectedOrder.Subtotal)}</span>
                                    </div>
                                    {selectedOrder.Discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>- {formatPrice(selectedOrder.Discount)}</span>
                                        </div>
                                    )}
                                    {selectedOrder.DeliveryCharge && selectedOrder.DeliveryCharge > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Delivery Fee</span>
                                            <span>+ {formatPrice(selectedOrder.DeliveryCharge)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-gray-100 my-2" />
                                    <div className="flex justify-between font-bold text-lg text-gray-900">
                                        <span>Total Amount</span>
                                        <span>{formatPrice(selectedOrder.FinalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Type: {selectedOrder.OrderType}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>

                    <SheetFooter className="p-4 bg-white border-t space-y-3 sm:space-y-0">
                        <div className="w-full flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Select 
                                    defaultValue={selectedOrder.Status} 
                                    onValueChange={(val) => handleStatusChange(selectedOrder._id, val)}
                                >
                                    <SelectTrigger className="w-full h-11">
                                        <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="flex-1 h-11" variant="outline" onClick={(e) => handleDownloadInvoice(e, selectedOrder)}>
                                <Download className="mr-2 h-4 w-4" /> Download Invoice
                            </Button>
                        </div>
                    </SheetFooter>
                </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  )
}