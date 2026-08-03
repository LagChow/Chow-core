import Link from 'next/link';
import { Send } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-[#111317] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Logo and Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-black text-accent tracking-tighter">LagChow<span className="text-white">.</span></span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
              Join thousands of students already experiencing faster, fairer, and more efficient campus food delivery with LagChow.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                <InstagramIcon className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                <TwitterIcon className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                <YoutubeIcon className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                <Send className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Columns */}
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Press & Media</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">For Users</h4>
            <ul className="space-y-4">
              <li><Link href="/stores" className="text-sm text-muted-foreground hover:text-white transition-colors">Browse Stores</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Offers & Discounts</Link></li>
              <li><Link href="/saved" className="text-sm text-muted-foreground hover:text-white transition-colors">Saved Vendors</Link></li>
              <li><Link href="/profile" className="text-sm text-muted-foreground hover:text-white transition-colors">Your Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">For Partners</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Become a Vendor</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Become a Rider</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Partner Portal</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Vendor Analytics</Link></li>
            </ul>
          </div>
          
        </div>

        {/* Bottom Line */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
          <p className="text-xs text-muted-foreground">
            Copyright © {new Date().getFullYear()} LagChow. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
