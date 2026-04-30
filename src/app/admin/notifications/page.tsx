// src/app/admin/notifications/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Bell, Plus, Trash2, History, Zap, Image as ImageIcon, Clock, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';
import { optimizeImageUrl } from '@/lib/imageUtils';
import { FloatingInput } from '@/components/ui/floating-input';

export default function AdminNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', message: '', image: '', link: '', timeSlot: 'anytime' });

  const fetchData = async () => {
      const res = await fetch('/api/admin/notifications/presets');
      const data = await res.json();
      if (data.success) {
          setPresets(data.presets);
          setHistory(data.history);
      }
  };

  useEffect(() => { fetchData(); }, []);

  const handleManualSend = async () => {
    if (!formData.title || !formData.message) return toast.error("Title & Message required");
    setIsLoading(true);
    const optimizedData = { ...formData };

    try {
      await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizedData),
      });
      toast.success('Broadcast sent successfully!');
      setFormData({ title: '', message: '', image: '', link: '', timeSlot: 'anytime' });
      fetchData(); 
    } catch (e) { toast.error('Failed to send'); } 
    finally { setIsLoading(false); }
  };

  const handleSavePreset = async () => {
    if (!formData.title || !formData.message) return toast.error("Title & Message required");
    setIsLoading(true);
    const optimizedData = { ...formData };

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
    <div className="w-full pb-10 flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3.5 bg-primary/10 rounded-full text-primary shadow-inner">
                    <Bell className="h-7 w-7" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Push Notifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage automated alerts & send live manual broadcasts.</p>
                </div>
            </div>
        </div>

        <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-muted/40 p-1.5 mb-6">
                <TabsTrigger value="manual" className="rounded-xl h-full font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Manual Send</TabsTrigger>
                <TabsTrigger value="presets" className="rounded-xl h-full font-medium data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all">Auto Pilot</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl h-full font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">History</TabsTrigger>
            </TabsList>

            {/* TAB 1: MANUAL SEND */}
            <TabsContent value="manual" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-5">
                            <CardTitle className="flex items-center gap-2 text-primary"><Send className="h-5 w-5"/> Live Broadcast</CardTitle>
                            <CardDescription>Instantly push a message to all user devices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <NotificationForm formData={formData} setFormData={setFormData} showTimeSlot={false} />
                            <Button className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform active:scale-[0.99]" onClick={handleManualSend} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />} Push Notification Now
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Live Preview Section */}
                    <div className="hidden lg:flex flex-col items-center justify-start pt-10">
                        <Label className="text-muted-foreground mb-4 font-medium flex items-center gap-2"><Smartphone className="h-4 w-4"/> Live Device Preview</Label>
                        <NotificationPreview preset={formData} />
                    </div>
                </div>
            </TabsContent>

            {/* TAB 2: AUTO PILOT PRESETS */}
            <TabsContent value="presets" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Add New Preset */}
                    <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden h-fit">
                        <CardHeader className="bg-amber-50 border-b border-amber-100 pb-5">
                            <CardTitle className="text-amber-800 flex items-center gap-2"><Zap className="h-5 w-5 fill-amber-500"/> Add New Auto-Preset</CardTitle>
                            <CardDescription className="text-amber-700/70">The system will automatically send this based on the time slot.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <NotificationForm formData={formData} setFormData={setFormData} showTimeSlot={true} />
                            <Button className="w-full h-14 text-lg rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-transform active:scale-[0.99]" onClick={handleSavePreset} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />} Save to Auto-Pilot
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Saved Presets List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            Active Presets <span className="bg-amber-100 text-amber-700 text-sm py-0.5 px-2.5 rounded-full">{presets.length}</span>
                        </h3>
                        {presets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Zap className="h-10 w-10 text-gray-300 mb-2" />
                                <p className="text-muted-foreground text-sm font-medium">No auto-presets configured yet.</p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                            {presets.map((preset) => (
                                <div key={preset._id} className="relative group">
                                    <NotificationPreview preset={preset} />
                                    
                                    {/* Delete Button Overlay */}
                                    <button 
                                        onClick={() => setDeleteId(preset._id)}
                                        className="absolute -top-2 -right-2 p-2 bg-white text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 border border-red-100 z-10"
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
            <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-0 shadow-lg bg-white rounded-2xl">
                    <CardHeader className="border-b pb-5">
                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Broadcast History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="relative border-l-2 border-muted/50 ml-3 md:ml-4 space-y-8 pb-4">
                            {history.map((log: any, idx) => (
                                <div key={idx} className="relative pl-6 sm:pl-8 group">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[13px] top-1 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${log.type === 'AUTO_CRON' ? 'bg-amber-400' : 'bg-blue-500'}`}></div>
                                    
                                    <div className="bg-muted/10 border rounded-2xl p-4 transition-colors group-hover:bg-muted/20">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                {log.type === 'AUTO_CRON' ? <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" /> : <Send className="h-4 w-4 text-blue-500" />}
                                                <h4 className="font-bold text-foreground text-base">{log.title}</h4>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border shadow-sm w-fit">
                                                <Clock className="h-3 w-3" /> {new Date(log.sentAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 mb-3">{log.message}</p>
                                        
                                        <div className="flex items-center gap-2">
                                            {log.type === 'AUTO_CRON' && log.targetSlot && (
                                                <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    Auto: {log.targetSlot}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Delivered
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div className="pl-8 py-10 text-muted-foreground flex flex-col items-center">
                                    <History className="h-10 w-10 opacity-20 mb-2" />
                                    <p>No notifications sent yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <DeleteConfirmationDialog 
            open={!!deleteId} 
            onOpenChange={() => setDeleteId(null)}
            onConfirm={confirmDeletePreset}
            isDeleting={isDeleting}
            title="Delete Preset?"
            description="This preset will no longer be used for auto-notifications. You cannot undo this action."
        />
    </div>
  );
}

// Custom Form Component
function NotificationForm({ formData, setFormData, showTimeSlot }: any) {
    return (
        <div className="space-y-6">
            <div className="pt-2">
                <FloatingInput 
                    label="Notification Title (e.g., Hungry? 😋)"
                    value={formData.title} 
                    onChange={(e: any) => setFormData({...formData, title: e.target.value})} 
                />
            </div>

            {/* Custom Floating Textarea */}
            <div className="relative pt-2">
                <Textarea 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                    placeholder=" "
                    className="block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-white border-primary/20 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary peer min-h-[120px] transition-all shadow-sm resize-y"
                />
                <Label className="absolute text-sm text-muted-foreground duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none bg-white px-1">
                    Message Body
                </Label>
            </div>
            
            {showTimeSlot && (
                <div className="space-y-1.5 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <Label className="flex items-center gap-1.5 text-amber-800 font-bold"><Clock className="h-4 w-4"/> Target Time Slot</Label>
                    <Select value={formData.timeSlot} onValueChange={(val) => setFormData({...formData, timeSlot: val})}>
                        <SelectTrigger className="w-full h-12 rounded-xl bg-white border-amber-200 shadow-sm focus:ring-2 focus:ring-amber-500/20 font-medium text-foreground">
                            <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lunch-preorder">Lunch Pre-order (12 AM)</SelectItem>
                            <SelectItem value="lunch">Lunch Reminder (6 AM)</SelectItem>
                            <SelectItem value="dinner-preorder">Dinner Pre-order (12 PM)</SelectItem>
                            <SelectItem value="dinner">Dinner Reminder (6 PM)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-amber-700/70 font-medium pt-1">The cron job will pick this preset at the selected time.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Banner Image (Optional)</Label>
                    <div className="bg-white rounded-xl p-2 border border-dashed border-primary/30 shadow-sm">
                        <ImageUpload 
                            value={formData.image ? [formData.image] : []}
                            onChange={(urls) => setFormData({...formData, image: urls[0] || ''})}
                            maxFiles={1}
                            folder="notifications" 
                        />
                    </div>
                </div>
                <div className="flex flex-col justify-start pt-1">
                    <FloatingInput 
                        label="Redirection Link (e.g. /menus)"
                        value={formData.link} 
                        onChange={(e: any) => setFormData({...formData, link: e.target.value})} 
                    />
                    <p className="text-[10px] text-muted-foreground px-1 pt-2">Where should users go when they tap?</p>
                </div>
            </div>
        </div>
    )
}

// iOS/Android style Notification Preview Component
function NotificationPreview({ preset }: { preset: any }) {
    return (
        <div className="bg-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-inner w-full max-w-[360px] mx-auto transition-all hover:bg-slate-200/50">
            {/* Top Bar for Time slot if present */}
            {preset.timeSlot && preset.timeSlot !== 'anytime' && (
                <div className="flex justify-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
                        Slot: {preset.timeSlot}
                    </span>
                </div>
            )}
            
            {/* Actual Notification Box */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col gap-2">
                {/* App Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 bg-primary rounded-md flex items-center justify-center shadow-sm">
                            <Bell className="h-3 w-3 text-white fill-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tracking-tight">Bumba's Kitchen</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">now</span>
                </div>
                
                {/* Content */}
                <div className="px-1 pt-0.5">
                    <h4 className="font-bold text-[15px] text-slate-900 leading-tight mb-0.5">
                        {preset.title || "Notification Title"}
                    </h4>
                    <p className="text-[13px] text-slate-600 leading-snug line-clamp-3 whitespace-pre-wrap">
                        {preset.message || "This is how your message body will appear on the user's screen."}
                    </p>
                </div>
                
                {/* Image Attachment */}
                {preset.image && (
                    <div className="relative w-full h-[140px] mt-1.5 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                        <Image 
                            src={optimizeImageUrl(preset.image)} 
                            alt="preview" 
                            fill 
                            sizes="(max-width: 768px) 100vw, 360px"
                            className="object-cover" 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
