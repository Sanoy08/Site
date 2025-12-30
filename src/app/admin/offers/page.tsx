// src/app/admin/offers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
    price: '',
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
            title: offer.title || '',
            description: offer.description || '',
            price: offer.price ? offer.price.toString() : '0',
            imageUrl: offer.imageUrl,
            active: offer.active
        });
    } else {
        setEditingOffer(null);
        // ★★★ ডিফল্ট টেক্সট রিমুভ করা হয়েছে ★★★
        setFormData({ 
            title: '', 
            description: '', 
            price: '0', 
            imageUrl: '', 
            active: true 
        });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.imageUrl) {
        toast.error("Please upload an offer image");
        return;
    }

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
        <DialogContent className="w-[90%] rounded-2xl sm:max-w-[450px] p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-muted/10">
                <DialogTitle>{editingOffer ? 'Edit Offer Image' : 'Add New Offer'}</DialogTitle>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
                <div className="space-y-3">
                    <Label className="text-base font-medium">Offer Poster / Banner</Label>
                    <div className="bg-muted/20 p-2 rounded-xl border border-dashed">
                        <ImageUpload 
                            value={formData.imageUrl ? [formData.imageUrl] : []}
                            onChange={(urls) => setFormData({...formData, imageUrl: urls[0] || ''})}
                            maxFiles={1}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                    <div className="space-y-0.5">
                        <Label className="text-base">Active Status</Label>
                        <p className="text-xs text-muted-foreground">Show this offer on homepage</p>
                    </div>
                    <Switch checked={formData.active} onCheckedChange={(c) => setFormData({...formData, active: c})} />
                </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/10">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11">Cancel</Button>
                <Button onClick={handleSubmit} className="rounded-xl h-11 px-8">Save Offer</Button>
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