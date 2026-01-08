// src/components/layout/Footer.tsx

import { Logo } from "@/components/layout/Logo";
import { Facebook, Instagram, Twitter, Download, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Brand & App Download */}
          <div className="space-y-6">
            <div>
                <Logo />
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Experience delicious meals delivered right to your doorstep. We operate through cloud kitchens, so you can order online.
                </p>
            </div>

            {/* ★★★ App Download Section ★★★ */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" /> Get our Mobile App
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                    Download the official app for the best experience.
                </p>
                <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 gap-2">
                    {/* ★★★ DIRECT DOWNLOAD LINK ★★★ */}
                    {/* এটি public ফোল্ডারের ফাইলটি সরাসরি ডাউনলোড করাবে */}
                    <a href="/bumbas-kitchen.apk" download="BumbasKitchen.apk">
                        <Download className="h-4 w-4" />
                        Download for Android
                    </a>
                </Button>
            </div>

            <div className="flex gap-4">
              <Link href="#" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-4 w-4" /></Link>
              <Link href="#" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-4 w-4" /></Link>
              <Link href="#" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-4 w-4" /></Link>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Information</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Address:</span> 
                Janai, Garbagan, Hooghly
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Phone:</span> 
                +91 912406 80234
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Email:</span> 
                info.bumbaskitchen@gmail.com
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Hours:</span> 
                Mon-Sun (11 AM to 10 PM IST)
              </li>
            </ul>
          </div>
          
          {/* Column 3: Quick Links */}
           <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
             <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Contact</Link></li>
                <li><Link href="/delivery-and-pickup" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Delivery & Pickup</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Bumba's Kitchen. All rights reserved.</p>
            <div className="mt-2 space-x-4">
                <Link href="/terms" className="hover:underline hover:text-primary">Terms of Service</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/privacy" className="hover:underline hover:text-primary">Privacy Policy</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}