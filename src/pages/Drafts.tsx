import React from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { FileEdit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/utils/dateUtils';

// Temporary mock data for drafts
const mockDrafts = [
  {
    id: 1,
    title: "Project Brainstorm",
    content: "Ideas for improving the journal app...",
    lastModified: new Date(2024, 2, 8, 15, 30),
  },
  {
    id: 2,
    title: "Weekend Plans",
    content: "Things to do this weekend...",
    lastModified: new Date(2024, 2, 8, 10, 45),
  },
  {
    id: 3,
    title: "Meeting Notes",
    content: "Key points from today's discussion...",
    lastModified: new Date(2024, 2, 7, 16, 20),
  },
];

const DraftsPage = () => {
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
            {mockDrafts.length > 0 ? (
              <div className="space-y-4">
                {mockDrafts.map(draft => (
                  <Card 
                    key={draft.id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif">{draft.title}</h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(draft.lastModified)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {draft.content}
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