import React, { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush } from 'fabric';
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
  const canvasInstanceRef = useRef<Canvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    console.log('Initializing canvas...');

    try {
      // Clean up any existing canvas instance
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
      }

      // Create new canvas instance
      const fabricCanvas = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#f9f8f4",
        isDrawingMode: true,
        selection: true,
        preserveObjectStacking: true,
      });

      canvasInstanceRef.current = fabricCanvas;
      console.log('Canvas instance created');

      // Set initial brush
      const pencilBrush = new PencilBrush(fabricCanvas);
      pencilBrush.color = "#000000";
      pencilBrush.width = 2;
      pencilBrush.strokeLineCap = 'round';
      pencilBrush.strokeLineJoin = 'round';
      fabricCanvas.freeDrawingBrush = pencilBrush;
      console.log('Initial brush set');

      // Try to load existing draft
      const hasDraft = loadDraft(fabricCanvas);
      if (hasDraft) {
        console.log('Loaded existing draft');
      }

      // Set up event listeners for canvas changes
      const saveTimeout = 1000; // 1 second debounce
      let timeoutId: NodeJS.Timeout;

      const handleCanvasChange = () => {
        console.log('Canvas change detected');
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          console.log('Saving canvas state after change');
          saveCanvasState(fabricCanvas);
        }, saveTimeout);
      };

      // Add event listeners for all relevant canvas events
      fabricCanvas.on('object:added', handleCanvasChange);
      fabricCanvas.on('object:modified', handleCanvasChange);
      fabricCanvas.on('object:removed', handleCanvasChange);
      fabricCanvas.on('path:created', handleCanvasChange);
      fabricCanvas.on('mouse:up', handleCanvasChange);

      setIsInitialized(true);
      console.log('Canvas initialization complete');

      // Cleanup
      return () => {
        console.log('Cleaning up canvas...');
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
      console.error('Error initializing canvas:', error);
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
          backgroundColor: '#f9f8f4'
        }}
      />
    </div>
  );
};

export default DrawingCanvas; 