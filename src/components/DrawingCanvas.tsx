import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, IText } from 'fabric';
import { PenLine, Eraser, Undo, Redo, Save, Type, Image as ImageIcon, Lasso, RotateCw, RotateCcw, ZoomIn, ZoomOut, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
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
  deleteSelectedObjects,
  TextOptions,
  Tool,
  saveCanvasState,
  loadDraft,
  saveEntry,
  clearDraft,
  JournalEntry
} from '@/utils/canvasOperations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import HSBColorPicker from './drawing/HSBColorPicker';
import CanvasSizeSelector from './drawing/CanvasSizeSelector';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onSave?: (entry: JournalEntry) => void;
}

export const DrawingCanvas = forwardRef<Canvas | null, DrawingCanvasProps>(({
  width = 600,
  height = 800,
  className,
  onSave
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [brushSize, setBrushSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [penColor, setPenColor] = useState("#000000");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const { toast } = useToast();
  const [title, setTitle] = useState('Untitled');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCanvasSizeSelector, setShowCanvasSizeSelector] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  
  // Text options
  const [textOptions, setTextOptions] = useState<TextOptions>({
    fontFamily: 'Arial',
    fontSize: 20,
    fill: '#000000',
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    opacity: 1,
    backgroundColor: 'transparent',
    shadow: {
      color: 'rgba(0,0,0,0.3)',
      blur: 3,
      offsetX: 2,
      offsetY: 2
    }
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

  // Initialize the canvas with selected size
  useEffect(() => {
    if (!canvasRef.current || showCanvasSizeSelector) return;

    const fabricCanvas = initializeCanvas(canvasRef.current, canvasSize.width, canvasSize.height);
    setCanvas(fabricCanvas);
    
    // Try to load draft
    const hasDraft = loadDraft(fabricCanvas);
    if (hasDraft) {
      toast({
        title: "Draft Recovered",
        description: "Your previous work has been restored.",
      });
    }
    
    // Make all IText objects editable by default
    fabricCanvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj instanceof IText) {
        obj.set({
          selectable: true
        });
        fabricCanvas.setActiveObject(obj);
      }
    });

    // Canvas event listeners for history and auto-save
    fabricCanvas.on('object:modified', () => {
      saveCanvasState(fabricCanvas);
    });

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
        saveCanvasState(canvas);
      }
    });

    // Handle text editing state
    fabricCanvas.on('text:editing:entered', (e) => {
      const textObj = e.target;
      if (textObj) {
        textObj.set('backgroundColor', 'rgba(255, 255, 255, 0.8)');
        fabricCanvas.renderAll();
      }
    });

    fabricCanvas.on('text:editing:exited', (e) => {
      const textObj = e.target;
      if (textObj) {
        textObj.set('backgroundColor', 'transparent');
        fabricCanvas.renderAll();
      }
    });
    
    return () => {
      fabricCanvas.dispose();
    };
  }, [showCanvasSizeSelector, canvasSize]);

  // Update brush when tool/size/color changes
  useEffect(() => {
    if (!canvas) return;
    const size = tool === 'eraser' ? eraserSize : brushSize;
    updateBrush(canvas, tool, size, penColor);
  }, [tool, brushSize, eraserSize, penColor, canvas]);

  const handleCanvasSizeSelect = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setShowCanvasSizeSelector(false);
  };

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
    setShowSaveDialog(true);
  };

  const handleConfirmSave = () => {
    if (!canvas) return;
    const entry = saveEntry(canvas, title);
    if (onSave) onSave(entry);
    setShowSaveDialog(false);
    toast({
      title: "Entry Saved",
      description: "Your journal entry has been saved successfully.",
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPenColor(e.target.value);
  };

  const handleSelectColor = (color: string) => {
    setPenColor(color);
    setTool('pen'); // Switch to pen when selecting a color
  };

  const handleDelete = () => {
    if (!canvas) return;
    deleteSelectedObjects(canvas);
  };

  const handleTextAdd = () => {
    if (!canvas) return;
    const textObj = addText(canvas, 'Double click to edit', {
      ...textOptions,
      selectable: true
    });
    setTool('text');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    importImage(canvas, e.target.files[0]);
  };

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    if (!canvas) return;

    if (newTool === 'lasso') {
      enableLassoSelection(canvas);
    } else if (newTool === 'text') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else {
      updateBrush(canvas, newTool, brushSize, penColor);
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

  const handleTextAlignment = (alignment: 'left' | 'center' | 'right') => {
    setTextOptions(prev => ({ ...prev, textAlign: alignment }));
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'i-text') {
        (activeObject as IText).set('textAlign', alignment);
        canvas.renderAll();
        saveCanvasState(canvas);
      }
    }
  };

  if (showCanvasSizeSelector) {
    return (
      <div className="w-full max-w-md mx-auto mt-8">
        <CanvasSizeSelector onSizeSelect={handleCanvasSizeSelect} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="drawing-toolbar mb-4 flex items-center gap-2 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm flex-wrap justify-center">
        {/* Drawing Tools Group */}
        <div className="flex items-center gap-2">
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
          
          {/* Color and Stroke Width */}
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <div>
                <ToolButton 
                  active={showColorPicker}
                  onClick={() => {}}
                  icon={<div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: penColor }} />}
                  title="Color & Width"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                {tool !== 'eraser' && (
                  <>
                    <HSBColorPicker value={penColor} onChange={setPenColor} />
                    <div className="space-y-2">
                      <Label>Pen Width</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[brushSize]}
                          onValueChange={([value]) => setBrushSize(value)}
                          min={1}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{brushSize}px</span>
                      </div>
                    </div>
                  </>
                )}
                
                {tool === 'eraser' && (
                  <div className="space-y-2">
                    <Label>Eraser Width</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[eraserSize]}
                        onValueChange={([value]) => setEraserSize(value)}
                        min={5}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-sm text-right">{eraserSize}px</span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="h-8 mx-1 border-r border-gray-200"></div>

        {/* Text and Image Tools Group */}
        <div className="flex items-center gap-2">
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
                
                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={textOptions.textAlign === 'left' ? 'default' : 'outline'}
                      onClick={() => handleTextAlignment('left')}
                    >
                      <AlignLeft size={16} />
                    </Button>
                    <Button
                      variant={textOptions.textAlign === 'center' ? 'default' : 'outline'}
                      onClick={() => handleTextAlignment('center')}
                    >
                      <AlignCenter size={16} />
                    </Button>
                    <Button
                      variant={textOptions.textAlign === 'right' ? 'default' : 'outline'}
                      onClick={() => handleTextAlignment('right')}
                    >
                      <AlignRight size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <Slider
                    value={[textOptions.opacity || 1]}
                    onValueChange={([value]) => setTextOptions(prev => ({ ...prev, opacity: value }))}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={textOptions.backgroundColor || 'transparent'}
                    onChange={(e) => setTextOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  />
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
        </div>

        <div className="h-8 mx-1 border-r border-gray-200"></div>

        {/* Selection and Transform Tools Group */}
        <div className="flex items-center gap-2">
          <ToolButton 
            active={tool === 'lasso'}
            onClick={() => handleToolChange('lasso')}
            icon={<Lasso size={18} />}
            title="Select"
          />
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
        </div>

        <div className="h-8 mx-1 border-r border-gray-200"></div>

        {/* History and Save Tools Group */}
        <div className="flex items-center gap-2">
          <ToolButton 
            onClick={handleDelete}
            icon={<Trash2 size={18} />}
            title="Delete Selected"
          />
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
          <ToolButton 
            onClick={handleSave}
            icon={<Save size={18} />}
            title="Save Entry"
          />
        </div>
      </div>
      
      {/* Save Dialog */}
      <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Entry Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your entry"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSave}>
                Save Entry
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <div className="canvas-container shadow-paper overflow-hidden rounded-lg">
        <canvas ref={canvasRef} className="touch-none" />
      </div>
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
