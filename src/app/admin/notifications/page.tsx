'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';

// ★ হেল্পার ফাংশন: ছবির সাইজ ১০০ কেবির নিচে আনার জন্য URL মডিফাই
const getOptimizedNotificationImage = (url: string) => {
  if (!url) return '';
  
  // যদি Cloudinary ব্যবহার করেন (বেশিরভাগ Next.js অ্যাপ এটাই করে)
  if (url.includes('cloudinary.com')) {
    // w_600: প্রস্থ ৬০০ পিক্সেল (নোটিফিকেশনের জন্য যথেষ্ট)
    // q_auto:low: কোয়ালিটি কমিয়ে সাইজ অপ্টিমাইজ করবে
    // f_auto: সেরা ফরম্যাট (webp/avif) বেছে নেবে
    return url.replace('/upload/', '/upload/w_600,q_auto:low,f_auto/');
  }
  
  // অন্য কোনো স্টোরেজ হলে অরিজিনাল ইউআরএল রিটার্ন করবে
  return url;
};

export default function AdminNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '',
    link: '',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
        toast.error("Title and Message are required");
        return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    // ★ এখানে ইমেজ অপ্টিমাইজ করা হচ্ছে পাঠানোর আগে
    const optimizedData = {
        ...formData,
        image: getOptimizedNotificationImage(formData.image)
    };

    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(optimizedData), // অপ্টিমাইজড ডাটা পাঠানো হচ্ছে
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Notifications sent successfully!');
        setFormData({ title: '', message: '', image: '', link: '' });
      } else {
        toast.error(data.error || 'Failed to send notifications');
      }
    } catch (e) {
      toast.error('Error sending notifications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
       <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-2">
                <Bell className="h-8 w-8 text-primary" /> Push Notifications
            </h1>
            <p className="text-muted-foreground">Send real-time alerts to all subscribed customers.</p>
        </div>

      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-primary/5 border-b p-6">
            <h2 className="text-lg font-semibold">Compose Message</h2>
            <p className="text-sm text-muted-foreground">This will be sent immediately.</p>
        </div>
        <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g., 50% OFF on Biryani!"
                    className="text-lg font-medium"
                />
            </div>
            <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                    placeholder="Enter your engaging message here..."
                    className="min-h-[100px]"
                />
            </div>
            
            <div className="space-y-2">
                <Label>Notification Image (Optional)</Label>
                {/* ImageUpload কম্পোনেন্ট যেমন আছে তেমনই থাকবে, আমরা পাঠানোর সময় সাইজ কমাবো */}
                <ImageUpload 
                    value={formData.image ? [formData.image] : []}
                    onChange={(urls) => setFormData({...formData, image: urls[0] || ''})}
                    maxFiles={1}
                />
                <p className="text-xs text-muted-foreground">
                    * Image will be automatically optimized for notifications (approx 100kb).
                </p>
            </div>

            <div className="space-y-2">
                <Label>Link URL (Optional)</Label>
                <Input 
                    value={formData.link} 
                    onChange={(e) => setFormData({...formData, link: e.target.value})} 
                    placeholder="/menus"
                />
            </div>
            
            <Button className="w-full gap-2 h-12 text-lg shadow-lg shadow-primary/25" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Send Broadcast
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}