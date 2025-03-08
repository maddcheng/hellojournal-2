
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { pageVariants } from './animations/PageTransition';
import { JournalPrompt } from './JournalPrompt';
import { PenLine } from 'lucide-react';

interface JournalPageProps {
  className?: string;
}

export const JournalPage: React.FC<JournalPageProps> = ({ className }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const currentDate = new Date();

  const handleSelectPrompt = (prompt: string) => {
    setSavedPrompt(prompt);
    // Auto-focus the textarea when a prompt is selected
    const textarea = document.getElementById('journal-content');
    if (textarea) {
      textarea.focus();
    }
  };

  return (
    <motion.div
      className={`max-w-3xl mx-auto ${className}`}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="journal-paper rounded-xl shadow-paper overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <PenLine size={20} className="text-journal-accent mr-2" />
              <h2 className="font-serif text-xl">New Entry</h2>
            </div>
            <div className="text-sm text-journal-accent">
              {formatDate(currentDate)} • {formatTime(currentDate)}
            </div>
          </div>

          <JournalPrompt onSelectPrompt={handleSelectPrompt} />

          <div className="space-y-4">
            <div>
              <input
                type="text"
                id="journal-title"
                placeholder="Entry title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-0 py-2 text-2xl font-serif bg-transparent border-none focus:outline-none focus:ring-0 placeholder-journal-accent/50"
              />
            </div>

            {savedPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="journal-prompt text-sm mb-4"
              >
                <p className="italic text-journal-ink/70">{savedPrompt}</p>
              </motion.div>
            )}

            <div className="min-h-[400px]">
              <textarea
                id="journal-content"
                placeholder="Start writing here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[400px] px-0 py-2 text-lg font-serif leading-relaxed bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-journal-accent/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium shadow-sm hover:shadow focus-ring"
        >
          Save Draft
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium shadow-sm hover:bg-gray-800 focus-ring"
        >
          Publish Entry
        </motion.button>
      </div>
    </motion.div>
  );
};
