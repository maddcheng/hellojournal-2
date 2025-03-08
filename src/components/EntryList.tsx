import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getRelativeTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface Entry {
  id: number;
  title: string;
  content: string;
  date: Date;
  prompt?: string;
}

interface EntryListProps {
  onSelectEntry?: (entryId: number) => void;
  className?: string;
}

export const EntryList: React.FC<EntryListProps> = ({ onSelectEntry, className }) => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    // Load entries from localStorage
    const savedEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
    console.log('Loaded entries:', savedEntries); // Debug log
    // Convert string dates back to Date objects
    const entriesWithDates = savedEntries.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
    setEntries(entriesWithDates);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={index}
            onClick={() => onSelectEntry?.(entry.id)}
          />
        ))
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-500"
        >
          <p className="font-serif text-lg mb-2">No entries yet</p>
          <p className="text-sm">Start writing your first journal entry!</p>
        </motion.div>
      )}
    </div>
  );
};

interface EntryCardProps {
  entry: Entry;
  index: number;
  onClick?: () => void;
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
