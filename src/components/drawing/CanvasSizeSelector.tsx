import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, Maximize2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CanvasSize {
  name: string;
  width: number;
  height: number;
}

const CANVAS_SIZES: CanvasSize[] = [
  { name: 'A4', width: 2480, height: 3508 }, // 210mm × 297mm at 300 DPI
  { name: 'A3', width: 3508, height: 4961 }, // 297mm × 420mm at 300 DPI
  { name: 'Letter', width: 2550, height: 3300 }, // 8.5" × 11" at 300 DPI
  { name: 'Tabloid', width: 3300, height: 5100 }, // 11" × 17" at 300 DPI
];

interface CanvasSizeSelectorProps {
  onSizeSelect: (width: number, height: number) => void;
}

const CanvasSizeSelector: React.FC<CanvasSizeSelectorProps> = ({ onSizeSelect }) => {
  const [selectedSize, setSelectedSize] = React.useState<CanvasSize>(CANVAS_SIZES[0]);
  const [isLandscape, setIsLandscape] = React.useState(false);

  const handleSizeChange = (sizeName: string) => {
    const size = CANVAS_SIZES.find(s => s.name === sizeName) || CANVAS_SIZES[0];
    setSelectedSize(size);
  };

  const handleOrientationChange = () => {
    setIsLandscape(!isLandscape);
  };

  const handleConfirm = () => {
    const width = isLandscape ? selectedSize.height : selectedSize.width;
    const height = isLandscape ? selectedSize.width : selectedSize.height;
    onSizeSelect(width, height);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Canvas Size</Label>
        <Select
          value={selectedSize.name}
          onValueChange={handleSizeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a size" />
          </SelectTrigger>
          <SelectContent>
            {CANVAS_SIZES.map(size => (
              <SelectItem key={size.name} value={size.name}>
                {size.name} ({isLandscape ? 
                  `${Math.round(size.height/300)}″ × ${Math.round(size.width/300)}″` : 
                  `${Math.round(size.width/300)}″ × ${Math.round(size.height/300)}″`})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant={isLandscape ? "default" : "outline"}
          onClick={handleOrientationChange}
          className="flex items-center gap-2"
        >
          <LayoutTemplate size={16} />
          {isLandscape ? "Landscape" : "Portrait"}
        </Button>

        <Button onClick={handleConfirm} className="flex items-center gap-2">
          <Maximize2 size={16} />
          Create Canvas
        </Button>
      </div>
    </div>
  );
};

export default CanvasSizeSelector; 