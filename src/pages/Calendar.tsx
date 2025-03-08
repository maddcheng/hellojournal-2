import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/utils/dateUtils';
import BackButton from '@/components/BackButton';
import { useToast } from '@/components/ui/use-toast';

interface Entry {
  id: number;
  title: string;
  content: string;
  date: Date;
}

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load entries from localStorage
    const savedEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
    const entriesWithDates = savedEntries.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
    setEntries(entriesWithDates);
  }, []);

  // Filter entries for selected date
  const selectedDateEntries = entries.filter(entry => 
    date && entry.date.toDateString() === date.toDateString()
  );

  const handleDeleteEntry = (entryId: number) => {
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
          <CalendarIcon className="mr-2 h-8 w-8" />
          <h1 className="text-2xl font-serif">Calendar View</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="p-4 flex items-center justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </Card>

          {/* Entries for selected date */}
          <Card className="p-4 flex flex-col">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-serif">
                Entries for {date ? formatDate(date) : 'Selected Date'}
              </h2>
            </div>
            
            <ScrollArea className="h-[400px] pr-4 flex-1">
              {selectedDateEntries.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEntries.map(entry => (
                    <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif mb-2">{entry.title}</h3>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {entry.content}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 font-serif flex items-center justify-center h-full">
                  {date ? 'No entries for this date' : 'Select a date to view entries'}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default CalendarPage; 