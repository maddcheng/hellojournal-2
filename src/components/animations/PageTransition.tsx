
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
};

// Variants for a paper-like flip animation
export const pageVariants = {
  initial: {
    opacity: 0,
    rotateY: 5,
    transformOrigin: "left center"
  },
  animate: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    rotateY: -5,
    transition: {
      duration: 0.5
    }
  }
};

// For subtle fade animations
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// For elements that slide in from the bottom
export const slideUpVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    y: 20, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// For staggered animation of multiple elements
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};
