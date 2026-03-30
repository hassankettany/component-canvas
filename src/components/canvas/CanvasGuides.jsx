import React from 'react';

export default function CanvasGuides({ guides, zoom }) {
  return (
    <svg
      className="absolute inset-0 overflow-visible pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {guides.map((guide, i) => (
        <line
          key={i}
          x1={guide.type === 'vertical' ? guide.pos : guide.start}
          y1={guide.type === 'vertical' ? guide.start : guide.pos}
          x2={guide.type === 'vertical' ? guide.pos : guide.end}
          y2={guide.type === 'vertical' ? guide.end : guide.pos}
          stroke="#f43f5e"
          strokeWidth={1 / zoom}
          strokeDasharray={`${4 / zoom} ${4 / zoom}`}
        />
      ))}
    </svg>
  );
}
