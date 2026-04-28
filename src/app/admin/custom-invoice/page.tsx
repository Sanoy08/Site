// src/app/admin/custom-invoice/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Download, Loader2, Calendar as CalendarIcon, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, cn } from '@/lib/utils';
import { generateCustomInvoice } from '@/lib/customInvoiceGenerator'; 

import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

// ★ Select কম্পোনেন্টগুলো ইম্পোর্ট করা হলো
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomInvoicePage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // মেনুর আইটেম স্টোর করার স্টেট
    const [storeProducts, setStoreProducts] = useState<any[]>([]);
    const [selectReset, setSelectReset] = useState(0); // ড্রপডাউন রিসেট করার ট্রিক
    
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        address: '', 
        orderNumber: Math.floor(100000 + Math.random() * 900000).toString(),
        date: new Date() 
    });

    const [items, setItems] = useState([{ id: '1', name: '', price: 0, quantity: 1 }]);
    const [discount, setDiscount] = useState<number>(0);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    // ★ পেজ লোড হলেই ডাটাবেস থেকে মেনুর সমস্ত আইটেম নিয়ে আসা
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (data.success) {
                    setStoreProducts(data.products);
                }
            } catch (error) {
                console.error("Failed to fetch store products", error);
            }
        };
        fetchProducts();
    }, []);

    // কাস্টম আইটেম অ্যাড করার ফাংশন
    const handleAddCustomItem = () => {
        setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
    };

    // ★ মেনু থেকে আইটেম অ্যাড করার ফাংশন
    const handleAddFromMenu = (productId: string) => {
        const product = storeProducts.find(p => p.id === productId);
        if (product) {
            // যদি আগে থেকেই একটা খালি আইটেম থাকে, তবে সেটাকে রিপ্লেস করে দেবো
            if (items.length === 1 && items[0].name === '' && items[0].price === 0) {
                setItems([{ id: Date.now().toString(), name: product.name, price: product.price, quantity: 1 }]);
            } else {
                setItems([...items, { id: Date.now().toString(), name: product.name, price: product.price, quantity: 1 }]);
            }
        }
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // ক্যালকুলেশন
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalPrice = Math.max(0, subtotal - discount - receivedAmount);

    const handleDownloadInvoice = async () => {
        if (!customerInfo.name || !customerInfo.address) {
            toast.error("Please enter both customer name and address.");
            return;
        }

        setIsGenerating(true);
        try {
            const mockOrder = {
                OrderNumber: customerInfo.orderNumber,
                Name: customerInfo.name,
                Phone: "N/A", 
                Address: customerInfo.address,
                Timestamp: customerInfo.date,
                Items: items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                Subtotal: subtotal,
                FinalPrice: finalPrice,
                Discount: discount,
                ReceivedAmount: receivedAmount,
                OrderType: 'Custom'
            };

            await generateCustomInvoice(mockOrder);
            toast.success("Invoice generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate invoice.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Custom Invoice Generator</h1>
                    <p className="text-sm text-muted-foreground">Create professional bills for offline orders.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Details */}
                <Card className="md:col-span-1 shadow-sm h-fit">
                    <CardHeader><CardTitle className="text-lg">Customer Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Customer Name" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Address (Required)</Label>
                            <Input value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} placeholder="Full Address" />
                        </div>

                        <div className="space-y-2">
                            <Label>Bill Date</Label>
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 rounded-xl", !customerInfo.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {customerInfo.date ? format(customerInfo.date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="p-0 w-auto rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                    <DialogHeader className="p-4 bg-primary/5 border-b">
                                        <DialogTitle className="text-center text-primary">Select Bill Date</DialogTitle>
                                    </DialogHeader>
                                    <Calendar
                                        mode="single"
                                        selected={customerInfo.date}
                                        onSelect={(date) => {
                                            if (date) setCustomerInfo({...customerInfo, date});
                                            setIsCalendarOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Items and Summary */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Order Items</CardTitle>
                        
                        {/* ★ নতুন অ্যাকশন বার */}
                        <div className="flex flex-wrap gap-2">
                            <Select 
                                key={selectReset} 
                                onValueChange={(val) => {
                                    handleAddFromMenu(val);
                                    setSelectReset(prev => prev + 1); // ড্রপডাউন আগের অবস্থায় ফেরানোর জন্য
                                }}
                            >
                                <SelectTrigger className="w-[180px] h-9 bg-primary/5 border-primary/20 text-primary font-medium hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <UtensilsCrossed className="w-3.5 h-3.5" />
                                        <span className="truncate">Add from Menu</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {storeProducts.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">Loading...</div>
                                    ) : (
                                        storeProducts.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} - ₹{p.price}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>

                            <Button variant="outline" size="sm" onClick={handleAddCustomItem} className="gap-1 h-9">
                                <Plus className="h-4 w-4" /> Custom Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/20 rounded-xl border relative">
                                    <div className="flex-grow space-y-1.5">
                                        <Label className="text-xs">Item Name</Label>
                                        <Input value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Dish name" />
                                    </div>
                                    <div className="w-full sm:w-24 space-y-1.5">
                                        <Label className="text-xs">Price</Label>
                                        <Input type="number" value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} />
                                    </div>
                                    <div className="w-full sm:w-20 space-y-1.5">
                                        <Label className="text-xs">Qty</Label>
                                        <Input type="number" value={item.quantity || ''} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Subtotal</Label>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Discount (₹)</Label>
                                    <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-32 text-right h-8" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Received Amount (₹)</Label>
                                    <Input type="number" value={receivedAmount || ''} onChange={e => setReceivedAmount(Number(e.target.value))} className="w-32 text-right h-8" />
                                </div>
                            </div>

                            <div className="flex justify-between text-xl font-bold px-2">
                                <span>Grand Total (Due) :</span>
                                <span className="text-primary">{formatPrice(finalPrice)}</span>
                            </div>
                            <Button onClick={handleDownloadInvoice} disabled={isGenerating} className="w-full h-12 text-lg shadow-lg">
                                {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                                Generate & Download Bill
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
