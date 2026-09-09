'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function DeleteAccountPage() {
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) return;

    const email = "info.bumbaskitchen@gmail.com";
    const subject = encodeURIComponent("Account Deletion Request");
    const body = encodeURIComponent(
      `Hello Bumba's Kitchen Team,\n\nI would like to request the deletion of my account and all associated data.\n\nRegistered Phone Number: ${phone}\nReason for deletion: ${reason || 'Not provided'}\n\nPlease process this request and confirm once done.\n\nThank you.`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold font-headline text-center mb-8">
          Request Account Deletion
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Delete Your Account & Data</CardTitle>
            <CardDescription>
              Submit a request to permanently delete your account and all associated data from Bumba's Kitchen. 
              Once your request is processed, you will lose access to your order history and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="phone">Registered Phone Number *</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="Enter the phone number associated with your account" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for deletion (Optional)</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Please let us know why you are leaving..." 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Submit Deletion Request via Email
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Clicking the button will open your email app. Please send the pre-filled email to complete your request.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
