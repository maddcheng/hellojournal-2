import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={cn(
        "p-2 rounded-full hover:bg-gray-100 transition-colors focus-ring",
        className
      )}
      aria-label="Go back"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
};

export default BackButton;
