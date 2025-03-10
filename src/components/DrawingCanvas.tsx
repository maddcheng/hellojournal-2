import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Clean up any existing canvas instance
    if (canvasInstanceRef.current) {
      canvasInstanceRef.current.dispose();
    }

    // Create new canvas instance
    const fabricCanvas = initializeCanvas(canvasRef.current, width, height);
    canvasInstanceRef.current = fabricCanvas;

    // Set initial brush
    updateBrush(fabricCanvas, 'pen', 2, '#000000');

    // Try to load existing draft
    const hasDraft = loadDraft(fabricCanvas);
    if (hasDraft) {
      console.log('Loaded existing draft');
    }

    // Set up event listeners for canvas changes
    const saveTimeout = 1000; // 1 second debounce
    let timeoutId: NodeJS.Timeout;

    const handleCanvasChange = () => {
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

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.off('object:added', handleCanvasChange);
        canvasInstanceRef.current.off('object:modified', handleCanvasChange);
        canvasInstanceRef.current.off('object:removed', handleCanvasChange);
        canvasInstanceRef.current.off('path:created', handleCanvasChange);
        canvasInstanceRef.current.dispose();
      }
    };
  }, [width, height]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ccc',
          width: width,
          height: height,
          backgroundColor: '#f9f8f4'
        }}
      />
    </div>
  );
};

export default DrawingCanvas; 