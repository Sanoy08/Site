// src/app/admin/orders/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, ShoppingBag, Search, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPrice } from '@/lib/utils';
import { generateInvoice } from '@/lib/invoiceGenerator'; 
import { OrderDetailSheet } from '@/components/admin/OrderDetailSheet'; // ★ নতুন কম্পোনেন্ট
import { registerBackHandler } from '@/hooks/use-back-button'; // ★ ব্যাক হ্যান্ডলার

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
};

const STATUS_OPTIONS = ['Received', 'Cooking', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  
  // ★ ডিটেইলস শিট স্টেট
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // ★ URL থেকে অর্ডার আইডি ধরে শিট ওপেন করা
  useEffect(() => {
      const orderIdParam = searchParams.get('id');
      if (orderIdParam && orders.length > 0) {
          const matchedOrder = orders.find(o => o.OrderNumber === orderIdParam || o._id === orderIdParam);
          if (matchedOrder) {
              setSelectedOrder(matchedOrder);
          }
      } else {
          setSelectedOrder(null);
      }
  }, [searchParams, orders]);

  // ★ অর্ডার সিলেক্ট হ্যান্ডলার (URL আপডেট করে)
  const handleSelectOrder = (order: Order) => {
      router.push(`/admin/orders?id=${order.OrderNumber}`, { scroll: false });
  };

  // ★ ক্লোজ হ্যান্ডলার (URL ক্লিন করে)
  const handleCloseSheet = useCallback(() => {
      setSelectedOrder(null);
      router.push('/admin/orders', { scroll: false });
  }, [router]);

  // ★ ব্যাক বাটন হ্যান্ডলার (ক্যাপাসিটর অ্যাপের জন্য)
  useEffect(() => {
      if (selectedOrder) {
          registerBackHandler(handleCloseSheet);
      } else {
          registerBackHandler(null);
      }
      return () => registerBackHandler(null);
  }, [selectedOrder, handleCloseSheet]);


  // ফিল্টারিং লজিক
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
    
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, Status: newStatus } : o));

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
      e.stopPropagation(); // ক্লিক করলে যাতে শিট না খোলে
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

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
       
       {/* Header */}
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
                    placeholder="Search orders..." 
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
            // ★ কার্ডে ক্লিক করলে শিট খুলবে
            <Card 
                key={order._id} 
                className="border shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => handleSelectOrder(order)}
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
                    <div className="flex gap-2 items-center pt-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-1">
                            <Select defaultValue={order.Status} onValueChange={(val) => handleStatusChange(order._id, val)}>
                                <SelectTrigger className="w-full h-9 bg-muted/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button size="icon" variant="outline" className="h-9 w-9 text-blue-600 border-blue-200 bg-blue-50" onClick={(e) => handleDownloadInvoice(e, order)}>
                            <FileText className="h-4 w-4" />
                        </Button>
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
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleSelectOrder(order)}
                    >
                        <TableCell className="pl-6 font-mono font-medium text-sm">
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        </TableCell>
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => handleDownloadInvoice(e, order)}
                                >
                                    <Download className="h-4 w-4 mr-2" /> PDF
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleSelectOrder(order)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ★ Side Sheet Component ★ */}
      <OrderDetailSheet 
        order={selectedOrder} 
        open={!!selectedOrder} 
        onClose={handleCloseSheet} 
      />

    </div>
  )
}