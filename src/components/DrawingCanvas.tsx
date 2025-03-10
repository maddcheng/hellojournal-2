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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || isInitialized) {
      console.log('Canvas ref not ready or already initialized');
      return;
    }

    console.log('Starting canvas initialization...', { width, height });

    try {
      // Clean up any existing canvas instance
      if (canvasInstanceRef.current) {
        console.log('Disposing existing canvas instance');
        canvasInstanceRef.current.dispose();
      }

      // Create new canvas instance
      console.log('Creating new fabric.Canvas instance');
      const fabricCanvas = new fabric.Canvas(canvasRef.current);
      
      // Set canvas dimensions and properties
      fabricCanvas.setDimensions({
        width: width,
        height: height
      });
      fabricCanvas.backgroundColor = '#f9f8f4';
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.selection = true;
      fabricCanvas.preserveObjectStacking = true;

      // Force initial render
      fabricCanvas.renderAll();

      // Verify canvas creation
      if (!fabricCanvas) {
        throw new Error('Failed to create fabric.Canvas instance');
      }

      canvasInstanceRef.current = fabricCanvas;
      console.log('Canvas instance created successfully');

      // Set initial brush
      console.log('Setting up initial brush');
      const pencilBrush = new fabric.PencilBrush(fabricCanvas);
      pencilBrush.color = "#000000";
      pencilBrush.width = 2;
      pencilBrush.strokeLineCap = 'round';
      pencilBrush.strokeLineJoin = 'round';
      fabricCanvas.freeDrawingBrush = pencilBrush;

      // Try to load existing draft
      console.log('Attempting to load existing draft');
      const hasDraft = loadDraft(fabricCanvas);
      console.log('Draft load result:', hasDraft);

      // Set up event listeners for canvas changes
      const saveTimeout = 1000; // 1 second debounce
      let timeoutId: NodeJS.Timeout;

      const handleCanvasChange = (e: any) => {
        console.log('Canvas change detected', e.type);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (!fabricCanvas) return;
          console.log('Saving canvas state');
          const objects = fabricCanvas.getObjects();
          console.log('Current objects on canvas:', objects.length);
          saveCanvasState(fabricCanvas);
        }, saveTimeout);
      };

      // Add event listeners for all relevant canvas events
      console.log('Setting up event listeners');
      fabricCanvas.on('object:added', handleCanvasChange);
      fabricCanvas.on('object:modified', handleCanvasChange);
      fabricCanvas.on('object:removed', handleCanvasChange);
      fabricCanvas.on('path:created', handleCanvasChange);
      fabricCanvas.on('mouse:up', handleCanvasChange);

      // Add test object to verify canvas is working
      const testCircle = new fabric.Circle({
        radius: 10,
        fill: 'red',
        left: 50,
        top: 50
      });
      fabricCanvas.add(testCircle);
      console.log('Added test circle to canvas');

      // Force a render
      fabricCanvas.renderAll();

      setIsInitialized(true);
      console.log('Canvas initialization complete');

      // Cleanup
      return () => {
        console.log('Running cleanup...');
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
          console.log('Canvas cleanup complete');
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