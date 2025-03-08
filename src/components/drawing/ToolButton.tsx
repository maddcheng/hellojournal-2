
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ 
  active = false, 
  disabled = false,
  onClick, 
  icon,
  title 
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded-full focus-ring transition-colors",
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={title}
    >
      {icon}
    </motion.button>
  );
};
