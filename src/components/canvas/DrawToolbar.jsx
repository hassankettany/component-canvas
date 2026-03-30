import React from 'react';
import { motion } from 'framer-motion';

const DRAW_COLORS = [
  { key: 'black',  value: '#171717' },
  { key: 'red',    value: '#dc2626' },
  { key: 'blue',   value: '#2563eb' },
  { key: 'green',  value: '#16a34a' },
  { key: 'orange', value: '#ea580c' },
];

const THICKNESSES = [
  { key: 'thin',   value: 2, label: 'S' },
  { key: 'medium', value: 4, label: 'M' },
  { key: 'thick',  value: 8, label: 'L' },
];

export default function DrawToolbar({ color, thickness, onColorChange, onThicknessChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-[68px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-lg px-3 py-2"
    >
      {/* Color pickers */}
      <div className="flex items-center gap-1.5">
        {DRAW_COLORS.map((c) => (
          <button
            key={c.key}
            className="w-5 h-5 rounded-full transition-transform"
            style={{
              backgroundColor: c.value,
              transform: color === c.value ? 'scale(1.25)' : 'scale(1)',
              boxShadow: color === c.value ? `0 0 0 2px white, 0 0 0 3px ${c.value}` : 'none',
            }}
            onClick={() => onColorChange(c.value)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#e5e5e5]" />

      {/* Thickness buttons */}
      <div className="flex items-center gap-1">
        {THICKNESSES.map((t) => (
          <button
            key={t.key}
            className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor: thickness === t.value ? '#f5f5f5' : 'transparent',
              color: '#525252',
            }}
            onClick={() => onThicknessChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
