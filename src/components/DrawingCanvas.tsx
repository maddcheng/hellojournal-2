import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, IText, Point } from 'fabric';
import { PenLine, Eraser, Undo, Redo, Save, Type, Image as ImageIcon, Lasso, RotateCw, RotateCcw, ZoomIn, ZoomOut, Trash2, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onSave?: (entry: JournalEntry) => void;
}

// Update font options
const FONT_OPTIONS = [
  { name: 'Sans', value: 'Arial', sample: 'Aa' },
  { name: 'Serif', value: 'Times New Roman', sample: 'Aa' },
  { name: 'Mono', value: 'Courier New', sample: 'Aa' },
  { name: 'Elegant', value: 'Georgia', sample: 'Aa' },
  { name: 'Clean', value: 'Verdana', sample: 'Aa' },
  { name: 'Modern', value: 'Helvetica', sample: 'Aa' },
] as const;

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
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);
  
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
    
    // Try to load draft only once when canvas is first created
    if (!hasDraftLoaded) {
      const hasDraft = loadDraft(fabricCanvas);
      if (hasDraft) {
        toast({
          title: "Draft Recovered",
          description: "Your previous work has been restored.",
        });
        setHasDraftLoaded(true);
      }
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
    
    // Set up zoom and pan handlers
    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = zoom;
      
      if (delta > 0) {
        newZoom *= 0.95;
      } else {
        newZoom *= 1.05;
      }
      
      // Limit zoom
      newZoom = Math.min(Math.max(0.1, newZoom), 5);
      
      const point = fabricCanvas.getPointer(opt.e);
      fabricCanvas.zoomToPoint(new Point(point.x, point.y), newZoom);
      setZoom(newZoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    fabricCanvas.on('mouse:down', (opt) => {
      if (isPanning) {
        fabricCanvas.selection = false;
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.setCursor('grab');
        const pointer = fabricCanvas.getPointer(opt.e);
        lastPointer.current = pointer;
      }
    });

    fabricCanvas.on('mouse:move', (opt) => {
      if (isPanning && opt.e && 'buttons' in opt.e && opt.e.buttons === 1) {
        const currentPointer = fabricCanvas.getPointer(opt.e);
        const dx = currentPointer.x - lastPointer.current.x;
        const dy = currentPointer.y - lastPointer.current.y;
        
        fabricCanvas.relativePan(new Point(dx, dy));
        lastPointer.current = currentPointer;
      }
    });

    fabricCanvas.on('mouse:up', () => {
      if (isPanning) {
        fabricCanvas.setCursor('default');
        fabricCanvas.selection = true;
        updateBrush(fabricCanvas, tool, tool === 'eraser' ? eraserSize : brushSize, penColor);
      }
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, [showCanvasSizeSelector, canvasSize, zoom, isPanning, hasDraftLoaded]);

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

  const handleZoom = (zoomIn: boolean) => {
    if (!canvas) return;
    
    let newZoom = zoom;
    if (zoomIn) {
      newZoom *= 1.1;
    } else {
      newZoom *= 0.9;
    }
    
    // Limit zoom
    newZoom = Math.min(Math.max(0.1, newZoom), 5);
    
    const center = new Point(canvas.width! / 2, canvas.height! / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
  };

  const handlePanToggle = () => {
    setIsPanning(!isPanning);
    if (canvas) {
      canvas.setCursor(isPanning ? 'default' : 'grab');
    }
  };

  // Update text editing to be always available
  useEffect(() => {
    if (!canvas) return;

    canvas.on('selection:created', (e) => {
      const selectedObject = canvas.getActiveObject();
      if (selectedObject && selectedObject.type === 'i-text') {
        setShowTextOptions(true);
        setTextOptions({
          ...textOptions,
          fontFamily: selectedObject.get('fontFamily') || textOptions.fontFamily,
          fontSize: selectedObject.get('fontSize') || textOptions.fontSize,
          fill: selectedObject.get('fill') || textOptions.fill,
          textAlign: (selectedObject.get('textAlign') as 'left' | 'center' | 'right') || textOptions.textAlign,
          fontWeight: selectedObject.get('fontWeight') || textOptions.fontWeight,
          fontStyle: selectedObject.get('fontStyle') || textOptions.fontStyle,
          underline: selectedObject.get('underline') || textOptions.underline,
          opacity: selectedObject.get('opacity') || textOptions.opacity,
          backgroundColor: selectedObject.get('backgroundColor') || textOptions.backgroundColor,
        });
      }
    });

    canvas.on('selection:cleared', () => {
      setShowTextOptions(false);
    });
  }, [canvas]);

  // Update text properties when options change
  useEffect(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set(textOptions);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  }, [textOptions, canvas]);

  if (showCanvasSizeSelector) {
    return (
      <div className="w-full max-w-md mx-auto mt-8">
        <CanvasSizeSelector onSizeSelect={handleCanvasSizeSelect} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center min-h-screen bg-gray-100", className)}>
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
          <Popover>
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
            <PopoverContent className="w-80 p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Font Style</Label>
                  <ToggleGroup 
                    type="single" 
                    value={textOptions.fontFamily}
                    onValueChange={(value) => {
                      if (value) setTextOptions(prev => ({ ...prev, fontFamily: value }));
                    }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {FONT_OPTIONS.map(font => (
                      <ToggleGroupItem
                        key={font.value}
                        value={font.value}
                        aria-label={font.name}
                        className="flex flex-col items-center p-2 gap-1"
                      >
                        <span className="text-sm font-normal">{font.name}</span>
                        <span style={{ fontFamily: font.value }} className="text-lg">
                          {font.sample}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[textOptions.fontSize]}
                      onValueChange={([value]) => setTextOptions(prev => ({ ...prev, fontSize: value }))}
                      min={8}
                      max={72}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{textOptions.fontSize}px</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={textOptions.fill}
                      onChange={(e) => setTextOptions(prev => ({ ...prev, fill: e.target.value }))}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={textOptions.fill}
                      onChange={(e) => setTextOptions(prev => ({ ...prev, fill: e.target.value }))}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between gap-2">
                  <ToggleGroup type="multiple" className="flex justify-start gap-1" value={[
                    textOptions.fontWeight === 'bold' ? 'bold' : '',
                    textOptions.fontStyle === 'italic' ? 'italic' : '',
                    textOptions.underline ? 'underline' : '',
                  ].filter(Boolean)}
                  onValueChange={(values) => {
                    setTextOptions(prev => ({
                      ...prev,
                      fontWeight: values.includes('bold') ? 'bold' : 'normal',
                      fontStyle: values.includes('italic') ? 'italic' : 'normal',
                      underline: values.includes('underline'),
                    }));
                  }}>
                    <ToggleGroupItem value="bold" aria-label="Bold">
                      B
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Italic">
                      I
                    </ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Underline">
                      U
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <ToggleGroup type="single" value={textOptions.textAlign} onValueChange={(value: any) => handleTextAlignment(value)}>
                    <ToggleGroupItem value="left" aria-label="Align left">
                      <AlignLeft size={16} />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align center">
                      <AlignCenter size={16} />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" aria-label="Align right">
                      <AlignRight size={16} />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[textOptions.opacity || 1]}
                      onValueChange={([value]) => setTextOptions(prev => ({ ...prev, opacity: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{Math.round((textOptions.opacity || 1) * 100)}%</span>
                  </div>
                </div>
                
                <div className="sticky bottom-0 pt-2 bg-white border-t">
                  <Button onClick={handleTextAdd} className="w-full">
                    Add Text
                  </Button>
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

        {/* Add Zoom Controls Group */}
        <div className="flex items-center gap-2">
          <ToolButton 
            onClick={() => handleZoom(true)}
            icon={<ZoomIn size={18} />}
            title="Zoom In"
          />
          <ToolButton 
            onClick={() => handleZoom(false)}
            icon={<ZoomOut size={18} />}
            title="Zoom Out"
          />
          <ToolButton 
            active={isPanning}
            onClick={handlePanToggle}
            icon={<Move size={18} />}
            title="Pan Canvas"
          />
          <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
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
      
      <div 
        ref={containerRef}
        className="canvas-container shadow-paper overflow-auto rounded-lg bg-gray-200 p-8"
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 200px)',
          position: 'relative'
        }}
      >
        <div 
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <canvas ref={canvasRef} className={cn("touch-none", isPanning && "cursor-grab")} />
        </div>
      </div>
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
