
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleBack}
      className={cn(
        "p-2 rounded-md hover:bg-gray-100 focus-ring transition-colors",
        className
      )}
      aria-label="Go back"
    >
      <ArrowLeft size={20} className="text-gray-600" />
    </motion.button>
  );
};

export default BackButton;
