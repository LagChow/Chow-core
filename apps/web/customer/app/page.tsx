"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapWrapper } from '@/components/map-wrapper';
import { OrderSimulation } from '@/components/order-simulation';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-accent selection:text-black">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-background/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tighter text-accent">LagChow<span className="text-foreground">.</span></h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/stores" className="hidden sm:block text-sm font-semibold hover:text-accent transition-colors">
              Browse Stores
            </Link>
            <Link href="/stores">
              <Button className="bg-accent hover:bg-accent/90 text-black font-bold rounded-xl h-11 px-6 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              Now delivering to all Unilag Halls
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6">
              Your Campus Cravings, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">
                Delivered Fast.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
              Skip the long queues. Get food from your favorite campus vendors delivered directly to your hostel in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/stores">
                <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-black font-black text-lg h-14 px-8 rounded-2xl shadow-[0_10px_40px_rgba(250,204,21,0.3)] transition-transform hover:scale-105">
                  Explore Vendors <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Hero Image / Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-16 sm:mt-24 relative max-w-4xl mx-auto"
          >
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
              <Image 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                alt="Delicious Food"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-card/30 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">How It Works</h2>
            <p className="text-muted-foreground font-medium">Get your food in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-8 h-8 text-black" />,
                title: "1. Choose Your Food",
                desc: "Browse through top-rated vendors and menus across campus."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-black" />,
                title: "2. Pay Securely",
                desc: "Checkout seamlessly using your preferred payment method."
              },
              {
                icon: <Zap className="w-8 h-8 text-black" />,
                title: "3. Fast Delivery",
                desc: "We bring your order straight to your hall or designated landmark."
              }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-card border border-white/5 rounded-3xl p-8 hover:bg-white/5 transition-colors relative group"
              >
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
                Designed for the <br/><span className="text-accent">Student Life.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We understand the struggle of long queues and cold food. LagChow is built by students, to make eating on campus seamless and affordable.
              </p>
              
              <ul className="space-y-4">
                {[
                  "No hidden service fees for basic orders",
                  "Verified student delivery network",
                  "Exclusive discounts from campus favorites",
                  "Real-time order tracking"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0" />
                    <span className="font-medium text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-square max-w-md mx-auto lg:ml-auto"
            >
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-[80px]" />
              <OrderSimulation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* COVERAGE MAP SECTION */}
      <section className="py-24 bg-background relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Our Coverage Area</h2>
            <p className="text-muted-foreground font-medium">We deliver to all halls and major landmarks within the UNILAG campus.</p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <MapWrapper />
          </motion.div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-24 bg-accent/5 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">Ready to eat?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of students ordering food the smart way.</p>
          <Link href="/stores">
            <Button className="bg-accent hover:bg-accent/90 text-black font-black text-xl h-16 px-12 rounded-2xl shadow-[0_10px_40px_rgba(250,204,21,0.4)] transition-transform hover:scale-105">
              Start Ordering
            </Button>
          </Link>
        </div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer className="border-t border-white/5 py-12 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-black text-accent">LagChow<span className="text-foreground">.</span></span>
        </div>
        <p className="text-sm font-medium">© {new Date().getFullYear()} LagChow. All rights reserved.</p>
      </footer>
    </main>
  );
}
