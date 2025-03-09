
import { Canvas, PencilBrush, Image as FabricImage, IText, Object as FabricObject, Shadow } from 'fabric';

// Local storage keys
const DRAFT_KEY = 'journal_draft';
const ENTRIES_KEY = 'journal_entries';

export interface JournalEntry {
  id: string;
  title: string;
  content: string; // Canvas JSON
  type: 'drawing' | 'text';
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
}

export const initializeCanvas = (canvasRef: HTMLCanvasElement, width: number, height: number): Canvas => {
  const fabricCanvas = new Canvas(canvasRef, {
    width,
    height,
    backgroundColor: "#f9f8f4", // Journal paper color
    isDrawingMode: true,
  });
  
  // Initialize brush
  if (fabricCanvas.freeDrawingBrush) {
    fabricCanvas.freeDrawingBrush.color = "#000000";
    fabricCanvas.freeDrawingBrush.width = 2;
  }
  
  return fabricCanvas;
};

export type Tool = 'pen' | 'eraser' | 'text' | 'lasso';

export const updateBrush = (
  canvas: Canvas, 
  tool: Tool, 
  brushSize: number,
  penColor: string = "#000000"
): void => {
  if (!canvas) return;
  
  if (tool === 'pen') {
    const pencilBrush = new PencilBrush(canvas);
    pencilBrush.color = penColor;
    pencilBrush.width = brushSize;
    canvas.freeDrawingBrush = pencilBrush;
    canvas.isDrawingMode = true;
  } else if (tool === 'eraser') {
    const eraserBrush = new PencilBrush(canvas);
    eraserBrush.color = "#f9f8f4"; // Match canvas background color
    eraserBrush.width = brushSize;
    canvas.freeDrawingBrush = eraserBrush;
    canvas.isDrawingMode = true;
  } else {
    canvas.isDrawingMode = false;
  }
};

export const saveCanvasAsImage = (canvas: Canvas): void => {
  if (!canvas) return;
  
  // Convert canvas to image
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 1
  });
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `journal-page-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
};

export const loadCanvasFromJSON = (canvas: Canvas, json: string, callback?: () => void): void => {
  try {
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      if (callback) callback();
    });
  } catch (error) {
    console.error("Error loading canvas from JSON:", error);
  }
};

export interface TextOptions {
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  opacity: number;
  backgroundColor: string;
  selectable?: boolean;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export const addText = (canvas: Canvas, text: string, options: TextOptions): IText => {
  const textObj = new IText(text, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    ...options,
    originX: 'center',
    originY: 'center',
    backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.8)',
    editingBorderColor: '#0EA5E9',
    selectionColor: 'rgba(14, 165, 233, 0.2)',
    selectionBackgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    opacity: options.opacity || 1,
    shadow: options.shadow ? new Shadow({
      color: options.shadow.color,
      blur: options.shadow.blur,
      offsetX: options.shadow.offsetX,
      offsetY: options.shadow.offsetY,
    }) : null,
    selectable: true,
    hasControls: true,
    editable: true
  });

  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  // Fixed: enterEditing() doesn't accept arguments
  textObj.enterEditing();
  canvas.renderAll();
  
  saveCanvasState(canvas);

  return textObj;
};

export const deleteSelectedObjects = (canvas: Canvas): void => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    canvas.discardActiveObject(); // Clear selection first
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    
    saveCanvasState(canvas);
  }
};

export const importImage = (canvas: Canvas, file: File): Promise<FabricImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = new Image();
      imgElement.src = e.target?.result as string;
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement);
        const scale = Math.min(
          (canvas.width! * 0.8) / fabricImage.width!,
          (canvas.height! * 0.8) / fabricImage.height!
        );
        fabricImage.scale(scale);
        fabricImage.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(fabricImage);
        canvas.setActiveObject(fabricImage);
        canvas.renderAll();
        saveCanvasState(canvas);
        resolve(fabricImage);
      };
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const enableLassoSelection = (canvas: Canvas): void => {
  canvas.isDrawingMode = false;
  canvas.selection = true;
  canvas.selectionColor = 'rgba(14, 165, 233, 0.2)';
  canvas.selectionBorderColor = '#0EA5E9';
  canvas.selectionLineWidth = 1;
  
  canvas.preserveObjectStacking = true;
  
  // Fixed: setViewportTransform takes a matrix array
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.centeredScaling = true;
};

export const rotateObject = (canvas: Canvas, angle: number): void => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.rotate((activeObject.angle || 0) + angle);
    canvas.renderAll();
    
    saveCanvasState(canvas);
  }
};

export const resizeObject = (canvas: Canvas, scaleChange: number): void => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    const currentScale = activeObject.scaleX || 1;
    const newScale = currentScale + scaleChange;
    activeObject.scale(newScale);
    canvas.renderAll();
    
    saveCanvasState(canvas);
  }
};

export const saveCanvasState = (canvas: Canvas): void => {
  if (!canvas) return;
  
  try {
    const json = JSON.stringify(canvas.toJSON([
      'selectable', 
      'hasControls', 
      'lockMovementX',
      'lockMovementY',
      'lockRotation',
      'lockScalingX',
      'lockScalingY',
      'editable'
    ]));
    
    localStorage.setItem(DRAFT_KEY, json);
    console.log('Canvas state saved successfully');
  } catch (error) {
    console.error('Error saving canvas state:', error);
  }
};

export const loadDraft = (canvas: Canvas): boolean => {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (!draft) return false;
  
  try {
    loadCanvasFromJSON(canvas, draft, () => {
      canvas.getObjects().forEach(obj => {
        if (obj instanceof IText) {
          obj.set({
            selectable: true,
            hasControls: true,
            editable: true
          });
        } else {
          obj.set({
            selectable: true,
            hasControls: true
          });
        }
      });
      canvas.renderAll();
    });
    console.log('Draft loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading draft:', error);
    return false;
  }
};

export const saveEntry = (canvas: Canvas, title: string = 'Untitled'): JournalEntry => {
  const json = JSON.stringify(canvas.toJSON([
    'selectable', 
    'hasControls', 
    'lockMovementX',
    'lockMovementY',
    'lockRotation',
    'lockScalingX',
    'lockScalingY',
    'editable'
  ]));
  
  const entry: JournalEntry = {
    id: Date.now().toString(),
    title,
    content: json,
    type: 'drawing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDraft: false,
  };

  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  localStorage.removeItem(DRAFT_KEY);
  return entry;
};

export const getEntries = (): JournalEntry[] => {
  const entriesJson = localStorage.getItem(ENTRIES_KEY);
  return entriesJson ? JSON.parse(entriesJson) : [];
};

export const getDraft = (): string | null => {
  return localStorage.getItem(DRAFT_KEY);
};

export const clearDraft = (): void => {
  localStorage.removeItem(DRAFT_KEY);
};

export const deleteEntry = (id: string): void => {
  const entries = getEntries().filter(entry => entry.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
};
