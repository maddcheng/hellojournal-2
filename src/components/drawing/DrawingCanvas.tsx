import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { HSBColorPicker } from './HSBColorPicker';
import { ToolButton } from './ToolButton';
import { CanvasSizeSelector } from './CanvasSizeSelector';

interface DrawingCanvasProps {
  onSave?: (canvas: fabric.Canvas) => void;
  initialData?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });

      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = brushSize;

      setFabricCanvas(canvas);

      if (initialData) {
        canvas.loadFromJSON(initialData, canvas.renderAll.bind(canvas));
      }
    }

    return () => {
      fabricCanvas?.dispose();
    };
  }, []);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : currentColor;
      fabricCanvas.renderAll();
    }
  }, [currentColor, tool, fabricCanvas]);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.freeDrawingBrush.width = brushSize;
      fabricCanvas.renderAll();
    }
  }, [brushSize, fabricCanvas]);

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (tool === 'eraser') {
      setTool('brush');
    }
  };

  const handleToolChange = (newTool: 'brush' | 'eraser') => {
    setTool(newTool);
  };

  const handleSizeChange = (size: number) => {
    setBrushSize(size);
  };

  const handleClear = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
    }
  };

  const handleSave = () => {
    if (fabricCanvas && onSave) {
      onSave(fabricCanvas);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 mb-4">
        <ToolButton
          icon="brush"
          active={tool === 'brush'}
          onClick={() => handleToolChange('brush')}
        />
        <ToolButton
          icon="eraser"
          active={tool === 'eraser'}
          onClick={() => handleToolChange('eraser')}
        />
        <HSBColorPicker color={currentColor} onChange={handleColorChange} />
        <CanvasSizeSelector size={brushSize} onChange={handleSizeChange} />
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleClear}
        >
          Clear
        </button>
        {onSave && (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleSave}
          >
            Save
          </button>
        )}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}; 