'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} // পেজ লোড হওয়ার শুরুতে (একটু নিচে এবং ট্রান্সপারেন্ট থাকবে)
      animate={{ opacity: 1, y: 0 }}  // পেজ লোড হলে (যথাস্থানে চলে আসবে এবং স্পষ্ট হবে)
      exit={{ opacity: 0, y: -15 }}   // পেজ থেকে বের হওয়ার সময় (ওপরের দিকে মিলিয়ে যাবে)
      transition={{ duration: 0.3, ease: 'easeInOut' }} // স্পিড (০.৩ সেকেন্ড)
    >
      {children}
    </motion.div>
  );
}