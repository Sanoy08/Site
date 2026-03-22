// src/app/admin/special-dates/upcoming/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Cake, Gift, Sparkles, Clock, CalendarDays, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type CustomerEvent = {
  id: string;
  name: string;
  nextDate: string;
  type: 'birthday' | 'anniversary';
  daysLeft: number;
};

export default function UpcomingSpecialDatesPage() {
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('/api/admin/customers-with-dates');
        const data = await res.json();
        
        if (data.success) {
          // শুধু ৭ দিনের ইভেন্ট নেব এবং যেটা সবচেয়ে কাছে সেটাকে আগে রাখব (Sort by closest)
          const nextWeekEvents = data.events
            .filter((e: CustomerEvent) => e.daysLeft > 0 && e.daysLeft <= 7)
            .sort((a: CustomerEvent, b: CustomerEvent) => a.daysLeft - b.daysLeft); 
          setEvents(nextWeekEvents);
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
        <p className="text-muted-foreground font-medium">Loading upcoming celebrations...</p>
      </div>
    );
  }

  // ডেটাগুলোকে দুই ভাগে ভাগ করা: প্রথমটা (Hero) এবং বাকিগুলো (List)
  const nextEvent = events[0];
  const otherEvents = events.slice(1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/special-dates')} className="rounded-full shadow-sm hover:bg-primary/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-gray-900 dark:text-white">
            <CalendarDays className="h-8 w-8 text-primary" />
            This Week's Radar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Customers celebrating their special moments in the next 7 days.</p>
        </div>
      </div>

      {events.length === 0 ? (
        // Empty State
        <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Quiet week ahead!</h2>
            <p className="text-muted-foreground mt-2">No upcoming events found in the next 7 days.</p>
            <Button className="mt-8 rounded-full px-8 shadow-md" onClick={() => router.push('/admin/special-dates')}>
              View All Special Dates
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: FOCUS/HERO EVENT */}
          <div className="lg:col-span-5 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1">Next up</h2>
            
            <div className={`relative flex-1 rounded-[2rem] p-8 shadow-2xl overflow-hidden border border-white/20 flex flex-col justify-between min-h-[420px] transition-all hover:shadow-primary/20 ${
              nextEvent.type === 'birthday' 
                ? 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 text-white' 
                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 text-white'
            }`}>
              {/* Decorative Background Icon */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
                {nextEvent.type === 'birthday' ? <Cake className="w-72 h-72" /> : <Gift className="w-72 h-72" />}
              </div>
              
              <div className="relative z-10 flex items-center justify-between mb-8">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {nextEvent.type}
                </Badge>
                <span className="text-sm font-bold bg-black/25 px-4 py-1.5 rounded-full backdrop-blur-md shadow-inner text-white/90">
                    {nextEvent.daysLeft === 1 ? 'Tomorrow!' : `In ${nextEvent.daysLeft} Days`}
                </span>
              </div>

              <div className="relative z-10 my-auto">
                <h3 className="text-4xl md:text-5xl font-black mb-4 leading-tight drop-shadow-sm">
                    {nextEvent.name}
                </h3>
                <p className="text-lg opacity-90 font-medium flex items-center gap-2 bg-white/10 w-fit px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                    <CalendarDays className="w-5 h-5" />
                    {new Date(nextEvent.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="relative z-10 mt-10">
                <Button 
                    size="lg" 
                    variant="secondary" 
                    className="w-full rounded-2xl text-lg font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-white text-gray-900 hover:bg-gray-50 h-14"
                    onClick={() => router.push('/admin/special-dates')}
                >
                    Prepare Coupon & Poster
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: LIST OF OTHER EVENTS */}
          <div className="lg:col-span-7 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1 flex items-center">
                Later This Week 
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full ml-3 text-xs">{otherEvents.length}</span>
            </h2>
            
            {otherEvents.length === 0 ? (
                <div className="flex-1 rounded-[2rem] border-2 border-dashed bg-muted/10 flex flex-col items-center justify-center p-10 text-center">
                    <div className="bg-background p-5 rounded-full mb-4 shadow-sm border">
                        <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg">No other events this week.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Full focus on {nextEvent.name}'s {nextEvent.type}! 🎉</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-3">
                    {otherEvents.map((event) => (
                        <div 
                            key={event.id} 
                            className="group bg-card hover:bg-accent/30 border shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-primary/20"
                            onClick={() => router.push('/admin/special-dates')}
                        >
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-inner ${
                                    event.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                    {event.type === 'birthday' ? <Cake className="w-6 h-6 sm:w-7 sm:h-7" /> : <Gift className="w-6 h-6 sm:w-7 sm:h-7" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-0.5">{event.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className={`font-semibold ${event.type === 'birthday' ? 'text-pink-600' : 'text-purple-600'} capitalize`}>
                                            {event.type}
                                        </span>
                                        <span className="opacity-50">•</span>
                                        <span className="font-medium">{new Date(event.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-base font-black text-gray-900 dark:text-gray-100">{event.daysLeft} Days</p>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">left</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-background border shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}