import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Brush,
  Eraser,
  Image as ImageIcon,
  Lasso,
  Move
} from 'lucide-react';

export type DrawingTool = 'brush' | 'eraser' | 'image' | 'lasso' | 'adjust';

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  brushWidth: number;
  brushColor: { h: number; s: number; b: number };
  onToolChange: (tool: DrawingTool) => void;
  onBrushWidthChange: (width: number) => void;
  onBrushColorChange: (color: { h: number; s: number; b: number }) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  brushWidth,
  brushColor,
  onToolChange,
  onBrushWidthChange,
  onBrushColorChange,
}) => {
  const hsbToRgb = (h: number, s: number, b: number) => {
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
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b1 * 255)
    };
  };

  const currentColor = hsbToRgb(brushColor.h, brushColor.s, brushColor.b);
  const colorStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <div className="flex gap-2">
        <Button
          variant={currentTool === 'brush' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('brush')}
        >
          <Brush className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === 'eraser' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('eraser')}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === 'image' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('image')}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === 'lasso' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('lasso')}
        >
          <Lasso className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === 'adjust' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('adjust')}
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>

      {(currentTool === 'brush' || currentTool === 'eraser') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Width</label>
            <Slider
              value={[brushWidth]}
              min={1}
              max={50}
              step={1}
              onValueChange={([value]) => onBrushWidthChange(value)}
            />
          </div>

          {currentTool === 'brush' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hue</label>
                <div
                  className="h-4 rounded-md"
                  style={{
                    background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                  }}
                >
                  <Slider
                    value={[brushColor.h]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([h]) => onBrushColorChange({ ...brushColor, h })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Saturation</label>
                <div
                  className="h-4 rounded-md"
                  style={{
                    background: `linear-gradient(to right, hsl(${brushColor.h}, 0%, ${brushColor.b}%), hsl(${brushColor.h}, 100%, ${brushColor.b}%))`
                  }}
                >
                  <Slider
                    value={[brushColor.s]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([s]) => onBrushColorChange({ ...brushColor, s })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brightness</label>
                <div
                  className="h-4 rounded-md"
                  style={{
                    background: `linear-gradient(to right, hsl(${brushColor.h}, ${brushColor.s}%, 0%), hsl(${brushColor.h}, ${brushColor.s}%, 100%))`
                  }}
                >
                  <Slider
                    value={[brushColor.b]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([b]) => onBrushColorChange({ ...brushColor, b })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Current Color:</div>
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: colorStyle }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 