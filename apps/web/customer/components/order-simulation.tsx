"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, ChefHat, Bike, Package } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    id: 'confirming',
    title: 'Confirming Order',
    time: '--',
    icon: <Package className="w-5 h-5 text-black" />,
    progress: 15,
  },
  {
    id: 'preparing',
    title: 'Preparing Food',
    time: '25 mins',
    icon: <ChefHat className="w-5 h-5 text-black" />,
    progress: 45,
  },
  {
    id: 'delivering',
    title: 'Out for Delivery',
    time: '12 mins',
    icon: <Bike className="w-5 h-5 text-black" />,
    progress: 80,
  },
  {
    id: 'arriving',
    title: 'Arriving',
    time: '2 mins',
    icon: <CheckCircle2 className="w-5 h-5 text-black" />,
    progress: 95,
  }
];

const mockItems = [
  { name: 'Spicy Jollof Rice', desc: 'with Fried Plantain', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80' },
  { name: 'Grilled Turkey', desc: 'Extra spicy', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=100&q=80' },
];

export function OrderSimulation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000); // Change step every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const step = steps[currentStep];

  return (
    <div className="relative h-full w-full bg-card border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl p-6 flex flex-col justify-between">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-bold text-foreground">Order #8492</div>
        <div className="bg-white/10 text-xs px-2 py-1 rounded-md font-semibold text-muted-foreground">Olayia Foods</div>
      </div>

      {/* Dynamic List Items */}
      <div className="space-y-4 flex-1">
        <AnimatePresence mode="popLayout">
          {currentStep === 0 ? (
            // Skeleton State
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl animate-pulse">
                  <div className="w-12 h-12 bg-white/10 rounded-xl shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            // Real Items State
            <motion.div
              key="items"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {mockItems.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative border border-white/10">
                    <Image src={item.img} alt={item.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Status Footer */}
      <motion.div 
        layout
        className="mt-6 bg-accent text-black p-6 rounded-2xl overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-bold text-lg flex items-center gap-2"
            >
              {step.icon}
              {step.title}
            </motion.div>
          </AnimatePresence>
          <Clock className="w-5 h-5 opacity-50" />
        </div>

        <div className="flex items-end justify-between relative z-10">
          <div>
            <div className="text-xs font-semibold opacity-70 mb-1">Estimated Time</div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={step.time}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-4xl font-black tabular-nums"
              >
                {step.time}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="text-sm font-bold opacity-80 text-right">
            To Eni Njoku Hall
          </div>
        </div>

        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/10">
          <motion.div 
            className="h-full bg-black/40"
            initial={{ width: '15%' }}
            animate={{ width: `${step.progress}%` }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
