// src/app/admin/slider-images/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Images, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';
import { optimizeImageUrl } from '@/lib/imageUtils';

type Slide = {
  id: string;
  imageUrl: string;
  clickUrl: string;
  order: number;
};

export default function AdminSliderImagesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    imageUrl: '',
    clickUrl: '#',
    order: '0'
  });

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/slider-images');
      const data = await res.json();
      if (data.success) setSlides(data.slides);
    } catch (error) {
      toast.error('Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleSubmit = async () => {
    // ★★★ Fix: Remove Token Logic
    try {
      // ★★★ Fix: Remove Authorization Header
      const res = await fetch('/api/admin/slider-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        toast.success('Image added!');
        setIsDialogOpen(false);
        setFormData({ imageUrl: '', clickUrl: '#', order: '0' });
        fetchSlides();
      } else {
        toast.error('Failed to add image');
      }
    } catch (e) {
      toast.error('Error saving image');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    // ★★★ Fix: Remove Token Logic
    try {
        // ★★★ Fix: Remove Authorization Header
        const res = await fetch(`/api/admin/slider-images/${deleteId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            toast.success('Image deleted');
            fetchSlides();
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
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Images className="h-6 w-6 text-primary" /> Homepage Middle Slider
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage images for the slider below Trust Badges.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Image
        </Button>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Preview</TableHead>
                <TableHead className="hidden sm:table-cell">Link</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No images found.</TableCell>
                </TableRow>
              ) : (
                  slides.map((slide) => (
                    <TableRow key={slide.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="relative h-20 w-36 rounded-lg overflow-hidden border shadow-sm bg-muted">
                             {slide.imageUrl ? (
                                <Image 
                                    src={optimizeImageUrl(slide.imageUrl)} 
                                    alt="Slide" 
                                    fill 
                                    sizes="150px"
                                    className="object-cover" 
                                />
                             ) : (
                                <div className="flex items-center justify-center h-full w-full"><Images className="h-6 w-6 text-muted-foreground"/></div>
                             )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-sm text-blue-600 max-w-[200px] truncate">
                             <ExternalLink className="h-3 w-3" /> {slide.clickUrl}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">#{slide.order}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(slide.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Slider Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Image</Label>
                    <ImageUpload 
                        value={formData.imageUrl ? [formData.imageUrl] : []}
                        onChange={(urls) => setFormData({...formData, imageUrl: urls[0] || ''})}
                        maxFiles={1}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Click URL (Optional)</Label>
                    <Input value={formData.clickUrl} onChange={(e) => setFormData({...formData, clickUrl: e.target.value})} placeholder="/menus" />
                </div>
                <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} placeholder="0" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit}>Add Image</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Image?"
        description="This will remove this image from the home slider immediately."
      />

    </div>
  );
}