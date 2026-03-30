import React, { useState } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, ChevronDown, Plus, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { FOLDER_ICON_STYLES } from '@/constants/colors';

export default function FolderSelector({ currentFolderId, onFolderChange }) {
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const { folders, createFolderMutation } = useFolders();

    const currentFolder = folders.find(f => f.id === currentFolderId);

    const handleCreateFolder = (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        createFolderMutation.mutate(newFolderName, {
            onSuccess: (newFolder) => {
                setNewFolderName("");
                setIsCreating(false);
                onFolderChange(newFolder.id);
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-[#a3a3a3] hover:text-[#171717] px-2 font-normal"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <Folder className={cn("w-4 h-4", FOLDER_ICON_STYLES[currentFolder?.color] || "text-slate-500")} />
                    <span className="max-w-[100px] truncate">
                        {currentFolder?.name || 'Select Folder'}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <div
                    className="max-h-[300px] overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {folders.map(folder => (
                        <DropdownMenuItem
                            key={folder.id}
                            onClick={() => onFolderChange(folder.id)}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Folder className={cn("w-4 h-4", FOLDER_ICON_STYLES[folder.color] || "text-slate-400")} />
                                <span>{folder.name}</span>
                            </div>
                            {currentFolderId === folder.id && (
                                <Check className="w-3 h-3 text-indigo-600" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                    {isCreating ? (
                        <form onSubmit={handleCreateFolder} className="flex gap-1">
                            <Input
                                autoFocus
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                placeholder="Name..."
                                className="h-8 text-xs"
                            />
                            <Button type="submit" size="icon" className="h-8 w-8">
                                <Plus className="w-3 h-3" />
                            </Button>
                        </form>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-8"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsCreating(true);
                            }}
                        >
                            <Plus className="w-3 h-3 mr-2" />
                            Create New Folder
                        </Button>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
