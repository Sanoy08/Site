// src/app/admin/notifications/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Bell, Plus, Trash2, History, Zap, Image as ImageIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog'; // ★ Import

// Image Optimizer Helper
const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_600,q_auto:low,f_auto/');
  }
  return url;
};

export default function AdminNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State (Default timeSlot is 'anytime')
  const [formData, setFormData] = useState({ title: '', message: '', image: '', link: '', timeSlot: 'anytime' });

  // Load Data
  const fetchData = async () => {
      const res = await fetch('/api/admin/notifications/presets');
      const data = await res.json();
      if (data.success) {
          setPresets(data.presets);
          setHistory(data.history);
      }
  };

  useEffect(() => { fetchData(); }, []);

  // 1. Manual Send Handler
  const handleManualSend = async () => {
    if (!formData.title || !formData.message) return toast.error("Title & Message required");
    setIsLoading(true);
    const optimizedData = { ...formData, image: getOptimizedNotificationImage(formData.image) };

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(optimizedData),
      });
      toast.success('Broadcast sent!');
      setFormData({ title: '', message: '', image: '', link: '', timeSlot: 'anytime' });
      fetchData(); // Refresh history
    } catch (e) { toast.error('Failed to send'); } 
    finally { setIsLoading(false); }
  };

  // 2. Save Preset Handler
  const handleSavePreset = async () => {
    if (!formData.title || !formData.message) return toast.error("Title & Message required");
    setIsLoading(true);
    const optimizedData = { ...formData, image: getOptimizedNotificationImage(formData.image) };

    try {
      await fetch('/api/admin/notifications/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizedData),
      });
      toast.success('Preset Saved to Auto-Pilot!');
      setFormData({ title: '', message: '', image: '', link: '', timeSlot: 'anytime' });
      fetchData();
    } catch (e) { toast.error('Failed to save'); } 
    finally { setIsLoading(false); }
  };

  // 3. Confirm Delete Preset
  const confirmDeletePreset = async () => {
      if(!deleteId) return;
      setIsDeleting(true);
      await fetch(`/api/admin/notifications/presets?id=${deleteId}`, { method: 'DELETE' });
      toast.success("Preset removed");
      fetchData();
      setIsDeleting(false);
      setDeleteId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
       <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-2">
                <Bell className="h-8 w-8 text-primary" /> Notification Center
            </h1>
            <p className="text-muted-foreground">Manage automated alerts & manual broadcasts.</p>
        </div>

        <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-gray-100 p-1">
                <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Manual Send</TabsTrigger>
                <TabsTrigger value="presets" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Auto Pilot (Presets)</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
            </TabsList>

            {/* TAB 1: MANUAL SEND */}
            <TabsContent value="manual">
                <Card className="border-0 shadow-lg mt-6">
                    <CardHeader><CardTitle>Send Instant Broadcast</CardTitle><CardDescription>Send a message to everyone right now.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <NotificationForm formData={formData} setFormData={setFormData} showTimeSlot={false} />
                        <Button className="w-full h-12 text-lg" onClick={handleManualSend} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-5 w-5" />} Send Now
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 2: AUTO PILOT PRESETS */}
            <TabsContent value="presets">
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    {/* Add New Preset */}
                    <Card className="border-0 shadow-lg h-fit">
                        <CardHeader className="bg-amber-50 rounded-t-xl pb-4">
                            <CardTitle className="text-amber-800 flex items-center gap-2"><Zap className="h-5 w-5"/> Add New Preset</CardTitle>
                            <CardDescription>System will pick based on time of day.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* ★ TimeSlot Option Visible Here ★ */}
                            <NotificationForm formData={formData} setFormData={setFormData} showTimeSlot={true} />
                            <Button className="w-full h-12 text-lg bg-amber-600 hover:bg-amber-700" onClick={handleSavePreset} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Plus className="mr-2 h-5 w-5" />} Save to Auto-Pilot
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Saved Presets List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-700">Active Presets ({presets.length})</h3>
                        {presets.length === 0 && <p className="text-muted-foreground text-sm italic">No presets added yet.</p>}
                        
                        <div className="space-y-3 h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                            {presets.map((preset) => (
                                <div key={preset._id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                                    <div className="flex gap-4">
                                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                                            {preset.image ? (
                                                <Image src={preset.image} alt="img" fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon className="h-6 w-6"/></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* Time Badge */}
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                                    preset.timeSlot === 'lunch' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    preset.timeSlot === 'dinner' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                    preset.timeSlot === 'morning' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                    {preset.timeSlot || 'Anytime'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 leading-tight">{preset.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{preset.message}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setDeleteId(preset._id)}
                                        className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* TAB 3: HISTORY */}
            <TabsContent value="history">
                <Card className="border-0 shadow-lg mt-6">
                    <CardHeader><CardTitle>Broadcast History</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-0">
                            {history.map((log: any, idx) => (
                                <div key={idx} className="flex items-start gap-4 py-4 border-b last:border-0">
                                    <div className={`p-2 rounded-full ${log.type === 'AUTO_CRON' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {log.type === 'AUTO_CRON' ? <Zap className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900">{log.title}</h4>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 rounded-full">
                                                {new Date(log.sentAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{log.message}</p>
                                        {log.type === 'AUTO_CRON' && log.targetSlot && (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                                                Auto Pilot: {log.targetSlot}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-center text-muted-foreground py-10">No notifications sent yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* ★★★ Using Custom Component ★★★ */}
        <DeleteConfirmationDialog 
            open={!!deleteId} 
            onOpenChange={() => setDeleteId(null)}
            onConfirm={confirmDeletePreset}
            isDeleting={isDeleting}
            title="Delete Preset?"
            description="This preset will no longer be used for auto-notifications."
        />
    </div>
  );
}

function NotificationForm({ formData, setFormData, showTimeSlot }: any) {
    return (
        <>
            <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g., Hungry? 😋"
                    className="font-bold"
                />
            </div>
            <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                    placeholder="Write a catchy message..."
                />
            </div>
            
            {showTimeSlot && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-primary"><Clock className="h-4 w-4"/> Target Time Slot</Label>
                    <Select 
                        value={formData.timeSlot} 
                        onValueChange={(val) => setFormData({...formData, timeSlot: val})}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lunch-preorder">Lunch Pre-order (12 AM)</SelectItem>
                            <SelectItem value="lunch">Lunch Reminder (6 AM)</SelectItem>
                            <SelectItem value="dinner-preorder">Dinner Pre-order (12 PM)</SelectItem>
                            <SelectItem value="dinner">Dinner Reminder (6 PM)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select when this message should be blasted.</p>
                </div>
            )}

            <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload 
                    value={formData.image ? [formData.image] : []}
                    onChange={(urls) => setFormData({...formData, image: urls[0] || ''})}
                    maxFiles={1}
                />
            </div>
            <div className="space-y-2">
                <Label>Link (e.g. /menus)</Label>
                <Input value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} />
            </div>
        </>
    )
}