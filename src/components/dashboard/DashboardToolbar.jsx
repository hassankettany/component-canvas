import React from 'react';
import { motion } from 'framer-motion';
import { PanelLeft, Code2, Columns, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FOLDER_BADGE_STYLES } from '@/constants/colors';

const viewModes = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'split', label: 'Split', icon: Columns },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export default function DashboardToolbar({
  selectedComponent,
  componentName,
  setComponentName,
  folders,
  viewMode,
  setViewMode,
  showComments,
  setShowComments,
  commentsCount,
  onUpdateComponent,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const folder = folders.find(f => f.id === selectedComponent.folder_id);
  const color = folder?.color || 'slate';
  const colorClasses = FOLDER_BADGE_STYLES[color] || FOLDER_BADGE_STYLES.slate;

  return (
    <div className="flex items-center justify-between px-1 h-9 flex-shrink-0">
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="h-8 w-8 rounded-lg hover:bg-[#f5f5f5]">
            <PanelLeft className="w-4 h-4 text-[#a3a3a3]" />
          </Button>
        )}
        <Input
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
          onBlur={() => {
            if (selectedComponent && componentName !== selectedComponent.name) {
              onUpdateComponent(selectedComponent.id, { name: componentName });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="h-8 w-48 text-sm font-medium text-[#171717] border-transparent hover:border-[#e5e5e5] focus:border-[#a3a3a3] bg-transparent px-2 transition-colors"
        />
        <span className="text-[#d4d4d4]">/</span>
        <span className={`text-xs font-medium truncate px-2.5 py-1 rounded-md transition-colors ${colorClasses}`}>
          {folder?.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Toggle with animated indicator */}
        <div className="flex bg-white border border-[#e5e5e5] rounded-lg p-0.5 gap-px relative">
          {viewModes.map((mode) => {
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className="relative h-7 px-3 text-xs rounded-md flex items-center gap-1.5 cursor-pointer z-10 transition-colors duration-150"
                style={{ color: isActive ? '#171717' : '#a3a3a3', fontWeight: isActive ? 500 : 400 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="viewmode-indicator"
                    className="absolute inset-0 bg-[#2563eb]/10 rounded-md"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowComments(!showComments)}
          className={`relative h-8 w-8 bg-white border border-[#e5e5e5] rounded-lg transition-all ${showComments ? "bg-[#f5f5f5] text-[#171717]" : "text-[#a3a3a3] hover:text-[#737373]"}`}
          title="Comments"
        >
          <MessageSquare className="w-4 h-4" />
          {commentsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full border-2 border-white">
              {commentsCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
