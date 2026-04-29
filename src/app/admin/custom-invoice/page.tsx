// src/app/admin/custom-invoice/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Download, Loader2, Calendar as CalendarIcon, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, cn } from '@/lib/utils';
import { generateCustomInvoice } from '@/lib/customInvoiceGenerator'; 

import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

    const [items, setItems] = useState([{ id: '1', name: '', price: 0, quantity: 1, productId: '' }]);
    const [discount, setDiscount] = useState<number>(0);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    // ১. মেনু লিস্ট ফেচ করা
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
        setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1, productId: '' }]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleProductSelect = (id: string, product: any) => {
        setItems(items.map(item => 
            item.id === id ? { ...item, name: product.name, price: product.price, productId: product.id } : item
        ));
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalPrice = Math.max(0, subtotal - discount - receivedAmount);

    const handleDownloadInvoice = async () => {
        if (!customerInfo.name || !customerInfo.address) {
            toast.error("Please enter customer name and address.");
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
            toast.error("Failed to generate invoice.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
            <div className="flex items-center gap-3 pt-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold font-headline">Custom Bill Generator</h1>
                    <p className="text-xs text-muted-foreground">Quickly select items from menu & generate bill.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Details */}
                <Card className="md:col-span-1 shadow-sm border-0 bg-muted/30">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs ml-1">Full Name</Label>
                            <Input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Customer Name" className="rounded-xl border-muted-foreground/20 h-11" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs ml-1">Address (Required)</Label>
                            <Input value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} placeholder="Full Address" className="rounded-xl border-muted-foreground/20 h-11" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs ml-1">Bill Date</Label>
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 rounded-xl border-muted-foreground/20", !customerInfo.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {customerInfo.date ? format(customerInfo.date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="p-0 w-auto rounded-3xl overflow-hidden border-0 shadow-2xl">
                                    <Calendar mode="single" selected={customerInfo.date} onSelect={(date) => { if (date) setCustomerInfo({...customerInfo, date}); setIsCalendarOpen(false); }} initialFocus />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Section */}
                <Card className="md:col-span-2 shadow-lg border-0">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Order Items</CardTitle>
                        <Button variant="secondary" size="sm" onClick={handleAddItem} className="gap-1 rounded-full h-8 px-4 bg-primary/10 text-primary hover:bg-primary/20">
                            <Plus className="h-4 w-4" /> Add Dish
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Dish</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between h-12 rounded-xl border-muted-foreground/20 font-medium", !item.name && "text-muted-foreground")}>
                                                    {item.name || "Search menu item..."}
                                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search dish name..." className="h-12" />
                                                    <CommandList>
                                                        <CommandEmpty>No item found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableProducts.map((product) => (
                                                                <CommandItem
                                                                    key={product.id}
                                                                    value={product.name}
                                                                    onSelect={() => handleProductSelect(item.id, product)}
                                                                    className="h-11 cursor-pointer"
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", item.productId === product.id ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{product.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">₹{product.price} • {product.category.name}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-1 space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Price</Label>
                                            <Input type="number" value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} className="h-11 rounded-xl border-muted-foreground/20 font-bold" />
                                        </div>
                                        <div className="col-span-1 space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</Label>
                                            <Input type="number" value={item.quantity || ''} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="h-11 rounded-xl border-muted-foreground/20 font-bold" />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-end pb-0.5">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive h-11 w-11 rounded-xl hover:bg-red-50">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary & Buttons */}
                        <div className="p-6 bg-muted/10 space-y-4">
                            <div className="space-y-3 p-4 bg-white rounded-2xl border border-dashed border-primary/30 shadow-inner">
                                <div className="flex justify-between text-xs text-muted-foreground"><span>Items Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Extra Discount (₹)</Label>
                                    <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-24 h-8 text-right rounded-lg bg-green-50/50 border-green-200" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-primary">Paid Amount (₹)</Label>
                                    <Input type="number" value={receivedAmount || ''} onChange={e => setReceivedAmount(Number(e.target.value))} className="w-24 h-8 text-right rounded-lg bg-primary/5 border-primary/20" />
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase">Balance Due</span>
                                    <span className="text-xl font-black text-primary">{formatPrice(finalPrice)}</span>
                                </div>
                            </div>

                            <Button onClick={handleDownloadInvoice} disabled={isGenerating} className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform">
                                {isGenerating ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Download className="mr-2 h-6 w-6" />}
                                Generate Invoice
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}