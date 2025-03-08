import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Settings = () => {
  const [language, setLanguage] = useState('en'); // Default to English

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const languageNames = {
      en: 'English',
      'zh-Hant': '繁體中文'
    };
    toast.success(`Language changed to ${languageNames[value as keyof typeof languageNames]}`);
  };

  return (
    <Layout>
      <motion.div
        className="max-w-2xl mx-auto p-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="bg-white rounded-xl shadow-paper p-6">
          <h1 className="text-2xl font-serif mb-6">Settings</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Language</h2>
              <RadioGroup
                value={language}
                onValueChange={handleLanguageChange}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zh-Hant" id="zh-Hant" />
                  <Label htmlFor="zh-Hant">繁體中文</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Add more settings sections here */}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Settings; 