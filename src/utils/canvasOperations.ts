import { Canvas, PencilBrush, Image as FabricImage, IText, Object as FabricObject } from 'fabric';

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
}

export const addText = (canvas: Canvas, text: string, options: TextOptions): IText => {
  const textObj = new IText(text, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    ...options,
    originX: 'center',
    originY: 'center',
  });
  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  canvas.renderAll();
  return textObj;
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
  canvas.selectionColor = 'rgba(100, 100, 255, 0.3)';
  canvas.selectionBorderColor = 'rgba(100, 100, 255, 0.8)';
  canvas.selectionLineWidth = 1;
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
