// src/app/admin/special-dates/upcoming/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Cake, Gift, Sparkles, Clock, CalendarDays, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium text-sm">Loading upcoming celebrations...</p>
      </div>
    );
  }

  const nextEvent = events[0];
  const otherEvents = events.slice(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6 pb-24">
      
      {/* --- Header --- */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/special-dates')} className="rounded-full shrink-0 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            This Week's Radar
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Customers celebrating in the next 7 days.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        /* --- Empty State --- */
        <Card className="border-dashed border-2 bg-muted/10 rounded-2xl mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border">
                <Clock className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Quiet week ahead!</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-6">No upcoming events found in the next 7 days.</p>
            <Button className="rounded-full px-6 shadow-sm" onClick={() => router.push('/admin/special-dates')}>
              View All Customers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- Left/Top Column: HERO EVENT --- */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Next up</h2>
            
            <div className={cn(
                "relative rounded-3xl p-6 shadow-md overflow-hidden flex flex-col justify-between min-h-[320px] transition-all",
                nextEvent.type === 'birthday' 
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white' 
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
            )}>
              {/* Soft Background Icon */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 opacity-[0.08] pointer-events-none">
                {nextEvent.type === 'birthday' ? <Cake className="w-56 h-56" /> : <Gift className="w-56 h-56" />}
              </div>
              
              {/* Badges */}
              <div className="relative z-10 flex items-start justify-between mb-6">
                <Badge variant="secondary" className="bg-white/20 text-white border-0 px-3 py-1 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                  {nextEvent.type}
                </Badge>
                <div className="bg-white text-gray-900 px-3 py-1 rounded-full shadow-md text-xs font-bold">
                    {nextEvent.daysLeft === 1 ? 'Tomorrow' : `In ${nextEvent.daysLeft} Days`}
                </div>
              </div>

              {/* Main Info */}
              <div className="relative z-10 mt-auto mb-8">
                <h3 className="text-3xl font-black leading-tight drop-shadow-sm mb-2">
                    {nextEvent.name}
                </h3>
                <p className="text-sm opacity-90 font-medium flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 opacity-70" />
                    {new Date(nextEvent.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Action Button */}
              <Button 
                  className="relative z-10 w-full rounded-xl font-bold shadow-lg bg-white text-gray-900 hover:bg-gray-50 h-12"
                  onClick={() => router.push('/admin/special-dates')}
              >
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> Prepare Offer
              </Button>
            </div>
          </div>

          {/* --- Right/Bottom Column: OTHER EVENTS --- */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1 flex items-center gap-2">
                Later This Week 
                {otherEvents.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{otherEvents.length}</span>
                )}
            </h2>
            
            {otherEvents.length === 0 ? (
                <div className="flex-1 rounded-3xl border border-dashed bg-gray-50 flex flex-col items-center justify-center p-8 text-center h-[320px]">
                    <Sparkles className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">No other events this week.</p>
                    <p className="text-xs text-gray-400 mt-1">Full focus on {nextEvent.name}! 🎉</p>
                </div>
            ) : (
                <Card className="rounded-3xl border-0 shadow-sm overflow-hidden bg-white">
                    <div className="divide-y divide-gray-100">
                        {otherEvents.map((event) => (
                            <div 
                                key={event.id} 
                                className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
                                onClick={() => router.push('/admin/special-dates')}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                      event.type === 'birthday' ? 'bg-rose-50 text-rose-500' : 'bg-purple-50 text-purple-500'
                                    )}>
                                        {event.type === 'birthday' ? <Cake className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                                    </div>
                                    
                                    {/* Details */}
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-0.5 leading-none text-base">{event.name}</h4>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                            <span className="capitalize font-medium">{event.type}</span>
                                            <span className="opacity-40">•</span>
                                            <span>{new Date(event.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Side (Days & Arrow) */}
                                <div className="flex items-center gap-3 text-right">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 leading-none">{event.daysLeft}</span>
                                        <span className="text-[10px] font-medium text-gray-400 uppercase">Days</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
          </div>

        </div>
      )}
    </div>
  );
}