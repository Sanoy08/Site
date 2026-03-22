// src/app/admin/special-dates/upcoming/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Cake, Gift, CalendarHeart, Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type CustomerEvent = {
  id: string;
  name: string;
  nextDate: string;
  type: 'birthday' | 'anniversary';
  daysLeft: number;
};

export default function UpcomingSpecialDatesPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<CustomerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Embla Carousel Setup (Auto slider)
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000, stopOnInteraction: true })]);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('/api/admin/customers-with-dates');
        const data = await res.json();
        
        if (data.success) {
          // ফিল্টার: যাদের ইভেন্ট আগামী ৭ দিনের মধ্যে (বা ঠিক ৭ দিন পর)
          const nextWeekEvents = data.events.filter((e: CustomerEvent) => e.daysLeft > 0 && e.daysLeft <= 7);
          setUpcomingEvents(nextWeekEvents);
        }
      } catch (error) {
        toast.error('Failed to load upcoming events');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading upcoming events...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/special-dates')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500" />
            Upcoming in Next 7 Days
          </h1>
          <p className="text-sm text-muted-foreground">Customers who have a birthday or anniversary arriving soon.</p>
        </div>
      </div>

      {/* Slider Section */}
      {upcomingEvents.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <CalendarHeart className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-muted-foreground">No upcoming events this week</h2>
            <Button className="mt-6" variant="outline" onClick={() => router.push('/admin/special-dates')}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_80%] lg:flex-[0_0_60%] pl-4 first:pl-0 pr-4">
                <Card className={`h-full border-0 shadow-lg relative overflow-hidden ${
                  event.type === 'birthday' ? 'bg-gradient-to-br from-pink-50 to-rose-100' : 'bg-gradient-to-br from-purple-50 to-indigo-100'
                }`}>
                  <CardContent className="flex flex-col items-center text-center p-10 h-full justify-center">
                    
                    {/* Icon */}
                    <div className={`p-5 rounded-full mb-6 shadow-inner ${
                      event.type === 'birthday' ? 'bg-pink-200 text-pink-600' : 'bg-purple-200 text-purple-600'
                    }`}>
                      {event.type === 'birthday' ? <Cake className="h-12 w-12" /> : <Gift className="h-12 w-12" />}
                    </div>

                    {/* Info */}
                    <Badge variant="outline" className="mb-4 bg-white/50 border-black/10 px-3 py-1 text-sm uppercase tracking-wider">
                      {event.type}
                    </Badge>
                    <h2 className="text-3xl font-black text-gray-800 mb-2 capitalize">{event.name}</h2>
                    <p className="text-lg font-medium text-gray-700 mb-6">
                      {new Date(event.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {/* Time Left Badge */}
                    <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white font-bold text-gray-800 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      {event.daysLeft === 1 ? 'Tomorrow!' : `In exactly ${event.daysLeft} days`}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="mt-8 rounded-full px-8 shadow-xl" 
                      onClick={() => router.push('/admin/special-dates')}
                    >
                      Prepare Poster & Coupon
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}