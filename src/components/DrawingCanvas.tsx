
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas, TEvent, PencilBrush } from 'fabric';
import { PenLine, Eraser, Undo, Redo, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = 600,
  height = 800,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);

  // Initialize the canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#f9f8f4", // Journal paper color
      isDrawingMode: true,
    });
    
    setCanvas(fabricCanvas);
    
    // Initialize brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = "#000000";
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
    
    // Canvas event listeners for history management
    fabricCanvas.on('object:added', () => {
      if (canvas) {
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
          const newHistory = [...prev.slice(0, historyIndex + 1), json];
          setHistoryIndex(historyIndex + 1);
          setCanUndo(true);
          setCanRedo(false);
          return newHistory;
        });
      }
    });
    
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update brush when tool/size changes
  useEffect(() => {
    if (!canvas) return;
    
    if (tool === 'pen') {
      const pencilBrush = new PencilBrush(canvas);
      pencilBrush.color = "#000000";
      pencilBrush.width = brushSize;
      canvas.freeDrawingBrush = pencilBrush;
    } else if (tool === 'eraser') {
      // For eraser, we use a white brush
      const eraserBrush = new PencilBrush(canvas);
      eraserBrush.color = "#f9f8f4";
      eraserBrush.width = brushSize * 2; // Make eraser a bit larger
      canvas.freeDrawingBrush = eraserBrush;
    }
    
    canvas.isDrawingMode = true;
  }, [tool, brushSize, canvas]);

  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCanRedo(true);
    
    if (newIndex === 0) {
      setCanUndo(false);
    }
    
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
    });
  };

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCanUndo(true);
    
    if (newIndex === history.length - 1) {
      setCanRedo(false);
    }
    
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
    });
  };

  const handleSave = () => {
    if (!canvas) return;
    
    // Convert canvas to image
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1 // Add the required multiplier property
    });
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `journal-page-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="drawing-toolbar mb-4 flex items-center space-x-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
        <ToolButton 
          active={tool === 'pen'}
          onClick={() => setTool('pen')}
          icon={<PenLine size={18} />}
          title="Pen"
        />
        <ToolButton 
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          icon={<Eraser size={18} />}
          title="Eraser"
        />
        <div className="h-8 mx-1 border-r border-gray-200"></div>
        <select 
          value={brushSize} 
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="bg-transparent border border-gray-200 rounded-md px-2 py-1 text-xs focus-ring"
        >
          <option value="1">Fine</option>
          <option value="2">Medium</option>
          <option value="4">Thick</option>
          <option value="6">Very Thick</option>
        </select>
        <div className="h-8 mx-1 border-r border-gray-200"></div>
        <ToolButton 
          onClick={handleUndo}
          disabled={!canUndo}
          icon={<Undo size={18} />}
          title="Undo"
        />
        <ToolButton 
          onClick={handleRedo}
          disabled={!canRedo}
          icon={<Redo size={18} />}
          title="Redo"
        />
        <div className="h-8 mx-1 border-r border-gray-200"></div>
        <ToolButton 
          onClick={handleSave}
          icon={<Save size={18} />}
          title="Save as Image"
        />
      </div>
      
      <div className="canvas-container shadow-paper overflow-hidden rounded-lg">
        <canvas ref={canvasRef} className="touch-none" />
      </div>
    </div>
  );
};

interface ToolButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ 
  active = false, 
  disabled = false,
  onClick, 
  icon,
  title 
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded-full focus-ring transition-colors",
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={title}
    >
      {icon}
    </motion.button>
  );
};
