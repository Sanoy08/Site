// src/app/admin/offers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';

type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
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
    price: '0', // ডিফল্ট ভ্যালু 0 রাখা হলো যাতে ব্যাকএন্ড এরর না দেয়
    imageUrl: '',
    active: true,
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
            title: offer.title,
            description: offer.description,
            price: offer.price.toString(),
            imageUrl: offer.imageUrl,
            active: offer.active
        });
    } else {
        setEditingOffer(null);
        // প্রাইস ডিফল্ট হিসেবে '0' সেট করা হলো
        setFormData({ title: '', description: '', price: '0', imageUrl: '', active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/admin/offers/${deleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
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
    <div className="space-y-8 max-w-[1600px] mx-auto pb-24">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" /> Special Offers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage homepage banner offers.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Offer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
            <Card 
                key={offer.id} 
                className="overflow-hidden border-0 shadow-md group hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleOpenDialog(offer)}
            >
                <div className="relative h-48 w-full bg-muted">
                    <Image 
                        src={offer.imageUrl || PLACEHOLDER_IMAGE_URL} 
                        alt={offer.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        unoptimized={true}
                    />
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                        {offer.active ? <span className="text-green-600">Active</span> : <span className="text-red-500">Inactive</span>}
                    </div>
                </div>
                <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold line-clamp-1">{offer.title}</h3>
                        {/* Price hidden in UI card as well since input is removed, or kept if needed */}
                        {/* <span className="text-primary font-bold text-lg">{formatPrice(offer.price)}</span> */}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 min-h-[40px]">{offer.description}</p>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(offer.id);
                            }} 
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                        >
                            <Trash2 className="h-4 w-4 mr-1"/> Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ★★★ FIX: w-[90%] & rounded-2xl added for Mobile Card Style (Not Edge-to-Edge) ★★★ */}
        <DialogContent className="w-[90%] rounded-2xl sm:max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-muted/10">
                <DialogTitle>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
            </DialogHeader>
            
            <div className="p-6 space-y-5">
                <div className="space-y-2">
                    <Label>Offer Image</Label>
                    <ImageUpload 
                        value={formData.imageUrl ? [formData.imageUrl] : []}
                        onChange={(urls) => setFormData({...formData, imageUrl: urls[0] || ''})}
                        maxFiles={1}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Weekend Special" className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Offer details..." />
                </div>
                
                {/* ★★★ Price Input Removed From UI ★★★ */}
                {/* Field is still in state (formData.price) for database compatibility */}

                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-0.5">
                        <Label className="text-base">Active Status</Label>
                        <p className="text-xs text-muted-foreground">Show this offer on homepage.</p>
                    </div>
                    <Switch checked={formData.active} onCheckedChange={(c) => setFormData({...formData, active: c})} />
                </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/10">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingOffer ? 'Update Offer' : 'Create Offer'}</Button>
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