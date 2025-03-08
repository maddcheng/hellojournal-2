
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { JournalPage } from '@/components/JournalPage';
import { EntryList } from '@/components/EntryList';
import { Plus } from 'lucide-react';

const Index = () => {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const handleSelectEntry = (entryId: number) => {
    setSelectedEntryId(entryId);
    setMode('edit');
  };

  const handleNewEntry = () => {
    setSelectedEntryId(null);
    setMode('edit');
  };

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {mode === 'list' ? (
          <div className="relative max-w-4xl mx-auto">
            <EntryList onSelectEntry={handleSelectEntry} />
            
            {/* Floating action button for new entry */}
            <button
              onClick={handleNewEntry}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-ring"
            >
              <Plus size={24} />
            </button>
          </div>
        ) : (
          <JournalPage />
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Index;
