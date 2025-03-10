import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { initializeCanvas, updateBrush, Tool } from '@/utils/canvasOperations';

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

    // Cleanup
    return () => {
      if (canvasInstanceRef.current) {
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