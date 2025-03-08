
import React from 'react';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getRelativeTime, createDateWithRandomOffset } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

// Sample journal entry data
const sampleEntries = [
  {
    id: 1,
    title: "Morning reflections",
    content: "Woke up early today and spent some time meditating before the day started. I'm finding that these quiet morning moments really set a positive tone for the day.",
    date: createDateWithRandomOffset(1),
  },
  {
    id: 2,
    title: "Creative breakthrough",
    content: "Finally solved that design problem I've been stuck on for days! Sometimes stepping away and letting your mind wander is exactly what you need.",
    date: createDateWithRandomOffset(3),
  },
  {
    id: 3,
    title: "Uncertainty and growth",
    content: "Feeling uncertain about the new project, but I'm trying to embrace the discomfort. Growth happens at the edges of our comfort zones.",
    date: createDateWithRandomOffset(5),
  },
  {
    id: 4, 
    title: "Weekend plans",
    content: "Looking forward to hiking this weekend. Nature always helps me reset and gain perspective on what truly matters.",
    date: createDateWithRandomOffset(7),
  }
];

interface EntryListProps {
  onSelectEntry?: (entryId: number) => void;
  className?: string;
}

export const EntryList: React.FC<EntryListProps> = ({ onSelectEntry, className }) => {
  return (
    <motion.div 
      className={cn("space-y-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-serif">Recent Entries</h2>
      </div>

      <div className="space-y-3">
        {sampleEntries.map((entry, index) => (
          <EntryCard 
            key={entry.id} 
            entry={entry} 
            index={index}
            onClick={() => onSelectEntry?.(entry.id)} 
          />
        ))}
      </div>
    </motion.div>
  );
};

interface EntryCardProps {
  entry: {
    id: number;
    title: string;
    content: string;
    date: Date;
  };
  index: number;
  onClick: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, index, onClick }) => {
  const truncatedContent = entry.content.length > 120 
    ? `${entry.content.substring(0, 120)}...` 
    : entry.content;

  return (
    <motion.div
      className="journal-entry cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-serif text-lg mb-1">{entry.title}</h3>
        <span className="text-xs text-journal-accent">{getRelativeTime(entry.date)}</span>
      </div>
      <p className="text-sm text-journal-ink/80 mb-2">{truncatedContent}</p>
      <div className="text-xs text-journal-accent flex items-center">
        <span>{formatDate(entry.date)} • {formatTime(entry.date)}</span>
      </div>
    </motion.div>
  );
};
