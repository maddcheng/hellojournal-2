import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getRelativeTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

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
  const { toast } = useToast();

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

  const handleDeleteEntry = (e: React.MouseEvent, entryId: number) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Filter out the deleted entry
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    
    // Update state
    setEntries(updatedEntries);
    
    // Save to localStorage
    localStorage.setItem('journal-entries', JSON.stringify(updatedEntries));

    toast({
      title: "Entry deleted",
      description: "The entry has been permanently deleted",
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={index}
            onClick={() => onSelectEntry?.(entry.id)}
            onDelete={(e) => handleDeleteEntry(e, entry.id)}
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
  onDelete?: (e: React.MouseEvent) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, index, onClick, onDelete }) => {
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-journal-accent">{getRelativeTime(entry.date)}</span>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-journal-ink/80 mb-2">{truncatedContent}</p>
      <div className="text-xs text-journal-accent flex items-center">
        <span>{formatDate(entry.date)} • {formatTime(entry.date)}</span>
      </div>
    </motion.div>
  );
};
