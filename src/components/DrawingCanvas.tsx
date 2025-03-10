import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { DrawingToolbar, DrawingTool } from './DrawingToolbar';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = 800,
  height = 600,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState({ h: 0, s: 100, b: 100 });

  // Convert HSB to hex color
  const getHexColor = useCallback(({ h, s, b }: { h: number; s: number; b: number }): string => {
    s /= 100;
    b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return '#' + [f(5), f(3), f(1)]
      .map(x => Math.round(x * 255).toString(16).padStart(2, '0'))
      .join('');
  }, []);

  // Setup canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create canvas instance
    const canvas = new fabric.Canvas(canvasRef.current);
    canvas.setDimensions({ width, height });
    canvas.backgroundColor = '#f9f8f4';
    canvasInstance.current = canvas;

    // Set up default brush
    const brush = new fabric.PencilBrush(canvas);
    brush.width = strokeWidth;
    brush.color = getHexColor(color);
    canvas.freeDrawingBrush = brush;

    // Enable drawing mode by default
    canvas.isDrawingMode = true;

    return () => {
      canvas.dispose();
      canvasInstance.current = null;
    };
  }, [width, height]);

  // Handle tool changes
  const handleToolChange = useCallback((newTool: DrawingTool) => {
    if (!canvasInstance.current) return;
    const canvas = canvasInstance.current;

    setTool(newTool);

    // Reset canvas state
    canvas.discardActiveObject();
    canvas.getObjects().forEach(obj => {
      obj.selectable = false;
      obj.hasControls = false;
    });

    switch (newTool) {
      case 'brush':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = getHexColor(color);
          canvas.freeDrawingBrush.width = strokeWidth;
        }
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = '#f9f8f4';
          canvas.freeDrawingBrush.width = strokeWidth;
        }
        break;

      case 'image':
        canvas.isDrawingMode = false;
        fileInputRef.current?.click();
        break;

      case 'lasso':
        canvas.isDrawingMode = false;
        canvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.hasControls = false;
        });
        break;

      case 'adjust':
        canvas.isDrawingMode = false;
        canvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.hasControls = true;
        });
        break;
    }

    canvas.requestRenderAll();
  }, [color, strokeWidth, getHexColor]);

  // Handle brush width changes
  const handleWidthChange = useCallback((width: number) => {
    setStrokeWidth(width);
    if (canvasInstance.current?.freeDrawingBrush) {
      canvasInstance.current.freeDrawingBrush.width = width;
    }
  }, []);

  // Handle color changes
  const handleColorChange = useCallback((newColor: { h: number; s: number; b: number }) => {
    setColor(newColor);
    if (canvasInstance.current?.freeDrawingBrush && tool === 'brush') {
      canvasInstance.current.freeDrawingBrush.color = getHexColor(newColor);
    }
  }, [tool, getHexColor]);

  // Handle image uploads
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasInstance.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const fabricImage = new fabric.Image(img);
        
        // Scale image to fit within canvas
        const scale = Math.min(
          (width * 0.8) / fabricImage.width!,
          (height * 0.8) / fabricImage.height!
        );

        fabricImage.scale(scale);
        fabricImage.set({
          left: (width - fabricImage.width! * scale) / 2,
          top: (height - fabricImage.height! * scale) / 2,
          selectable: true,
          hasControls: true
        });

        canvasInstance.current?.add(fabricImage);
        canvasInstance.current?.setActiveObject(fabricImage);
        canvasInstance.current?.requestRenderAll();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
  }, [width, height]);

  return (
    <div className="flex gap-4 p-4">
      <DrawingToolbar
        currentTool={tool}
        brushWidth={strokeWidth}
        brushColor={color}
        onToolChange={handleToolChange}
        onBrushWidthChange={handleWidthChange}
        onBrushColorChange={handleColorChange}
      />
      <div className={className}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            touchAction: 'none'
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DrawingCanvas; 