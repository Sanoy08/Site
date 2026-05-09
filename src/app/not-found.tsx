// src/app/not-found.tsx


import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
      
      {/* Icon / Illustration */}
      <div className="relative mb-6">
        <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
           <UtensilsCrossed className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
        </div>
        {/* Question Mark Badge */}
        <div className="absolute -top-2 -right-2 bg-primary text-white font-bold text-2xl h-10 w-10 flex items-center justify-center rounded-full shadow-lg border-4 border-white">
            ?
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-bold font-headline text-gray-900 mb-4">
        Oops! Empty Plate
      </h1>

      {/* Message */}
      <p className="text-lg text-gray-600 max-w-md mb-8 leading-relaxed">
        The page you are looking for doesn't exist or has been moved. It looks like we can't serve this dish right now.
      </p>

      {/* Action Button */}
      <Button 
        asChild 
        className="h-12 px-8 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
      >
        <Link href="/">
           <Home className="mr-2 h-5 w-5" />
           Return to Homepage
        </Link>
      </Button>

    </div>
  );
}