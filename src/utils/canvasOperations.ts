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
    // For eraser, we use a white brush
    const eraserBrush = new PencilBrush(canvas);
    eraserBrush.color = "#f9f8f4";
    eraserBrush.width = brushSize * 2; // Make eraser a bit larger
    canvas.freeDrawingBrush = eraserBrush;
    canvas.isDrawingMode = true;
  } else if (tool === 'text') {
    canvas.isDrawingMode = false;
  } else if (tool === 'lasso') {
    canvas.isDrawingMode = false;
    canvas.selection = true;
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
  canvas.loadFromJSON(json, () => {
    canvas.renderAll();
    if (callback) callback();
  });
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
  });

  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  textObj.enterEditing();
  canvas.renderAll();

  // Add event listeners for editing state
  textObj.on('editing:entered', () => {
    textObj.set('backgroundColor', 'rgba(255, 255, 255, 0.8)');
    canvas.renderAll();
  });

  textObj.on('editing:exited', () => {
    textObj.set('backgroundColor', options.backgroundColor || 'transparent');
    canvas.renderAll();
    saveCanvasState(canvas); // Auto-save when text editing is done
  });

  return textObj;
};

export const deleteSelectedObjects = (canvas: Canvas): void => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    canvas.discardActiveObject(); // Clear selection first
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
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
        // Scale image to fit within canvas while maintaining aspect ratio
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
        saveCanvasState(canvas); // Auto-save when image is added
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
  
  // Ensure proper stacking order
  canvas.preserveObjectStacking = true;
  
  // Center scaling point
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.centeredScaling = true;
};

export const rotateObject = (canvas: Canvas, angle: number): void => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.rotate((activeObject.angle || 0) + angle);
    canvas.renderAll();
  }
};

export const resizeObject = (canvas: Canvas, scaleChange: number): void => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    const currentScale = activeObject.scaleX || 1;
    const newScale = currentScale + scaleChange;
    activeObject.scale(newScale);
    canvas.renderAll();
  }
};

export const saveCanvasState = (canvas: Canvas): void => {
  if (!canvas) return;
  const json = JSON.stringify(canvas.toJSON());
  localStorage.setItem(DRAFT_KEY, json);
};

export const loadDraft = (canvas: Canvas): boolean => {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    loadCanvasFromJSON(canvas, draft);
    return true;
  }
  return false;
};

export const saveEntry = (canvas: Canvas, title: string = 'Untitled'): JournalEntry => {
  const json = JSON.stringify(canvas.toJSON());
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
  localStorage.removeItem(DRAFT_KEY); // Clear draft after saving
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
