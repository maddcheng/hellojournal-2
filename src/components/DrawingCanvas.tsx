import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { initializeCanvas, updateBrush, Tool, saveCanvasState, loadDraft } from '@/utils/canvasOperations';

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    try {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
      }

      const fabricCanvas = new fabric.Canvas(canvasRef.current);
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.backgroundColor = '#f9f8f4';
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.selection = true;
      fabricCanvas.preserveObjectStacking = true;
      fabricCanvas.renderAll();

      canvasInstanceRef.current = fabricCanvas;

      const pencilBrush = new fabric.PencilBrush(fabricCanvas);
      pencilBrush.color = "#000000";
      pencilBrush.width = 2;
      pencilBrush.strokeLineCap = 'round';
      pencilBrush.strokeLineJoin = 'round';
      fabricCanvas.freeDrawingBrush = pencilBrush;

      const hasDraft = loadDraft(fabricCanvas);

      const saveTimeout = 1000;
      let timeoutId: NodeJS.Timeout;

      const handleCanvasChange = (e: any) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (!fabricCanvas) return;
          saveCanvasState(fabricCanvas);
        }, saveTimeout);
      };

      fabricCanvas.on('object:added', handleCanvasChange);
      fabricCanvas.on('object:modified', handleCanvasChange);
      fabricCanvas.on('object:removed', handleCanvasChange);
      fabricCanvas.on('path:created', handleCanvasChange);
      fabricCanvas.on('mouse:up', handleCanvasChange);

      setIsInitialized(true);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (canvasInstanceRef.current) {
          canvasInstanceRef.current.off('object:added', handleCanvasChange);
          canvasInstanceRef.current.off('object:modified', handleCanvasChange);
          canvasInstanceRef.current.off('object:removed', handleCanvasChange);
          canvasInstanceRef.current.off('path:created', handleCanvasChange);
          canvasInstanceRef.current.off('mouse:up', handleCanvasChange);
          canvasInstanceRef.current.dispose();
          setIsInitialized(false);
        }
      };
    } catch (error) {
      console.error('Error in canvas initialization:', error);
      setIsInitialized(false);
    }
  }, [width, height, isInitialized]);

  return (
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
    </div>
  );
};

export default DrawingCanvas; 