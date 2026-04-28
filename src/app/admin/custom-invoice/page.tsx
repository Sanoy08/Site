// src/app/admin/custom-invoice/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { generateCustomInvoice } from '@/lib/customInvoiceGenerator'; 

export default function CustomInvoicePage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        // ৬-ডিজিটের র‍্যান্ডম বিল নাম্বার
        orderNumber: Math.floor(100000 + Math.random() * 900000).toString(),
        date: new Date().toISOString().split('T')[0]
    });

    const [items, setItems] = useState([{ id: '1', name: '', price: 0, quantity: 1 }]);
    
    // নতুন স্টেট: ডিসকাউন্ট এবং রিসিভড অ্যামাউন্ট
    const [discount, setDiscount] = useState<number>(0);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
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
    const finalPrice = Math.max(0, subtotal - discount);

    const handleDownloadInvoice = async () => {
        if (!customerInfo.name || !customerInfo.phone) {
            toast.error("Please enter customer name and phone.");
            return;
        }

        setIsGenerating(true);
        try {
            const mockOrder = {
                OrderNumber: customerInfo.orderNumber,
                Name: customerInfo.name,
                Phone: customerInfo.phone,
                Address: customerInfo.address,
                Timestamp: new Date(customerInfo.date),
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
                    <p className="text-sm text-muted-foreground">Manually create professional bills for offline orders.</p>
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
                            <Label>Phone Number</Label>
                            <Input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="Phone Number" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address (Optional)</Label>
                            <Input value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} placeholder="Full Address" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bill Date</Label>
                            <Input type="date" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                        </div>
                    </CardContent>
                </Card>

                {/* Items and Summary */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Order Items</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1">
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/20 rounded-xl border relative animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex-grow space-y-1.5">
                                        <Label className="text-xs">Item Name</Label>
                                        <Input value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Enter dish name" />
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
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment & Summary Section */}
                        <div className="pt-4 border-t space-y-4">
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Subtotal</Label>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Discount (₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={discount || ''} 
                                        onChange={e => setDiscount(Number(e.target.value))} 
                                        className="w-32 text-right h-8" 
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Received Amount (₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={receivedAmount || ''} 
                                        onChange={e => setReceivedAmount(Number(e.target.value))} 
                                        className="w-32 text-right h-8" 
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between text-xl font-bold px-2">
                                <span>Grand Total :</span>
                                <span className="text-primary">{formatPrice(finalPrice)}</span>
                            </div>
                            <Button onClick={handleDownloadInvoice} disabled={isGenerating} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
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
