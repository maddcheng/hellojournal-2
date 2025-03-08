import React from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { pageVariants } from '@/components/animations/PageTransition';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/utils/dateUtils';

// Temporary mock data for entries
const mockEntries = [
  {
    id: 1,
    title: "Morning Reflection",
    content: "Today started with a beautiful sunrise...",
    date: new Date(2024, 2, 8),
  },
  {
    id: 2,
    title: "Project Ideas",
    content: "Brainstormed some new features for the app...",
    date: new Date(2024, 2, 8),
  },
  {
    id: 3,
    title: "Evening Thoughts",
    content: "Reflecting on today's achievements...",
    date: new Date(2024, 2, 7),
  },
];

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  // Filter entries for selected date
  const selectedDateEntries = mockEntries.filter(entry => 
    date && entry.date.toDateString() === date.toDateString()
  );

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
                      <h3 className="font-serif mb-2 text-center">{entry.title}</h3>
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