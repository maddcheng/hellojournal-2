import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { FileEdit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface Draft {
  id: number;
  title: string;
  content: string;
  lastModified: Date;
}

const DraftsPage = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load drafts from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('journal-drafts') || '[]');
    // Convert string dates back to Date objects
    const draftsWithDates = savedDrafts.map((draft: any) => ({
      ...draft,
      lastModified: new Date(draft.lastModified)
    }));
    setDrafts(draftsWithDates);
  }, []);

  const handleDraftClick = (draft: Draft) => {
    // TODO: Implement draft editing
    // For now, just navigate to draw page
    navigate('/draw');
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
                      <span className="text-sm text-gray-500">
                        {formatDate(draft.lastModified)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      Draft saved on {formatDate(draft.lastModified)}
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