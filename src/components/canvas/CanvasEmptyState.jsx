import React from 'react';
import { Plus } from 'lucide-react';

export default function CanvasEmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5f5f5] mb-4">
          <Plus className="w-8 h-8 text-[#a3a3a3]" />
        </div>
        <h2 className="text-xl font-medium text-[#171717] mb-2">
          Your canvas is empty
        </h2>
        <p className="text-[#a3a3a3]">
          Click "Add Component" to start prototyping
        </p>
      </div>
    </div>
  );
}
