import * as fabric from 'fabric';

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

export const initializeCanvas = (canvasRef: HTMLCanvasElement, width: number, height: number): fabric.Canvas => {
  const fabricCanvas = new fabric.Canvas(canvasRef, {
    width,
    height,
    backgroundColor: "#f9f8f4",
    isDrawingMode: true,
    selection: true,
    preserveObjectStacking: true,
  });

  const pencilBrush = new fabric.PencilBrush(fabricCanvas);
  pencilBrush.color = "#000000";
  pencilBrush.width = 2;
  pencilBrush.strokeLineCap = 'round';
  pencilBrush.strokeLineJoin = 'round';
  fabricCanvas.freeDrawingBrush = pencilBrush;

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
  canvas: fabric.Canvas, 
  tool: Tool, 
  brushSize: number,
  penColor: string = "#000000"
): void => {
  if (!canvas) return;

  canvas.isDrawingMode = tool === 'pen' || tool === 'eraser';
  canvas.selection = !canvas.isDrawingMode;

  if (tool === 'pen' || tool === 'eraser') {
    const brush = new fabric.PencilBrush(canvas);
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

export const saveCanvasState = (canvas: fabric.Canvas): void => {
  if (!canvas) return;
  
  try {
    const objects = canvas.getObjects();
    if (objects.length === 0) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    
    const canvasState = {
      version: '1.0',
      timestamp: Date.now(),
      canvasData: canvas.toObject()
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(canvasState));
  } catch (error) {
    console.error('Error saving canvas state:', error);
  }
};

export const loadDraft = (canvas: fabric.Canvas): boolean => {
  try {
    const draftData = localStorage.getItem(DRAFT_KEY);
    if (!draftData) return false;
    
    const canvasState = JSON.parse(draftData);
    if (!canvasState.canvasData) return false;

    canvas.clear();
    
    canvas.loadFromJSON(canvasState.canvasData, () => {
      canvas.getObjects().forEach(obj => {
        obj.set({
          selectable: true,
          hasControls: true,
          evented: true,
          perPixelTargetFind: true,
        });

        if (obj.type === 'i-text') {
          obj.set({ editable: true });
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
    });

    return true;
  } catch (error) {
    console.error('Error loading draft:', error);
    return false;
  }
}; 