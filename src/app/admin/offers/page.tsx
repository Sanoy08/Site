// src/app/admin/offers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';

// ✅ আমাদের ইমেজ অপটিমাইজার ইমপোর্ট
import { optimizeImageUrl } from '@/lib/imageUtils';

type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  isSpecialOffer?: boolean;
  deliveryDate?: string;
  orderCutoffTime?: string;
  mealType?: string;
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    active: true,
    isSpecialOffer: false,
    deliveryDate: '',
    orderCutoffTime: '',
    mealType: 'lunch'
  });

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/offers');
      const data = await res.json();
      if (data.success) setOffers(data.offers);
    } catch (error) {
      toast.error('Failed to fetch offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleOpenDialog = (offer?: Offer) => {
    if (offer) {
        setEditingOffer(offer);
        setFormData({
            title: offer.title || '',
            description: offer.description || '',
            price: offer.price ? offer.price.toString() : '0',
            imageUrl: offer.imageUrl,
            active: offer.active,
            isSpecialOffer: offer.isSpecialOffer || false,
            deliveryDate: offer.deliveryDate || '',
            orderCutoffTime: offer.orderCutoffTime || '',
            mealType: offer.mealType || 'lunch'
        });
    } else {
        setEditingOffer(null);
        setFormData({ 
            title: '', 
            description: '', 
            price: '0', 
            imageUrl: '', 
            active: true,
            isSpecialOffer: false,
            deliveryDate: '',
            orderCutoffTime: '',
            mealType: 'lunch'
        });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.imageUrl) {
        toast.error("Please upload an offer image");
        return;
    }

    // ★★★ Fix: Remove Token Logic
    try {
      // ★★★ Fix: Remove Authorization Header
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        toast.success('Offer saved!');
        setIsDialogOpen(false);
        fetchOffers();
      } else {
        toast.error('Failed to save offer');
      }
    } catch (e) {
      toast.error('Error saving offer');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    // ★★★ Fix: Remove Token Logic
    try {
        // ★★★ Fix: Remove Authorization Header
        const res = await fetch(`/api/admin/offers/${deleteId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            toast.success('Offer deleted');
            fetchOffers();
        } else {
            toast.error('Delete failed');
        }
    } catch (e) { toast.error('Delete failed'); }
    finally { 
        setIsDeleting(false);
        setDeleteId(null); 
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" /> Special Offers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage combo offers and special promotions.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Offer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden border-0 shadow-md group hover:shadow-xl transition-all">
                <div className="relative h-64 w-full bg-muted">
                    {/* ✅ অপটিমাইজড ইমেজ ব্যবহার করা হয়েছে */}
                    <Image 
                        src={optimizeImageUrl(offer.imageUrl || PLACEHOLDER_IMAGE_URL)} 
                        alt={offer.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        <div className="bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                            {offer.active ? <span className="text-green-600">Active</span> : <span className="text-red-500">Inactive</span>}
                        </div>
                        {offer.isSpecialOffer && (
                            <div className="bg-amber-100 px-2 py-1 rounded text-xs font-bold text-amber-700 shadow-sm border border-amber-200">
                                Special Order ({offer.mealType === 'lunch' ? 'Lunch' : offer.mealType === 'dinner' ? 'Dinner' : 'Any'})
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute bottom-3 right-3">
                        <Button variant="destructive" size="icon" onClick={() => setDeleteId(offer.id)} className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="p-6 border-b bg-muted/20">
                <DialogTitle className="text-xl">{editingOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
                <div className="space-y-3">
                    <Label className="text-base font-medium">Offer Poster / Banner</Label>
                    <ImageUpload 
                        value={formData.imageUrl ? [formData.imageUrl] : []}
                        onChange={(urls) => setFormData({...formData, imageUrl: urls[0] || ''})}
                        maxFiles={1}
                        folder="offers"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Offer Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Weekend Special Thali" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input type="number" className="pl-7" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Describe the offer..." 
                        className="min-h-[100px]"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between flex-1">
                        <div className="space-y-0.5">
                            <Label>Make Orderable (Special Item)</Label>
                            <p className="text-xs text-muted-foreground">Allow users to order this directly</p>
                        </div>
                        <Switch checked={formData.isSpecialOffer} onCheckedChange={(c) => setFormData({...formData, isSpecialOffer: c})} />
                    </div>
                    <div className="h-px sm:h-auto sm:w-px bg-border"></div>
                    <div className="flex items-center justify-between flex-1">
                        <div className="space-y-0.5">
                            <Label>Active Status</Label>
                            <p className="text-xs text-muted-foreground">Show this offer on homepage</p>
                        </div>
                        <Switch checked={formData.active} onCheckedChange={(c) => setFormData({...formData, active: c})} />
                    </div>
                </div>

                {formData.isSpecialOffer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 border rounded-xl bg-slate-50/50">
                        <div className="space-y-2">
                            <Label>Delivery Date</Label>
                            <Input type="date" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Order Cutoff (Deadline)</Label>
                            <div className="flex gap-2">
                                <Input type="date" className="flex-1"
                                    value={formData.orderCutoffTime ? formData.orderCutoffTime.split('T')[0] : ''} 
                                    onChange={e => {
                                        const date = e.target.value;
                                        const time = formData.orderCutoffTime && formData.orderCutoffTime.includes('T') ? formData.orderCutoffTime.split('T')[1] : '00:00';
                                        setFormData({...formData, orderCutoffTime: date ? `${date}T${time}` : ''})
                                    }} 
                                />
                                <Input type="time" className="flex-1"
                                    value={formData.orderCutoffTime && formData.orderCutoffTime.includes('T') ? formData.orderCutoffTime.split('T')[1] : ''} 
                                    onChange={e => {
                                        const time = e.target.value;
                                        const date = formData.orderCutoffTime ? formData.orderCutoffTime.split('T')[0] : '';
                                        if (date) {
                                            setFormData({...formData, orderCutoffTime: `${date}T${time}`});
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Applicable Meal Time</Label>
                            <Select 
                                value={formData.mealType} 
                                onValueChange={(value) => setFormData({...formData, mealType: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Meal Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lunch">Lunch Only</SelectItem>
                                    <SelectItem value="dinner">Dinner Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter className="p-6 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="gap-2">{editingOffer ? 'Update Offer' : 'Save Offer'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Offer?"
        description="This offer will be permanently removed from the website."
      />
    </div>
  );
}