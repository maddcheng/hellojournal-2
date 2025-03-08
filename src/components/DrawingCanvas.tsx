import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas } from 'fabric';
import { PenLine, Eraser, Undo, Redo, Save, Type, Image as ImageIcon, Lasso, RotateCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolButton } from './drawing/ToolButton';
import { 
  initializeCanvas, 
  updateBrush, 
  saveCanvasAsImage, 
  loadCanvasFromJSON,
  addText,
  importImage,
  enableLassoSelection,
  rotateObject,
  resizeObject,
  TextOptions,
  Tool
} from '@/utils/canvasOperations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export const DrawingCanvas = forwardRef<Canvas | null, DrawingCanvasProps>(({
  width = 600,
  height = 800,
  className,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [brushSize, setBrushSize] = useState(2);
  const [penColor, setPenColor] = useState("#000000");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [showTextOptions, setShowTextOptions] = useState(false);
  
  // Text options
  const [textOptions, setTextOptions] = useState<TextOptions>({
    fontFamily: 'Arial',
    fontSize: 20,
    fill: '#000000',
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
  });

  // Font options
  const fontOptions = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Helvetica',
  ];

  // Expose canvas instance through ref
  useImperativeHandle(ref, () => canvas, [canvas]);

  // Predefined colors
  const colorOptions = [
    "#000000", "#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF3333", 
    "#33FFF3", "#F3FF33", "#FF33F3", "#8B5CF6", "#F97316", "#0EA5E9"
  ];

  // Initialize the canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = initializeCanvas(canvasRef.current, width, height);
    setCanvas(fabricCanvas);
    
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

  // Update brush when tool/size/color changes
  useEffect(() => {
    if (!canvas) return;
    updateBrush(canvas, tool, brushSize, penColor);
  }, [tool, brushSize, penColor, canvas]);

  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCanRedo(true);
    
    if (newIndex === 0) {
      setCanUndo(false);
    }
    
    loadCanvasFromJSON(canvas, history[newIndex]);
  };

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCanUndo(true);
    
    if (newIndex === history.length - 1) {
      setCanRedo(false);
    }
    
    loadCanvasFromJSON(canvas, history[newIndex]);
  };

  const handleSave = () => {
    if (!canvas) return;
    saveCanvasAsImage(canvas);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPenColor(e.target.value);
  };

  const handleSelectColor = (color: string) => {
    setPenColor(color);
    setTool('pen'); // Switch to pen when selecting a color
  };

  const handleTextAdd = () => {
    if (!canvas) return;
    addText(canvas, 'Double click to edit', textOptions);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    importImage(canvas, e.target.files[0]);
  };

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    if (newTool === 'lasso' && canvas) {
      enableLassoSelection(canvas);
    }
  };

  const handleRotate = (clockwise: boolean) => {
    if (!canvas) return;
    rotateObject(canvas, clockwise ? 90 : -90);
  };

  const handleResize = (increase: boolean) => {
    if (!canvas) return;
    resizeObject(canvas, increase ? 0.1 : -0.1);
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="drawing-toolbar mb-4 flex items-center space-x-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm flex-wrap">
        <ToolButton 
          active={tool === 'pen'}
          onClick={() => handleToolChange('pen')}
          icon={<PenLine size={18} />}
          title="Pen"
        />
        <ToolButton 
          active={tool === 'eraser'}
          onClick={() => handleToolChange('eraser')}
          icon={<Eraser size={18} />}
          title="Eraser"
        />
        
        <div className="h-8 mx-1 border-r border-gray-200"></div>
        
        <Popover open={showTextOptions} onOpenChange={setShowTextOptions}>
          <PopoverTrigger asChild>
            <div>
              <ToolButton 
                active={tool === 'text'}
                onClick={() => handleToolChange('text')}
                icon={<Type size={18} />}
                title="Text"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={textOptions.fontFamily}
                  onValueChange={(value) => setTextOptions(prev => ({ ...prev, fontFamily: value }))}
                >
                  {fontOptions.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={textOptions.fontSize}
                  onChange={(e) => setTextOptions(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  min={8}
                  max={72}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={textOptions.fill}
                  onChange={(e) => setTextOptions(prev => ({ ...prev, fill: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={textOptions.fontWeight === 'bold' ? 'default' : 'outline'}
                  onClick={() => setTextOptions(prev => ({ 
                    ...prev, 
                    fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold' 
                  }))}
                >
                  B
                </Button>
                <Button
                  variant={textOptions.fontStyle === 'italic' ? 'default' : 'outline'}
                  onClick={() => setTextOptions(prev => ({ 
                    ...prev, 
                    fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic' 
                  }))}
                >
                  I
                </Button>
                <Button
                  variant={textOptions.underline ? 'default' : 'outline'}
                  onClick={() => setTextOptions(prev => ({ 
                    ...prev, 
                    underline: !prev.underline 
                  }))}
                >
                  U
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleTextAdd}>Add Text</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <ToolButton 
          onClick={() => fileInputRef.current?.click()}
          icon={<ImageIcon size={18} />}
          title="Import Image"
        />
        
        <ToolButton 
          active={tool === 'lasso'}
          onClick={() => handleToolChange('lasso')}
          icon={<Lasso size={18} />}
          title="Select"
        />
        
        <div className="h-8 mx-1 border-r border-gray-200"></div>
        <ToolButton 
          onClick={() => handleRotate(false)}
          icon={<RotateCcw size={18} />}
          title="Rotate Left"
        />
        <ToolButton 
          onClick={() => handleRotate(true)}
          icon={<RotateCw size={18} />}
          title="Rotate Right"
        />
        <ToolButton 
          onClick={() => handleResize(true)}
          icon={<ZoomIn size={18} />}
          title="Scale Up"
        />
        <ToolButton 
          onClick={() => handleResize(false)}
          icon={<ZoomOut size={18} />}
          title="Scale Down"
        />
        
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
});

DrawingCanvas.displayName = 'DrawingCanvas';
