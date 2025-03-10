import React, { useEffect, useRef, useState } from 'react';
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
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState({ h: 0, s: 100, b: 100 });

  // Initialize canvas only once
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f9f8f4',
      isDrawingMode: true,
      selection: false
    });

    // Set up initial brush
    const brush = new fabric.PencilBrush(canvas);
    brush.width = strokeWidth;
    brush.color = '#000000';
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    canvas.freeDrawingBrush = brush;

    fabricCanvasRef.current = canvas;

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const currentColor = tool === 'eraser' ? '#f9f8f4' : getColorFromHSB(color);

    switch (tool) {
      case 'brush':
      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = strokeWidth;
          canvas.freeDrawingBrush.color = currentColor;
        }
        break;

      case 'lasso':
      case 'adjust':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.hasControls = tool === 'adjust';
          obj.evented = true;
        });
        break;

      case 'image':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        fileInputRef.current?.click();
        break;
    }

    canvas.requestRenderAll();
  }, [tool, strokeWidth, color]);

  // Color conversion utility
  const getColorFromHSB = (hsb: { h: number; s: number; b: number }): string => {
    const { h, s, b } = hsb;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const r = Math.round(255 * f(5));
    const g = Math.round(255 * f(3));
    const bl = Math.round(255 * f(1));
    return `#${[r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };

  // Handle image uploads
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.crossOrigin = 'anonymous';
        image.src = dataUrl;
      });

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

      fabricCanvasRef.current.add(fabricImage);
      fabricCanvasRef.current.setActiveObject(fabricImage);
      fabricCanvasRef.current.requestRenderAll();

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  return (
    <div className="flex gap-4">
      <DrawingToolbar
        currentTool={tool}
        brushWidth={strokeWidth}
        brushColor={color}
        onToolChange={setTool}
        onBrushWidthChange={setStrokeWidth}
        onBrushColorChange={setColor}
      />
      <div className={className}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
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