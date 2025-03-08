
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  ListTodo, 
  FileText, 
  Grid, 
  Layout,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type TemplateType = 
  | 'monthly' 
  | 'weekly' 
  | 'daily' 
  | 'bullet' 
  | 'cornell' 
  | 'blank'
  | 'custom';

interface Template {
  id: TemplateType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface TemplateGeneratorProps {
  onSelectTemplate: (template: TemplateType, customPrompt?: string) => void;
  className?: string;
}

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ 
  onSelectTemplate,
  className 
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const templates: Template[] = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      icon: <Calendar size={24} />,
      description: 'A template for planning your month ahead',
    },
    {
      id: 'weekly',
      name: 'Weekly Plan',
      icon: <ListTodo size={24} />,
      description: 'Organize your week with goals and tasks',
    },
    {
      id: 'daily',
      name: 'Daily Plan',
      icon: <CheckSquare size={24} />,
      description: 'Structure your day with tasks and schedule',
    },
    {
      id: 'bullet',
      name: 'Bullet Journal',
      icon: <Grid size={24} />,
      description: 'Dot grid layout for bullet journaling',
    },
    {
      id: 'cornell',
      name: 'Cornell Notes',
      icon: <Layout size={24} />,
      description: 'Cornell note-taking method template',
    },
    {
      id: 'blank',
      name: 'Blank Page',
      icon: <FileText size={24} />,
      description: 'A clean, blank page for free writing',
    },
    {
      id: 'custom',
      name: 'Custom Template',
      icon: <BookOpen size={24} />,
      description: 'Create your own custom template',
    },
  ];

  const handleSelectTemplate = (template: TemplateType) => {
    if (template === 'custom') {
      setShowCustomPrompt(true);
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate template generation (would connect to an AI service in production)
    setTimeout(() => {
      onSelectTemplate(template);
      setIsGenerating(false);
      toast({
        title: 'Template Generated',
        description: `Your ${templates.find(t => t.id === template)?.name.toLowerCase()} template is ready.`,
      });
    }, 1500);
  };

  const handleGenerateCustomTemplate = () => {
    if (!customPrompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a description for your custom template.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate template generation
    setTimeout(() => {
      onSelectTemplate('custom', customPrompt);
      setIsGenerating(false);
      setShowCustomPrompt(false);
      setCustomPrompt('');
      toast({
        title: 'Custom Template Generated',
        description: 'Your custom template is ready.',
      });
    }, 2000);
  };

  return (
    <div className={cn("w-full", className)}>
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 size={40} className="animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">Generating your template...</p>
        </div>
      ) : showCustomPrompt ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Custom Template</h3>
          <p className="text-sm text-gray-600">
            Describe what kind of template you need and our AI will generate it for you.
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary h-32"
            placeholder="E.g., A habit tracker with 7 columns for each day of the week and rows for different habits I want to track..."
          />
          <div className="flex justify-end space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomPrompt(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus-ring"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateCustomTemplate}
              className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 focus-ring"
            >
              Generate
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Choose a Template</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="template-card p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center"
                onClick={() => handleSelectTemplate(template.id)}
              >
                <div className="icon-container mb-2 text-primary">
                  {template.icon}
                </div>
                <h4 className="text-sm font-medium">{template.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
