import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface HSBColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

interface HSBColor {
  h: number;
  s: number;
  b: number;
}

const HSBColorPicker: React.FC<HSBColorPickerProps> = ({ value, onChange }) => {
  const [hsb, setHsb] = useState<HSBColor>({ h: 0, s: 100, b: 100 });
  const saturationRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert hex to HSB on mount
  useEffect(() => {
    const rgb = hexToRgb(value);
    if (rgb) {
      const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
      setHsb(hsb);
    }
  }, [value]);

  // Convert HSB to hex and trigger onChange
  const updateColor = useCallback((newHsb: HSBColor) => {
    const rgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  }, [onChange]);

  // Handle hue change
  const handleHueChange = useCallback((values: number[]) => {
    const newHsb = { ...hsb, h: values[0] };
    setHsb(newHsb);
    updateColor(newHsb);
  }, [hsb, updateColor]);

  // Handle saturation/brightness change via mouse/touch
  const handleSaturationMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!saturationRef.current) return;
    setIsDragging(true);
    const rect = saturationRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    const newHsb = {
      ...hsb,
      s: x * 100,
      b: (1 - y) * 100
    };
    setHsb(newHsb);
    updateColor(newHsb);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !saturationRef.current) return;
      const rect = saturationRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      
      const newHsb = {
        ...hsb,
        s: x * 100,
        b: (1 - y) * 100
      };
      setHsb(newHsb);
      updateColor(newHsb);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, hsb, updateColor]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Hue</Label>
        <Slider
          value={[hsb.h]}
          onValueChange={handleHueChange}
          min={0}
          max={360}
          step={1}
          className="hue-slider"
        />
      </div>

      <div
        ref={saturationRef}
        className="w-full h-40 rounded-lg cursor-crosshair relative"
        style={{
          background: `linear-gradient(to right, #fff, hsl(${hsb.h}, 100%, 50%))`,
          backgroundImage: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, hsl(${hsb.h}, 100%, 50%))
          `
        }}
        onMouseDown={handleSaturationMouseDown}
        onTouchStart={handleSaturationMouseDown}
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-white absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md"
          style={{
            left: `${hsb.s}%`,
            top: `${100 - hsb.b}%`,
            backgroundColor: value
          }}
        />
      </div>

      <div className="h-8 rounded-md" style={{ backgroundColor: value }} />
    </div>
  );
};

// Color conversion utilities
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHsb = (r: number, g: number, b: number): HSBColor => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100)
  };
};

const hsbToRgb = (h: number, s: number, b: number) => {
  h /= 360;
  s /= 100;
  b /= 100;
  let r = 0, g = 0, b_ = 0;

  if (s === 0) {
    r = g = b_ = b;
  } else {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = b;
        g = t;
        b_ = p;
        break;
      case 1:
        r = q;
        g = b;
        b_ = p;
        break;
      case 2:
        r = p;
        g = b;
        b_ = t;
        break;
      case 3:
        r = p;
        g = q;
        b_ = b;
        break;
      case 4:
        r = t;
        g = p;
        b_ = b;
        break;
      case 5:
        r = b;
        g = p;
        b_ = q;
        break;
    }
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b_ * 255)
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export default HSBColorPicker; 