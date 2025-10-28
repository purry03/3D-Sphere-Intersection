
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={label} className="font-medium text-gray-300">
          {label}
        </label>
        <span className="w-16 text-center px-2 py-1 text-sm bg-gray-700 rounded-md">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
};

export default Slider;
