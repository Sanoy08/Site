// src/app/admin/custom-invoice/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Download, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, cn } from '@/lib/utils';
import { generateCustomInvoice } from '@/lib/customInvoiceGenerator'; 

import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function CustomInvoicePage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        address: '', 
        orderNumber: Math.floor(100000 + Math.random() * 900000).toString(),
        date: new Date() 
    });

    const [items, setItems] = useState([{ id: '1', name: '', price: 0, quantity: 1 }]);
    const [discount, setDiscount] = useState<number>(0);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    // মেনু লিস্ট ফেচ করা
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/admin/products');
                const data = await res.json();
                if (data.success) setAvailableProducts(data.products);
            } catch (error) {
                console.error("Failed to fetch products");
            }
        };
        fetchProducts();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    // প্রোডাক্ট সিলেক্ট করলে অটোমেটিক প্রাইস সেট হবে
    const handleProductSelect = (id: string, productName: string) => {
        const selectedProduct = availableProducts.find(p => p.name === productName);
        if (selectedProduct) {
            setItems(items.map(item => 
                item.id === id ? { ...item, name: selectedProduct.name, price: selectedProduct.price } : item
            ));
        } else {
            setItems(items.map(item => item.id === id ? { ...item, name: productName } : item));
        }
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

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
                Items: items.filter(i => i.name).map(item => ({
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
        <div className="w-full pb-10 flex flex-col gap-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Custom Invoice</h1>
                    <p className="text-sm text-muted-foreground">Select from menu & create professional bills.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Customer Details */}
                <Card className="lg:col-span-1 shadow-sm h-fit border-0 bg-white">
                    <CardHeader className="border-b bg-muted/10 pb-4">
                        <CardTitle className="text-lg">Customer Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Customer Name" className="h-11 rounded-xl bg-muted/20" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address (Required)</Label>
                            <Input value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} placeholder="Full Address" className="h-11 rounded-xl bg-muted/20" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bill Date</Label>
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 rounded-xl bg-muted/20", !customerInfo.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {customerInfo.date ? format(customerInfo.date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="p-0 w-auto rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                    <Calendar mode="single" selected={customerInfo.date} onSelect={(date) => { if (date) setCustomerInfo({...customerInfo, date}); setIsCalendarOpen(false); }} initialFocus />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Items and Summary */}
                <Card className="lg:col-span-2 shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/10">
                        <CardTitle className="text-lg">Order Items</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1 rounded-full px-4 border-primary/30 text-primary bg-white hover:bg-primary/5">
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Select Dish</Label>
                                        <select 
                                            className="flex h-11 w-full rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                                            value={item.name}
                                            onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                        >
                                            <option value="">-- Choose a dish --</option>
                                            {availableProducts.map((p) => (
                                                <option key={p.id} value={p.name}>
                                                    {p.name} (₹{p.price})
                                                </option>
                                            ))}
                                            <option value="custom">-- Custom Item (Manual) --</option>
                                        </select>
                                        {/* Custom Item Input */}
                                        {item.name === "custom" && (
                                            <Input 
                                                placeholder="Enter Custom Item Name" 
                                                className="mt-2 h-11 rounded-xl border-primary/20 focus:ring-primary"
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-5 sm:col-span-4 space-y-1.5">
                                            <Label className="text-xs">Price (₹)</Label>
                                            <Input type="number" value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} className="h-11 rounded-xl" />
                                        </div>
                                        <div className="col-span-5 sm:col-span-4 space-y-1.5">
                                            <Label className="text-xs">Qty</Label>
                                            <Input type="number" value={item.quantity || ''} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="h-11 rounded-xl" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-4 flex items-end justify-end sm:justify-start pb-0.5">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive h-11 w-11 rounded-xl hover:bg-red-50">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 sm:p-6 bg-muted/10 border-t space-y-4 rounded-b-xl">
                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-dashed border-primary/20 shadow-sm">
                                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Discount (₹)</Label>
                                    <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-24 h-10 text-right rounded-lg bg-muted/20" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Received Amount (₹)</Label>
                                    <Input type="number" value={receivedAmount || ''} onChange={e => setReceivedAmount(Number(e.target.value))} className="w-24 h-10 text-right rounded-lg bg-muted/20" />
                                </div>
                                <div className="pt-3 mt-3 border-t flex justify-between items-center">
                                    <span className="text-base font-bold">Grand Total (Due)</span>
                                    <span className="text-2xl font-black text-primary">{formatPrice(finalPrice)}</span>
                                </div>
                            </div>

                            <Button onClick={handleDownloadInvoice} disabled={isGenerating} className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
                                {isGenerating ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Download className="mr-2 h-6 w-6" />}
                                Download Invoice
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
