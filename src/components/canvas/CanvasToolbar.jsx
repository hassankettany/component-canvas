import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Filter,
  RefreshCw,
  Check,
  Eye,
  Code2,
  Search,
} from 'lucide-react';
import { FOLDER_CHECKBOX_STYLES } from '@/constants/colors';
import { ZOOM_LIMITS } from '@/constants/canvas';

export default function CanvasToolbar({
  folders,
  visibleFolderIds,
  toggleFolderVisibility,
  reorganizeLayout,
  globalMode,
  onToggleGlobalMode,
  zoom,
  setZoom,
  addComponent,
  onOpenFindReplace,
}) {
  return (
    <>
      {/* Floating Tools Bar (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <div className="flex items-center bg-white border border-[#e5e5e5] rounded-lg p-1.5 gap-1">
          {/* Folder Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg h-8 px-3 text-[#737373] hover:bg-slate-100/50 gap-2"
              >
                <Filter className="w-3.5 h-3.5" />
                Folders
                {visibleFolderIds.has('ALL') ? (
                  <span className="bg-[#f0f0f0] text-[#525252] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    All
                  </span>
                ) : (
                  <span className="bg-[#f0f0f0] text-[#525252] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {visibleFolderIds.size}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="center">
              <div className="space-y-1">
                <div
                  className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-md cursor-pointer"
                  onClick={() => toggleFolderVisibility('ALL')}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      visibleFolderIds.has('ALL')
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {visibleFolderIds.has('ALL') && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">All Folders</span>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                {folders?.map((folder) => {
                  const isSelected =
                    visibleFolderIds.has('ALL') ||
                    visibleFolderIds.has(folder.id);
                  const checkboxStyle = isSelected
                    ? FOLDER_CHECKBOX_STYLES[folder.color] ||
                      FOLDER_CHECKBOX_STYLES.slate
                    : 'border-slate-300';

                  return (
                    <div
                      key={folder.id}
                      className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-md cursor-pointer"
                      onClick={() => toggleFolderVisibility(folder.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${checkboxStyle}`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm">{folder.name}</span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-4 bg-[#e5e5e5] mx-1" />

          {/* Refresh Layout */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-8 w-8 text-[#737373] hover:bg-slate-100/50"
            onClick={reorganizeLayout}
            title="Reorganize Layout"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-[#e5e5e5] mx-1" />

          {/* View Mode Switcher */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-8 px-3 text-[#737373] hover:bg-slate-100/50 gap-2"
            onClick={onToggleGlobalMode}
          >
            {globalMode === 'preview' ? (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            ) : (
              <>
                <Code2 className="w-4 h-4" />
                Code
              </>
            )}
          </Button>
        </div>

        {/* Search Circle */}
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-lg bg-white border border-[#e5e5e5] hover:bg-white text-[#737373]"
          onClick={onOpenFindReplace}
          title="Find & Replace"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Floating Actions (Top Right) */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {/* Zoom Control */}
        <div className="flex items-center bg-white border border-[#e5e5e5] rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-slate-100/50"
            onClick={() => setZoom((z) => Math.max(ZOOM_LIMITS.min, z - 0.1))}
          >
            <ZoomOut className="w-4 h-4 text-[#737373]" />
          </Button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-[#171717]">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-slate-100/50"
            onClick={() => setZoom((z) => Math.min(ZOOM_LIMITS.max, z + 0.1))}
          >
            <ZoomIn className="w-4 h-4 text-[#737373]" />
          </Button>
        </div>

        {/* Add Component */}
        <Button
          onClick={addComponent}
          className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white rounded-lg px-4 h-11"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Component
        </Button>
      </div>
    </>
  );
}
