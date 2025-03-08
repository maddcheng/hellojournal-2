
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getRandomPrompt } from '@/utils/promptUtils';
import { Sparkles, RefreshCw } from 'lucide-react';

interface JournalPromptProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const JournalPrompt: React.FC<JournalPromptProps> = ({ onSelectPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateNewPrompt = () => {
    setIsLoading(true);
    
    // Add a small delay to simulate "thinking"
    setTimeout(() => {
      const newPrompt = getRandomPrompt();
      setPrompt(newPrompt);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    generateNewPrompt();
  }, []);

  const handleSelectPrompt = () => {
    if (onSelectPrompt && prompt) {
      onSelectPrompt(prompt);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="journal-prompt mb-6 relative"
    >
      <div className="flex items-start">
        <Sparkles 
          size={18} 
          className="text-journal-accent mt-0.5 mr-2 flex-shrink-0" 
          style={{ marginTop: '3px' }}
        />
        <div>
          {isLoading ? (
            <div className="h-5 w-full animate-pulse bg-journal-highlight rounded"></div>
          ) : (
            <p className="text-journal-ink/80">{prompt}</p>
          )}
          <div className="flex justify-end mt-2">
            <button 
              onClick={generateNewPrompt}
              className="text-xs text-journal-accent hover:text-journal-ink transition-colors focus-ring rounded p-1 mr-2 flex items-center"
              title="Get new prompt"
              disabled={isLoading}
            >
              <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span>New prompt</span>
            </button>
            <button 
              onClick={handleSelectPrompt}
              className="text-xs text-journal-accent hover:text-journal-ink transition-colors focus-ring rounded p-1 flex items-center"
              title="Use this prompt"
            >
              <span>Use prompt</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
