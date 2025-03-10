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
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('brush');
  const [brushWidth, setBrushWidth] = useState(2);
  const [brushColor, setBrushColor] = useState({ h: 0, s: 100, b: 100 });

  const hsbToHex = (h: number, s: number, b: number): string => {
    const hue = h / 360;
    const saturation = s / 100;
    const brightness = b / 100;
    
    let r, g, b1;
    const i = Math.floor(hue * 6);
    const f = hue * 6 - i;
    const p = brightness * (1 - saturation);
    const q = brightness * (1 - f * saturation);
    const t = brightness * (1 - (1 - f) * saturation);
    
    switch (i % 6) {
      case 0: r = brightness; g = t; b1 = p; break;
      case 1: r = q; g = brightness; b1 = p; break;
      case 2: r = p; g = brightness; b1 = t; break;
      case 3: r = p; g = q; b1 = brightness; break;
      case 4: r = t; g = p; b1 = brightness; break;
      case 5: r = brightness; g = p; b1 = q; break;
      default: r = 0; g = 0; b1 = 0;
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b1)}`;
  };

  const handleToolChange = (tool: DrawingTool) => {
    if (!canvasInstanceRef.current) return;
    const canvas = canvasInstanceRef.current;

    setCurrentTool(tool);
    
    switch (tool) {
      case 'brush':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = hsbToHex(brushColor.h, brushColor.s, brushColor.b);
          canvas.freeDrawingBrush.width = brushWidth;
        }
        break;
      
      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = '#f9f8f4';
          canvas.freeDrawingBrush.width = brushWidth;
        }
        break;
      
      case 'image':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        fileInputRef.current?.click();
        break;
      
      case 'lasso':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
      
      case 'adjust':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.hasControls = true;
          obj.evented = true;
        });
        break;
    }
  };

  const handleBrushWidthChange = (width: number) => {
    setBrushWidth(width);
    if (canvasInstanceRef.current?.freeDrawingBrush) {
      canvasInstanceRef.current.freeDrawingBrush.width = width;
    }
  };

  const handleBrushColorChange = (color: { h: number; s: number; b: number }) => {
    setBrushColor(color);
    if (currentTool === 'brush' && canvasInstanceRef.current?.freeDrawingBrush) {
      canvasInstanceRef.current.freeDrawingBrush.color = hsbToHex(color.h, color.s, color.b);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasInstanceRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const fabricImage = new fabric.Image(img);
        
        // Scale image to fit within canvas while maintaining aspect ratio
        const scale = Math.min(
          (width * 0.8) / fabricImage.width!,
          (height * 0.8) / fabricImage.height!
        );
        
        fabricImage.scale(scale);
        fabricImage.set({
          left: (width - fabricImage.width! * scale) / 2,
          top: (height - fabricImage.height! * scale) / 2
        });
        
        canvasInstanceRef.current?.add(fabricImage);
        canvasInstanceRef.current?.setActiveObject(fabricImage);
        canvasInstanceRef.current?.renderAll();
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
      }

      const canvas = new fabric.Canvas(canvasRef.current);
      canvas.setDimensions({ width, height });
      canvas.backgroundColor = '#f9f8f4';
      canvas.isDrawingMode = true;
      canvas.renderAll();

      canvasInstanceRef.current = canvas;

      const pencilBrush = new fabric.PencilBrush(canvas);
      pencilBrush.color = hsbToHex(brushColor.h, brushColor.s, brushColor.b);
      pencilBrush.width = brushWidth;
      pencilBrush.strokeLineCap = 'round';
      pencilBrush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush = pencilBrush;

      // Load any saved state here if needed

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      console.error('Error in canvas initialization:', error);
    }
  }, [width, height]);

  return (
    <div className="flex gap-4">
      <DrawingToolbar
        currentTool={currentTool}
        brushWidth={brushWidth}
        brushColor={brushColor}
        onToolChange={handleToolChange}
        onBrushWidthChange={handleBrushWidthChange}
        onBrushColorChange={handleBrushColorChange}
      />
      <div className={className}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            border: '1px solid #ccc',
            backgroundColor: '#f9f8f4',
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