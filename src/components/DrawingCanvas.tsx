import React, { useEffect, useRef, useState } from 'react';
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
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<DrawingTool>('brush');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState({ h: 0, s: 100, b: 100 });

  // Convert HSB to RGB
  const hsbToRgb = (h: number, s: number, b: number): string => {
    s /= 100;
    b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return `rgb(${Math.round(f(5) * 255)}, ${Math.round(f(3) * 255)}, ${Math.round(f(1) * 255)})`;
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = hsbToRgb(color.h, color.s, color.b);
    context.lineWidth = strokeWidth;
    context.fillStyle = '#f9f8f4';
    context.fillRect(0, 0, width, height);

    contextRef.current = context;
  }, [width, height]);

  // Handle mouse/touch events
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    const point = getPoint(e, canvas);
    lastPointRef.current = point;

    if (tool === 'brush' || tool === 'eraser') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !contextRef.current || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const point = getPoint(e, canvas);

    if (tool === 'brush' || tool === 'eraser') {
      contextRef.current.lineTo(point.x, point.y);
      contextRef.current.stroke();
    }

    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;

    if (tool === 'brush' || tool === 'eraser') {
      contextRef.current.closePath();
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  // Handle tool changes
  const handleToolChange = (newTool: DrawingTool) => {
    setTool(newTool);
    if (!contextRef.current) return;

    if (newTool === 'image') {
      fileInputRef.current?.click();
      return;
    }

    contextRef.current.strokeStyle = newTool === 'eraser' 
      ? '#f9f8f4' 
      : hsbToRgb(color.h, color.s, color.b);
  };

  // Handle brush width changes
  const handleWidthChange = (width: number) => {
    setStrokeWidth(width);
    if (contextRef.current) {
      contextRef.current.lineWidth = width;
    }
  };

  // Handle color changes
  const handleColorChange = (newColor: { h: number; s: number; b: number }) => {
    setColor(newColor);
    if (contextRef.current && tool === 'brush') {
      contextRef.current.strokeStyle = hsbToRgb(newColor.h, newColor.s, newColor.b);
    }
  };

  // Handle image uploads
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !contextRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (!contextRef.current) return;

        // Scale image to fit within canvas
        const scale = Math.min(
          (width * 0.8) / img.width,
          (height * 0.8) / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        contextRef.current.drawImage(img, x, y, scaledWidth, scaledHeight);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
  };

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
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            touchAction: 'none',
            backgroundColor: '#f9f8f4'
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