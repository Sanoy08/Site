// src/app/admin/custom-invoice/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Download, Loader2, Calendar as CalendarIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, cn } from '@/lib/utils';
import { generateCustomInvoice } from '@/lib/customInvoiceGenerator'; 

import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ★★★ SWIPEABLE CALENDAR LOGIC (From Checkout Page) ★★★
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

function SwipeableCalendar({ selected, onSelect, viewDate, setViewDate, onClose }: { selected?: Date, onSelect: (date?: Date) => void, viewDate: Date, setViewDate: (date: Date) => void, onClose: () => void }) {
  const [direction, setDirection] = useState(0);

  const handleMonthChange = (newMonthIndex: number) => {
    const newDate = setMonth(viewDate, newMonthIndex);
    setDirection(newMonthIndex > getMonth(viewDate) ? 1 : -1);
    setViewDate(newDate);
  };

  const handleYearChange = (newYear: string) => {
    const newDate = setYear(viewDate, parseInt(newYear));
    setViewDate(newDate);
  };

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setDirection(1); setViewDate(addMonths(viewDate, 1));
    } else if (info.offset.x > swipeThreshold) {
      setDirection(-1); setViewDate(subMonths(viewDate, 1));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white overflow-hidden">
        <div className="flex gap-2 w-full max-w-xs z-20 relative">
            <Select value={months[getMonth(viewDate)]} onValueChange={(month) => handleMonthChange(months.indexOf(month))}>
                <SelectTrigger className="w-[140px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>{months.map((month) => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={getYear(viewDate).toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[120px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
            </Select>
        </div>

        <div className="relative w-full overflow-hidden min-h-[350px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div key={viewDate.toISOString()} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={onDragEnd} className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y">
              <Calendar mode="single" month={viewDate} onMonthChange={setViewDate} selected={selected} onSelect={(date) => { onSelect(date); onClose(); }} initialFocus className="rounded-md border-0 w-full"
                  classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full", caption: "hidden", nav: "hidden", 
                      table: "w-full border-collapse space-y-1 select-none",
                      head_row: "flex w-full justify-between",
                      head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] h-9 flex items-center justify-center",
                      row: "flex w-full mt-2 justify-between",
                      cell: "h-10 w-10 text-center text-sm p-0 relative", 
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-xl transition-all data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg",
                      day_today: "bg-primary/5 text-primary font-bold border border-primary/20",
                      day_outside: "text-muted-foreground opacity-30",
                      day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed line-through",
                      day_hidden: "invisible",
                  }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="text-[10px] text-muted-foreground/60">Swipe left or right to change month</p>
    </div>
  );
}

export default function CustomInvoicePage() {
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Calendar States
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(new Date());
    
    // Dish Selector States
    const [dishSelectorOpen, setDishSelectorOpen] = useState<string | null>(null);
    const [dishSearchQuery, setDishSearchQuery] = useState("");

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

    // Fetch Products
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

    // Filter available products based on search query
    const filteredProducts = availableProducts.filter(p => p.name.toLowerCase().includes(dishSearchQuery.toLowerCase()));

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
                            {/* ★ SWIPEABLE CALENDAR TRIGGGER ★ */}
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-11 rounded-xl bg-muted/20 hover:bg-muted/40", !customerInfo.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                                        {customerInfo.date ? format(customerInfo.date, "MMM do, yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                    <DialogHeader className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                                        <DialogTitle className="text-center text-primary flex flex-col items-center gap-1">
                                            <span className="text-lg">Select Bill Date</span>
                                        </DialogTitle>
                                    </DialogHeader>
                                    <SwipeableCalendar viewDate={viewDate} setViewDate={setViewDate} selected={customerInfo.date} onSelect={(date) => { if (date) setCustomerInfo({...customerInfo, date}); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Items and Summary */}
                <Card className="lg:col-span-2 shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/10">
                        <CardTitle className="text-lg">Order Items</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1 rounded-full px-4 border-primary/30 text-primary bg-white hover:bg-primary/5 shadow-sm">
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-b">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 bg-white">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground">Select Dish</Label>
                                        
                                        {/* ★ CUSTOM DISH SELECTOR POPUP ★ */}
                                        <Dialog open={dishSelectorOpen === item.id} onOpenChange={(open) => { setDishSelectorOpen(open ? item.id : null); setDishSearchQuery(''); }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start h-12 text-left font-normal rounded-xl bg-muted/10 border-primary/20 hover:bg-primary/5", !item.name && "text-muted-foreground")}>
                                                    {item.name ? (item.name === 'custom' ? <span className="text-primary font-medium">Custom Item (Manual Entry)</span> : <span className="font-medium">{item.name}</span>) : "Tap to choose a dish..."}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[400px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
                                                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                                                        <Input placeholder="Search menu..." className="pl-9 h-10 rounded-xl bg-white border-0 shadow-sm focus-visible:ring-primary/20" value={dishSearchQuery} onChange={e => setDishSearchQuery(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 custom-scrollbar bg-white">
                                                    {filteredProducts.map(p => (
                                                        <div key={p.id} className="p-3 hover:bg-primary/5 rounded-xl cursor-pointer flex justify-between items-center transition-all active:scale-[0.98]" onClick={() => { handleProductSelect(item.id, p.name); setDishSelectorOpen(null); }}>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm text-foreground">{p.name}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1.5 rounded-lg border border-primary/20">₹{p.price}</span>
                                                        </div>
                                                    ))}
                                                    {filteredProducts.length === 0 && (
                                                        <p className="text-center text-sm text-muted-foreground py-4">No dishes found.</p>
                                                    )}
                                                    <div className="p-3 bg-muted/30 hover:bg-muted/50 rounded-xl cursor-pointer flex justify-between items-center text-primary mt-2 border border-dashed border-primary/30 transition-all active:scale-[0.98]" onClick={() => { handleProductSelect(item.id, 'custom'); setDishSelectorOpen(null); }}>
                                                        <span className="font-semibold text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Add Custom Item</span>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Custom Item Input (Shows only if Custom is selected) */}
                                        {item.name === "custom" && (
                                            <Input 
                                                placeholder="Type your custom item name here..." 
                                                className="mt-3 h-11 rounded-xl border-primary/30 focus:ring-primary bg-primary/5 font-medium animate-in slide-in-from-top-1"
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-12 gap-3 pt-2">
                                        <div className="col-span-5 sm:col-span-4 space-y-1.5">
                                            <Label className="text-xs font-medium">Price (₹)</Label>
                                            <Input type="number" value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', Number(e.target.value))} className="h-11 rounded-xl bg-muted/10" />
                                        </div>
                                        <div className="col-span-5 sm:col-span-4 space-y-1.5">
                                            <Label className="text-xs font-medium">Qty</Label>
                                            <Input type="number" value={item.quantity || ''} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="h-11 rounded-xl bg-muted/10 text-center" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-4 flex items-end justify-end sm:justify-start pb-0.5">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive h-11 w-11 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 sm:p-6 bg-muted/10 space-y-4 rounded-b-xl">
                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-dashed border-primary/20 shadow-sm">
                                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="font-medium text-foreground">{formatPrice(subtotal)}</span></div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm text-muted-foreground">Discount (₹)</Label>
                                    <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-24 h-10 text-right rounded-lg bg-red-50 text-red-600 border-red-100 focus:ring-red-200" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm text-muted-foreground">Received Amount (₹)</Label>
                                    <Input type="number" value={receivedAmount || ''} onChange={e => setReceivedAmount(Number(e.target.value))} className="w-24 h-10 text-right rounded-lg bg-green-50 text-green-600 border-green-100 focus:ring-green-200" />
                                </div>
                                <div className="pt-3 mt-3 border-t flex justify-between items-center">
                                    <span className="text-base font-bold text-foreground">Grand Total (Due)</span>
                                    <span className="text-2xl font-black text-primary">{formatPrice(finalPrice)}</span>
                                </div>
                            </div>

                            <Button onClick={handleDownloadInvoice} disabled={isGenerating} className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform active:scale-[0.99]">
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
