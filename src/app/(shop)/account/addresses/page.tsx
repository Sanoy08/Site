// src/app/(shop)/account/addresses/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MoreVertical, Plus, MapPin, Loader2, Trash2, Pencil, Home, Briefcase, Search, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';
import dynamic from 'next/dynamic';
import { useDebounce } from '@/hooks/use-debounce';
import { formatPrice } from '@/lib/utils';

const MapPicker = dynamic(() => import('@/components/shop/MapPicker'), { 
    ssr: false, 
    loading: () => <div className="h-[250px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Loading Map...</div> 
});

const PRESET_LABELS = ["Home", "Work", "Office", "Mom's Place", "Other"];

type Address = {
    id: string;
    name: string;
    address: string;
    isDefault: boolean;
    coordinates?: { lat: number; lng: number } | null;
    distanceText?: string;
    deliveryFee?: number;
};

export default function AccountAddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Updated FormData with Delivery Info
    const [formData, setFormData] = useState({ 
        name: '', 
        address: '', 
        isDefault: false,
        coordinates: null as { lat: number, lng: number } | null,
        distanceText: '',
        deliveryFee: 0
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [outOfRange, setOutOfRange] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 500);

    const fetchAddresses = async () => {
        try {
            const res = await fetch('/api/user/addresses');
            const data = await res.json();
            if (data.success) setAddresses(data.addresses);
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAddresses(); }, []);

    useEffect(() => {
        const fetchLocations = async () => {
            if (!debouncedSearch || debouncedSearch.length < 3) { setSuggestions([]); return; }
            try {
                const res = await fetch(`/api/location/search?q=${debouncedSearch}`);
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            } catch (e) {}
        };
        fetchLocations();
    }, [debouncedSearch]);

    const handleLocationSelect = async (lat: number, lng: number, addressStr?: string) => {
        try {
            toast.loading("Calculating delivery distance...", { id: 'dist' });
            setOutOfRange(false);
            
            if (!addressStr) {
                const revRes = await fetch(`/api/location/reverse?lat=${lat}&lon=${lng}`);
                const revData = await revRes.json();
                addressStr = revData.address;
            }
            
            const res = await fetch(`/api/location/distance?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            
            if(data.success) {
                const distKm = data.distanceValue / 1000;
                let fee = 0;
                
                if(distKm > 50) {
                    setOutOfRange(true);
                    toast.error(`Distance: ${data.distanceText}. Outside 50km delivery range!`, { id: 'dist', duration: 4000 });
                    setFormData(prev => ({ ...prev, coordinates: { lat, lng }, address: addressStr as string, distanceText: data.distanceText, deliveryFee: 0 }));
                    return;
                }

                if(distKm > 2) {
                    const extraKm = Math.ceil(distKm - 2);
                    fee = 50 + (extraKm * 10);
                }
                
                setFormData(prev => ({ ...prev, coordinates: { lat, lng }, address: addressStr as string, distanceText: data.distanceText, deliveryFee: fee }));
                toast.success(`Distance: ${data.distanceText}. Delivery Fee: ${fee === 0 ? 'FREE' : formatPrice(fee)}`, { id: 'dist' });
            } else {
                toast.error("Failed to calculate distance.", { id: 'dist' });
            }
        } catch(e) {
            toast.error("Error calculating distance.", { id: 'dist' });
        }
    };

    const handleSelectSearchItem = (item: any) => {
        setSearchQuery(item.main_text); 
        setShowSuggestions(false);
        handleLocationSelect(item.lat, item.lon, item.description);
    };

    const handleOpenDialog = (address?: Address) => {
        if (address) {
            setEditingId(address.id);
            setFormData({
                name: address.name, address: address.address, isDefault: address.isDefault,
                coordinates: address.coordinates || null, distanceText: address.distanceText || '', deliveryFee: address.deliveryFee || 0
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', address: '', isDefault: addresses.length === 0, coordinates: null, distanceText: '', deliveryFee: 0 });
        }
        setSearchQuery("");
        setOutOfRange(false);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.address || !formData.coordinates) {
            toast.error("Label, Address and Map Location are required");
            return;
        }
        if(outOfRange) {
            toast.error("Location is outside our 50km delivery range.");
            return;
        }

        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch('/api/user/addresses', {
                method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (res.ok) {
                toast.success(editingId ? "Address updated!" : "Address saved!");
                setIsDialogOpen(false);
                fetchAddresses();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save address");
            }
        } catch (error) { toast.error("Error saving address"); } 
        finally { setIsSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/user/addresses?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) { toast.success("Address deleted"); fetchAddresses(); } 
            else toast.error("Failed to delete");
        } catch (error) { toast.error("Network error"); } 
        finally { setIsDeleting(false); setDeleteId(null); }
    };

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('home')) return <Home className="h-5 w-5" />;
        if (n.includes('work') || n.includes('office')) return <Briefcase className="h-5 w-5" />;
        return <MapPin className="h-5 w-5" />;
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-24">
            <Card className="border-none shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6 flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl"><MapPin className="h-5 w-5 text-primary" /> My Addresses</CardTitle>
                        <CardDescription className="mt-1">Manage delivery locations & check delivery fees.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()} size="sm" className="hidden sm:flex"><Plus className="h-4 w-4 mr-2" /> Add New</Button>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 space-y-4">
                    {addresses.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">No saved addresses found.</p>
                            <Button onClick={() => handleOpenDialog()} variant="link" className="mt-2">Add your first address</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {addresses.map(addr => (
                                <div key={addr.id} onClick={() => handleOpenDialog(addr)} className="group relative bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{getIcon(addr.name)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-lg text-foreground truncate">{addr.name}</h3>
                                                    {addr.isDefault && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 h-5 px-1.5 shrink-0">Default</Badge>}
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{addr.address}</p>
                                                
                                                {/* Delivery Info Display */}
                                                <div className="mt-3 flex items-center gap-3">
                                                    {addr.distanceText && (
                                                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{addr.distanceText}</span>
                                                    )}
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${addr.deliveryFee === 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {addr.deliveryFee === 0 ? 'Free Delivery' : `Delivery: ${formatPrice(addr.deliveryFee || 0)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-8 w-8 -mr-2"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(addr)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(addr.id); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="fixed bottom-24 right-6 sm:hidden z-40"><Button onClick={() => handleOpenDialog()} size="icon" className="h-14 w-14 rounded-full shadow-xl bg-primary"><Plus className="h-6 w-6" /></Button></div>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[90%] md:w-full rounded-2xl sm:max-w-md p-0 gap-0 overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="p-6 border-b bg-muted/10"><DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle></DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-3">
                            <Label className="font-bold">Label</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Home, Office" className="h-11 bg-gray-50/50" />
                            <div className="flex flex-wrap gap-2 pt-1">
                                {PRESET_LABELS.map((label) => (
                                    <Badge key={label} variant="outline" className={`cursor-pointer px-3 py-1.5 text-xs rounded-full transition-colors ${formData.name.toLowerCase() === label.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"}`} onClick={() => setFormData({...formData, name: label})}>{label}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center"><Label className="font-bold">Locate on Map</Label></div>
                            <div className="relative z-20">
                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search area (e.g. Janai...)" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if(e.target.value.length === 0) setShowSuggestions(false); }} className="pl-9 h-11 bg-gray-50/50" />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                                        {suggestions.map((item: any) => (
                                            <div key={item.place_id} onClick={() => handleSelectSearchItem(item)} className="p-3 hover:bg-muted/50 cursor-pointer flex items-start gap-3 border-b"><MapPin className="h-4 w-4 text-primary mt-1 shrink-0" /><div><p className="text-sm font-medium">{item.main_text}</p><p className="text-xs text-muted-foreground">{item.secondary_text}</p></div></div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl overflow-hidden border border-gray-200"><MapPicker onLocationSelect={handleLocationSelect} selectedLocation={formData.coordinates} /></div>

                            {formData.distanceText && (
                                <div className={`p-3 rounded-xl border flex items-start gap-2 ${outOfRange ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Delivery Fee: {outOfRange ? 'N/A' : (formData.deliveryFee === 0 ? 'FREE' : formatPrice(formData.deliveryFee))}</p>
                                        <p className="text-xs mt-0.5">{outOfRange ? `Distance: ${formData.distanceText}. Too far for delivery.` : `Distance: ${formData.distanceText}`}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Detailed Address</Label>
                            <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="House No, Street, Landmark..." className="min-h-[90px] resize-none bg-gray-50/50" />
                        </div>
                        
                        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                            <div className="space-y-0.5"><Label className="text-base font-semibold">Set as Default</Label><p className="text-xs text-muted-foreground">Auto select for checkout.</p></div>
                            <Switch checked={formData.isDefault} onCheckedChange={(c) => setFormData({...formData, isDefault: c})} />
                        </div>
                    </div>
                    
                    <DialogFooter className="p-6 border-t bg-muted/10 flex-row justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || outOfRange || !formData.coordinates} className="gap-2 rounded-xl">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? 'Update' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={confirmDelete} isDeleting={isDeleting} title="Delete Address?" description="Are you sure you want to delete this address?" />
        </div>
    );
}