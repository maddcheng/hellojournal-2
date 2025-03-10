import { Canvas, PencilBrush } from 'fabric';

// Local storage keys
const DRAFT_KEY = 'journal_draft';
const ENTRIES_KEY = 'journal_entries';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  type: 'drawing' | 'text';
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
}

export type Tool = 'pen' | 'eraser' | 'text' | 'lasso';

export const initializeCanvas = (canvasRef: HTMLCanvasElement, width: number, height: number): Canvas => {
  console.log('Initializing canvas with dimensions:', width, height);
  
  // Create canvas instance
  const fabricCanvas = new Canvas(canvasRef, {
    width,
    height,
    backgroundColor: "#f9f8f4",
    isDrawingMode: true,
    selection: true,
    preserveObjectStacking: true,
  });

  // Initialize brush
  const pencilBrush = new PencilBrush(fabricCanvas);
  pencilBrush.color = "#000000";
  pencilBrush.width = 2;
  pencilBrush.strokeLineCap = 'round';
  pencilBrush.strokeLineJoin = 'round';
  fabricCanvas.freeDrawingBrush = pencilBrush;

  // Basic event handlers
  fabricCanvas.on('object:added', (e) => {
    const obj = e.target;
    if (!obj) return;

    obj.set({
      selectable: true,
      hasControls: true,
      evented: true,
    });

    if (obj instanceof fabric.IText) {
      obj.set({ editable: true });
    }
    if (obj.type === 'path') {
      obj.set({
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        fill: null
      });
    }

    fabricCanvas.requestRenderAll();
  });

  return fabricCanvas;
};

export const updateBrush = (
  canvas: Canvas, 
  tool: Tool, 
  brushSize: number,
  penColor: string = "#000000"
): void => {
  if (!canvas) return;

  canvas.isDrawingMode = tool === 'pen' || tool === 'eraser';
  canvas.selection = !canvas.isDrawingMode;

  if (tool === 'pen' || tool === 'eraser') {
    const brush = new PencilBrush(canvas);
    brush.width = brushSize;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    
    if (tool === 'pen') {
      brush.color = penColor;
    } else {
      brush.color = canvas.backgroundColor as string;
    }
    
    canvas.freeDrawingBrush = brush;
  }

  canvas.requestRenderAll();
};

export const saveCanvasState = (canvas: Canvas): void => {
  if (!canvas) return;
  
  try {
    const objects = canvas.getObjects();
    if (objects.length === 0) {
      console.log('No objects to save');
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    console.log('Saving canvas state with objects:', objects.length);
    
    // Prepare canvas state with all necessary properties
    const canvasState = {
      version: '1.0',
      timestamp: Date.now(),
      canvasData: canvas.toJSON([
        'selectable',
        'hasControls',
        'editable',
        'evented',
        'backgroundColor',
        'strokeWidth',
        'stroke',
        'fill',
        'path',
        'strokeLineCap',
        'strokeLineJoin',
        'perPixelTargetFind',
        'type',
        'width',
        'height',
        'scaleX',
        'scaleY',
        'angle',
        'left',
        'top',
        'flipX',
        'flipY',
        'opacity',
        'src',
        'crossOrigin'
      ])
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(canvasState));
    console.log('Canvas state saved successfully');
  } catch (error) {
    console.error('Error saving canvas state:', error);
  }
};

export const loadDraft = (canvas: Canvas): boolean => {
  try {
    const draftData = localStorage.getItem(DRAFT_KEY);
    if (!draftData) {
      console.log('No draft found in localStorage');
      return false;
    }

    console.log('Loading draft from localStorage');
    
    const canvasState = JSON.parse(draftData);
    if (!canvasState.canvasData) {
      console.log('Invalid draft data');
      return false;
    }

    // Clear existing objects
    canvas.clear();
    
    // Load saved state
    canvas.loadFromJSON(canvasState.canvasData, () => {
      console.log('Draft JSON loaded, object count:', canvas.getObjects().length);
      
      // Restore object properties
      canvas.getObjects().forEach(obj => {
        // Set common properties
        obj.set({
          selectable: true,
          hasControls: true,
          evented: true,
          perPixelTargetFind: true,
        });

        // Handle specific object types
        if (obj.type === 'i-text') {
          obj.set({
            editable: true,
          });
        }
        if (obj.type === 'path') {
          obj.set({
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            fill: null
          });
        }
      });
      
      canvas.renderAll();
      console.log('Canvas rendered after loading draft');
    });

    return true;
  } catch (error) {
    console.error('Error loading draft:', error);
    return false;
  }
}; 