
import { Canvas, PencilBrush } from 'fabric';

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

export const updateBrush = (
  canvas: Canvas, 
  tool: 'pen' | 'eraser', 
  brushSize: number
): void => {
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
