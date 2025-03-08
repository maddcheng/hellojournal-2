
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { TemplateGenerator, TemplateType } from '@/components/TemplateGenerator';
import { pageVariants } from '@/components/animations/PageTransition';
import { formatDate } from '@/utils/dateUtils';

const DrawJournal = () => {
  const [mode, setMode] = useState<'template' | 'draw'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  
  const handleSelectTemplate = (template: TemplateType, customPrompt?: string) => {
    setSelectedTemplate(template);
    setCustomPrompt(customPrompt);
    setMode('draw');
  };
  
  return (
    <Layout>
      <motion.div 
        className="w-full max-w-4xl mx-auto"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-serif">Journal Canvas</h1>
          <p className="text-sm text-gray-600">{formatDate(new Date())}</p>
        </div>
        
        {mode === 'template' ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-paper">
            <TemplateGenerator 
              onSelectTemplate={handleSelectTemplate}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif">
                  {selectedTemplate === 'custom' 
                    ? 'Custom Template' 
                    : selectedTemplate === 'blank' 
                      ? 'Blank Page'
                      : `${selectedTemplate?.charAt(0).toUpperCase()}${selectedTemplate?.slice(1)} Template`}
                </h2>
                {customPrompt && (
                  <p className="text-sm text-gray-600 italic">"{customPrompt}"</p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('template')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-50 focus-ring"
              >
                Change Template
              </motion.button>
            </div>
            
            <DrawingCanvas 
              width={800} 
              height={1000}
            />
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default DrawJournal;
