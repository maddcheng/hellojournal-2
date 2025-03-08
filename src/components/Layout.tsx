import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, Menu, Book, Calendar, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex overflow-hidden bg-journal-paper">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-20 w-64 bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-lg md:shadow-none md:relative md:translate-x-0"
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-6 mt-2">
                <h2 className="text-xl font-serif font-medium">Journal</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-gray-100 focus-ring"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
              </div>

              <nav className="space-y-1 flex-1">
                <SidebarLink icon={Book} label="Entries" to="/" />
                <SidebarLink icon={Calendar} label="Calendar" to="/calendar" />
                <SidebarLink icon={Settings} label="Settings" to="/settings" />
              </nav>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Journal AI — v1.0
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col h-full overflow-hidden relative", className)}>
        {/* Header */}
        <header className="h-16 flex items-center px-4 bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-2 rounded-md hover:bg-gray-100 focus-ring"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-serif">My Journal</h1>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

interface SidebarLinkProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon: Icon, label, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
        isActive
          ? "bg-black text-white"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon size={18} className="mr-2" />
      {label}
    </Link>
  );
};
