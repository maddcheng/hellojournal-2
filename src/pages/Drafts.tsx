import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { FileEdit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/BackButton';

interface Draft {
  id: number;
  title: string;
  content: string;
  lastModified: Date;
}

const DraftsPage = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load drafts from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('journal-drafts') || '[]');
    console.log('Loaded drafts:', savedDrafts); // Debug log
    // Convert string dates back to Date objects
    const draftsWithDates = savedDrafts.map((draft: any) => ({
      ...draft,
      lastModified: new Date(draft.lastModified)
    }));
    setDrafts(draftsWithDates);
  }, []);

  const handleDraftClick = (draft: Draft) => {
    // Check if it's a canvas draft or text draft
    if (draft.content.startsWith('{') && draft.content.includes('"objects":')) {
      // It's a canvas draft
      navigate('/draw', { state: { draft } });
    } else {
      // It's a text draft
      navigate('/', { state: { draft } });
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, draftId: number) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Filter out the deleted draft
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    
    // Update state
    setDrafts(updatedDrafts);
    
    // Save to localStorage
    localStorage.setItem('journal-drafts', JSON.stringify(updatedDrafts));

    toast({
      title: "Draft deleted",
      description: "The draft has been permanently deleted",
    });
  };

  return (
    <Layout>
      <motion.div
        className="max-w-5xl mx-auto p-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex items-center mb-6">
          <BackButton className="mr-3" />
          <FileEdit className="mr-2 h-8 w-8" />
          <h1 className="text-2xl font-serif">Saved Drafts</h1>
        </div>

        <Card className="p-6">
          <ScrollArea className="h-[600px] pr-4">
            {drafts.length > 0 ? (
              <div className="space-y-4">
                {drafts.map(draft => (
                  <Card 
                    key={draft.id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleDraftClick(draft)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif">{draft.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(draft.lastModified)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteDraft(e, draft.id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Delete draft"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {draft.content.startsWith('{') && draft.content.includes('"objects":')
                        ? 'Canvas drawing'
                        : draft.content}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 font-serif">
                No drafts found
              </div>
            )}
          </ScrollArea>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default DraftsPage; 