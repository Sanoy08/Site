// src/components/PageTransition.tsx
'use client';

import { motion } from 'framer-motion';

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} // Page load howar age (niche thakbe + invisible)
      animate={{ opacity: 1, y: 0 }}  // Load howar por (jaygamoto ashbe + visible)
      exit={{ opacity: 0, y: 15 }}    // Page leave korar somoy
      transition={{ duration: 0.3, ease: "easeInOut" }} // Animation speed
      className="w-full"
    >
      {children}
    </motion.div>
  );
}