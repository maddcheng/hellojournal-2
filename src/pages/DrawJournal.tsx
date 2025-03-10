import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas';
import { TemplateGenerator, TemplateType } from '@/components/TemplateGenerator';
import { pageVariants } from '@/components/animations/PageTransition';
import { formatDate } from '@/utils/dateUtils';
import BackButton from '@/components/BackButton';
import { Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { loadCanvasFromJSON } from '@/utils/canvasOperations';

const DrawJournal = () => {
  const [mode, setMode] = useState<'template' | 'draw'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  const canvasRef = useRef<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we have a draft to load
    const draft = location.state?.draft;
    if (draft && canvasRef.current) {
      try {
        console.log("Attempting to load draft:", draft);
        setMode('draw');
        setCustomPrompt(draft.title);
        
        // Use setTimeout to ensure the canvas is fully initialized
        setTimeout(() => {
          if (canvasRef.current) {
            try {
              loadCanvasFromJSON(canvasRef.current, draft.content, () => {
                toast({
                  title: "Draft loaded successfully",
                  description: "You can continue editing your drawing",
                });
              });
            } catch (error) {
              console.error('Error loading draft content:', error);
              toast({
                title: "Error loading draft",
                description: "There was a problem loading your draft",
                variant: "destructive",
              });
            }
          }
        }, 500);
      } catch (error) {
        console.error('Error processing draft:', error);
        toast({
          title: "Error loading draft",
          description: "There was a problem loading your draft",
          variant: "destructive",
        });
      }
    }
  }, [location.state, canvasRef.current]);

  const handleSelectTemplate = (template: TemplateType, customPrompt?: string) => {
    setSelectedTemplate(template);
    setCustomPrompt(customPrompt);
    setMode('draw');
  };

  const handleSaveDraft = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // Ensure we're storing all necessary properties
    const canvasData = canvas.toJSON([
      'selectable', 
      'hasControls', 
      'lockMovementX',
      'lockMovementY',
      'lockRotation',
      'lockScalingX',
      'lockScalingY',
      'editable'
    ]);
    
    const draft = {
      id: Date.now(),
      title: customPrompt || 'Untitled Draft',
      content: JSON.stringify(canvasData),
      lastModified: new Date(),
    };

    // Get existing drafts from localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('journal-drafts') || '[]');
    
    // Add new draft
    const updatedDrafts = [draft, ...existingDrafts];
    
    // Save to localStorage
    localStorage.setItem('journal-drafts', JSON.stringify(updatedDrafts));

    toast({
      title: "Draft saved successfully",
      description: "You can find it in the Drafts page",
    });

    // Navigate to drafts page
    navigate('/drafts');
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <BackButton className="mr-3" />
            <div>
              <h1 className="text-2xl font-serif">Journal Canvas</h1>
              <p className="text-sm text-gray-600">{formatDate(new Date())}</p>
            </div>
          </div>
          {mode === 'draw' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveDraft}
              className="px-4 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 focus-ring flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </motion.button>
          )}
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
              ref={canvasRef}
            />
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default DrawJournal;
