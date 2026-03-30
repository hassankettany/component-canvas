import React, { useState, useEffect } from 'react';
import { 
    Folder, FileCode, ChevronRight, Plus, MoreHorizontal, 
    Trash2, Edit2, Palette, FolderPlus, FilePlus 
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COLORS, FOLDER_ICON_STYLES, FOLDER_DOT_STYLES } from '@/constants/colors';

export default function FileExplorer({ 
    folders, components, selectedComponentId, 
    onSelectComponent, onUpdateFolder, onUpdateComponent, 
    onCreateFolder, onCreateComponent, onDeleteFolder, onDeleteComponent 
}) {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [renamingItem, setRenamingItem] = useState(null); // { type: 'folder'|'file', id: string }
    const [renameValue, setRenameValue] = useState("");

    // Optimistic state
    const [optimisticFolders, setOptimisticFolders] = useState([]);
    const [optimisticComponents, setOptimisticComponents] = useState([]);

    useEffect(() => {
        setOptimisticFolders([...folders].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, [folders]);

    useEffect(() => {
        setOptimisticComponents(components);
    }, [components]);

    // Initialize expanded folders (all folders expanded by default)
    useEffect(() => {
        if (folders.length > 0 && expandedFolders.size === 0) {
            setExpandedFolders(new Set(folders.map(f => f.id)));
        }
    }, [folders.length]);

    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleDragEnd = (result) => {
        const { source, destination, type } = result;
        if (!destination) return;

        if (type === 'FOLDER') {
            const newFolders = [...optimisticFolders];
            const [reorderedItem] = newFolders.splice(source.index, 1);
            newFolders.splice(destination.index, 0, reorderedItem);
            
            const updatedFolders = newFolders.map((folder, index) => ({ ...folder, order: index }));
            setOptimisticFolders(updatedFolders); // Update UI immediately

            updatedFolders.forEach((folder) => {
                const original = folders.find(f => f.id === folder.id);
                if (original && original.order !== folder.order) {
                    onUpdateFolder(folder.id, { order: folder.order });
                }
            });
        } else if (type === 'FILE') {
            const sourceFolderId = source.droppableId;
            const destFolderId = destination.droppableId;
            
            // Get all components excluding the moved one
            let currentComponents = [...optimisticComponents];
            const movedItem = currentComponents
                .filter(c => c.folder_id === sourceFolderId)
                .sort((a, b) => (a.order || 0) - (b.order || 0))[source.index];
            
            if (!movedItem) return;

            // Remove moved item from list
            currentComponents = currentComponents.filter(c => c.id !== movedItem.id);
            
            // Create updated item
            const updatedMovedItem = { ...movedItem, folder_id: destFolderId };

            // Prepare destination list
            const destList = currentComponents
                .filter(c => c.folder_id === destFolderId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            // Insert at new position
            destList.splice(destination.index, 0, updatedMovedItem);

            // Prepare source list (if different)
            const sourceList = sourceFolderId !== destFolderId 
                ? currentComponents
                    .filter(c => c.folder_id === sourceFolderId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                : [];

            // Reconstruct optimistic components and fire updates
            const newOptimisticComponents = [];
            const updatesToFire = [];

            const processComp = (comp, index, fid) => {
                const newComp = { ...comp, order: index, folder_id: fid };
                newOptimisticComponents.push(newComp);
                
                const original = components.find(c => c.id === comp.id);
                if (!original || original.order !== index || original.folder_id !== fid) {
                    updatesToFire.push({ id: comp.id, data: { order: index, folder_id: fid } });
                }
            };

            // Add unaffected components
            currentComponents.forEach(c => {
                if (c.folder_id !== sourceFolderId && c.folder_id !== destFolderId) {
                    newOptimisticComponents.push(c);
                }
            });

            // Process lists
            if (sourceFolderId === destFolderId) {
                destList.forEach((c, i) => processComp(c, i, destFolderId));
            } else {
                sourceList.forEach((c, i) => processComp(c, i, sourceFolderId));
                destList.forEach((c, i) => processComp(c, i, destFolderId));
            }

            setOptimisticComponents(newOptimisticComponents);
            updatesToFire.forEach(u => onUpdateComponent(u.id, u.data));

            if (sourceFolderId !== destFolderId && !expandedFolders.has(destFolderId)) {
                toggleFolder(destFolderId);
            }
        }
    };

    const startRename = (type, item) => {
        setRenamingItem({ type, id: item.id });
        setRenameValue(item.name);
    };

    const handleRenameSubmit = () => {
        if (!renamingItem || !renameValue.trim()) return;
        
        if (renamingItem.type === 'folder') {
            onUpdateFolder(renamingItem.id, { name: renameValue });
        } else {
            onUpdateComponent(renamingItem.id, { name: renameValue });
        }
        setRenamingItem(null);
        setRenameValue("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 border-b border-[#f0f0f0] flex justify-between items-center">
                <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider pl-2">Explorer</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => onCreateFolder()}
                    title="New Folder"
                >
                    <FolderPlus className="w-4 h-4 text-[#a3a3a3]" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="all-folders" type="FOLDER">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="pb-4">
                                {optimisticFolders.map((folder, index) => {
                                    const folderComponents = optimisticComponents
                                        .filter(c => c.folder_id === folder.id)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0));
                                        
                                    return (
                                        <Draggable key={folder.id} draggableId={folder.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn("mb-0.5", snapshot.isDragging && "opacity-50")}
                                                >
                                                    <ContextMenu>
                                                        <ContextMenuTrigger>
                                                            <div 
                                                                className={cn(
                                                                    "group flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#f5f5f5] border-l-2 border-transparent transition-colors",
                                                                    expandedFolders.has(folder.id) ? "border-[#d4d4d4]" : ""
                                                                )}
                                                                onClick={() => toggleFolder(folder.id)}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <ChevronRight className={cn(
                                                                    "w-3.5 h-3.5 mr-1.5 text-[#a3a3a3] transition-transform",
                                                                    expandedFolders.has(folder.id) && "rotate-90"
                                                                )} />
                                                                <Folder className={cn(
                                                                    "w-4 h-4 mr-2", 
                                                                    FOLDER_ICON_STYLES[folder.color] || FOLDER_ICON_STYLES.slate
                                                                )} />
                                                                {renamingItem?.type === 'folder' && renamingItem.id === folder.id ? (
                                                                    <Input
                                                                        value={renameValue}
                                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                                        onBlur={handleRenameSubmit}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        autoFocus
                                                                        className="h-6 text-sm py-0 px-1.5"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm text-[#171717] font-medium flex-1 truncate select-none">
                                                                        {folder.name}
                                                                    </span>
                                                                )}
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                                    <Button 
                                                                        variant="ghost" size="icon" className="h-5 w-5"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onCreateComponent(folder.id);
                                                                            if (!expandedFolders.has(folder.id)) toggleFolder(folder.id);
                                                                        }}
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 text-[#a3a3a3]" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </ContextMenuTrigger>
                                                        <ContextMenuContent className="w-48">
                                                            <ContextMenuItem onClick={() => {
                                                                onCreateComponent(folder.id);
                                                                if (!expandedFolders.has(folder.id)) toggleFolder(folder.id);
                                                            }}>
                                                                <FilePlus className="w-4 h-4 mr-2" />
                                                                New File
                                                            </ContextMenuItem>
                                                            <ContextMenuItem onClick={() => startRename('folder', folder)}>
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Rename
                                                            </ContextMenuItem>
                                                            <ContextMenuSub>
                                                                <ContextMenuSubTrigger>
                                                                    <Palette className="w-4 h-4 mr-2" />
                                                                    Color
                                                                </ContextMenuSubTrigger>
                                                                <ContextMenuSubContent className="w-36 h-64 overflow-y-auto">
                                                                    {COLORS.map(color => (
                                                                        <ContextMenuItem 
                                                                            key={color}
                                                                            onClick={() => onUpdateFolder(folder.id, { color })}
                                                                        >
                                                                            <div className={cn("w-3 h-3 rounded-full mr-2", FOLDER_DOT_STYLES[color] || FOLDER_DOT_STYLES.slate)} />
                                                                            <span className="capitalize">{color}</span>
                                                                        </ContextMenuItem>
                                                                    ))}
                                                                </ContextMenuSubContent>
                                                            </ContextMenuSub>
                                                            <ContextMenuSeparator />
                                                            <ContextMenuItem 
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                onClick={() => onDeleteFolder(folder.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </ContextMenuItem>
                                                        </ContextMenuContent>
                                                    </ContextMenu>

                                                    <Droppable droppableId={folder.id} type="FILE">
                                                        {(provided, snapshot) => (
                                                            <div
                                                                {...provided.droppableProps}
                                                                ref={provided.innerRef}
                                                                className={cn(
                                                                    "ml-4 pl-2 border-l border-[#f0f0f0] transition-all duration-150",
                                                                    expandedFolders.has(folder.id)
                                                                        ? "min-h-[2px]"
                                                                        : snapshot.isDraggingOver
                                                                            ? "bg-indigo-50/50 min-h-[24px] border-l-indigo-300"
                                                                            : "min-h-[8px] overflow-hidden",
                                                                    expandedFolders.has(folder.id) && snapshot.isDraggingOver && "bg-indigo-50/50"
                                                                )}
                                                            >
                                                                {(expandedFolders.has(folder.id) || snapshot.isDraggingOver) && folderComponents.map((comp, compIndex) => (
                                                                        <Draggable key={comp.id} draggableId={comp.id} index={compIndex}>
                                                                            {(provided, snapshot) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    className="outline-none"
                                                                                >
                                                                                    <ContextMenu>
                                                                                        <ContextMenuTrigger>
                                                                                            <div 
                                                                                                className={cn(
                                                                                                    "flex items-center px-2 py-1.5 my-0.5 rounded-md cursor-pointer text-sm group transition-all",
                                                                                                    selectedComponentId === comp.id
                                                                                                        ? "bg-[#f5f5f5] text-[#171717]"
                                                                                                        : "text-[#525252] hover:bg-[#f5f5f5]",
                                                                                                    snapshot.isDragging && "bg-white ring-1 ring-[#e5e5e5] rotate-2"
                                                                                                )}
                                                                                                onClick={() => onSelectComponent(comp.id)}
                                                                                            >
                                                                                                <FileCode className={cn(
                                                                                                    "w-3.5 h-3.5 mr-2 flex-shrink-0", 
                                                                                                    selectedComponentId === comp.id ? "text-[#171717]" : "text-[#a3a3a3]"
                                                                                                )} />
                                                                                                {renamingItem?.type === 'file' && renamingItem.id === comp.id ? (
                                                                                                    <Input
                                                                                                        value={renameValue}
                                                                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                                                                        onBlur={handleRenameSubmit}
                                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                                        autoFocus
                                                                                                        className="h-5 text-sm py-0 px-1.5"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <span className="truncate">{comp.name}</span>
                                                                                                )}
                                                                                                </div>
                                                                                                </ContextMenuTrigger>
                                                                                                <ContextMenuContent>
                                                                                            <ContextMenuItem onClick={() => startRename('file', comp)}>
                                                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                                                Rename
                                                                                            </ContextMenuItem>
                                                                                            <ContextMenuItem 
                                                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                                                onClick={() => onDeleteComponent(comp.id)}
                                                                                            >
                                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                                Delete
                                                                                            </ContextMenuItem>
                                                                                        </ContextMenuContent>
                                                                                    </ContextMenu>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                {provided.placeholder}
                                                                {expandedFolders.has(folder.id) && folderComponents.length === 0 && !snapshot.isDraggingOver && (
                                                                     <div className="py-2 px-2 text-xs text-[#a3a3a3] italic">Empty</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

        </div>
    );
}