'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useRouter } from 'next/navigation';

export default function MegaCampaignPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaign, setCampaign] = useState({
    isActive: false,
    homeBannerImage: '',
    pageBgImage: '',
    headingImage: '',
    orderLastTime: '',
    deliveryDate: '',
    categories: []
  });

  useEffect(() => {
    fetchCampaign();
  }, []);

  const fetchCampaign = async () => {
    try {
      const res = await fetch('/api/admin/mega-campaign');
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      toast.error('Failed to load mega campaign settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCampaign = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/mega-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Mega Campaign saved successfully!');
      } else {
        toast.error('Failed to save');
      }
    } catch (error) {
      toast.error('Error saving campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    setCampaign({
      ...campaign,
      categories: [...campaign.categories, { name: 'New Category', items: [] }]
    });
  };

  const removeCategory = (catIndex) => {
    const newCats = [...campaign.categories];
    newCats.splice(catIndex, 1);
    setCampaign({ ...campaign, categories: newCats });
  };

  const updateCategoryName = (catIndex, name) => {
    const newCats = [...campaign.categories];
    newCats[catIndex].name = name;
    setCampaign({ ...campaign, categories: newCats });
  };

  const addItemToCategory = (catIndex) => {
    const newCats = [...campaign.categories];
    newCats[catIndex].items.push({
      name: '',
      price: 0,
      description: '',
      image: ''
    });
    setCampaign({ ...campaign, categories: newCats });
  };

  const removeItemFromCategory = (catIndex, itemIndex) => {
    const newCats = [...campaign.categories];
    newCats[catIndex].items.splice(itemIndex, 1);
    setCampaign({ ...campaign, categories: newCats });
  };

  const updateItem = (catIndex, itemIndex, field, value) => {
    const newCats = [...campaign.categories];
    newCats[catIndex].items[itemIndex][field] = value;
    setCampaign({ ...campaign, categories: newCats });
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between bg-card p-6 rounded-xl shadow-sm border">
        <div>
          <Button variant="ghost" onClick={() => router.push('/admin/offers')} className="mb-2 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Offers
          </Button>
          <h1 className="text-2xl font-bold text-primary">Mega Campaign Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Design festival and special mega offer pages.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="font-bold">Status: {campaign.isActive ? 'Live' : 'Hidden'}</Label>
            <Switch 
              checked={campaign.isActive} 
              onCheckedChange={(c) => setCampaign({...campaign, isActive: c})} 
            />
          </div>
          <Button onClick={saveCampaign} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Main Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Shown on the app homepage</Label>
            <ImageUpload 
              value={campaign.homeBannerImage ? [campaign.homeBannerImage] : []}
              onChange={(urls) => setCampaign({...campaign, homeBannerImage: urls[0] || ''})}
              maxFiles={1}
              folder="campaign"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Page Background</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Background for the new page</Label>
            <ImageUpload 
              value={campaign.pageBgImage ? [campaign.pageBgImage] : []}
              onChange={(urls) => setCampaign({...campaign, pageBgImage: urls[0] || ''})}
              maxFiles={1}
              folder="campaign"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Heading Image</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Title image at the top</Label>
            <ImageUpload 
              value={campaign.headingImage ? [campaign.headingImage] : []}
              onChange={(urls) => setCampaign({...campaign, headingImage: urls[0] || ''})}
              maxFiles={1}
              folder="campaign"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Input type="date" value={campaign.deliveryDate} onChange={e => setCampaign({...campaign, deliveryDate: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Order Cutoff (Last Order Time)</Label>
            <Input type="datetime-local" value={campaign.orderLastTime} onChange={e => setCampaign({...campaign, orderLastTime: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Campaign Categories & Menu</h2>
          <Button onClick={addCategory} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {campaign.categories.map((cat, catIndex) => (
          <Card key={catIndex} className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center justify-between gap-4">
                <Input 
                  value={cat.name} 
                  onChange={e => updateCategoryName(catIndex, e.target.value)}
                  className="font-bold text-lg bg-white"
                  placeholder="Category Name (e.g. Maha Thali)"
                />
                <Button variant="destructive" size="icon" onClick={() => removeCategory(catIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 bg-muted/10">
              {cat.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg border shadow-sm">
                  <div className="w-full md:w-32 shrink-0">
                    <ImageUpload 
                      value={item.image ? [item.image] : []}
                      onChange={(urls) => updateItem(catIndex, itemIndex, 'image', urls[0] || '')}
                      maxFiles={1}
                      folder="campaign"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <Label>Item Name</Label>
                        <Input value={item.name} onChange={e => updateItem(catIndex, itemIndex, 'name', e.target.value)} placeholder="e.g. Chicken Thali" />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label>Price (₹)</Label>
                        <Input type="number" value={item.price} onChange={e => updateItem(catIndex, itemIndex, 'price', e.target.value)} placeholder="150" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Input value={item.description} onChange={e => updateItem(catIndex, itemIndex, 'description', e.target.value)} placeholder="Short description..." />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" size="icon" onClick={() => removeItemFromCategory(catIndex, itemIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button onClick={() => addItemToCategory(catIndex)} variant="secondary" className="w-full gap-2 border-dashed border-2 bg-transparent hover:bg-secondary/20">
                <Plus className="h-4 w-4" /> Add Menu Item to {cat.name}
              </Button>
            </CardContent>
          </Card>
        ))}
        {campaign.categories.length === 0 && (
          <div className="text-center p-10 border-2 border-dashed rounded-xl text-muted-foreground">
            No categories yet. Click "Add Category" to start building your mega offer page!
          </div>
        )}
      </div>
    </div>
  );
}
