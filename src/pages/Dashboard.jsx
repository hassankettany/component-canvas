import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeft, Search } from 'lucide-react';
import { useFolders } from '@/hooks/useFolders';
import { useComponents } from '@/hooks/useComponents';
import { useComments } from '@/hooks/useComments';
import ModeSwitcher from '../components/common/ModeSwitcher';
import FindReplaceDialog from '../components/common/FindReplaceDialog';
import { Button } from '@/components/ui/button';
import CodeEditor from '../components/canvas/CodeEditor';
import PreviewPane from '../components/canvas/PreviewPane';
import CommentPanel from '../components/canvas/CommentPanel';
import FileExplorer from '../components/dashboard/FileExplorer';
import DashboardToolbar from '../components/dashboard/DashboardToolbar';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
    const { components, createComponent, updateComponent, batchUpdateComponents, deleteComponent } = useComponents();

    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState('split');
    const [componentName, setComponentName] = useState("");
    const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

    const { comments } = useComments(selectedComponentId);

    const selectedComponent = components.find(c => c.id === selectedComponentId);

    useEffect(() => {
        if (selectedComponent) {
            setComponentName(selectedComponent.name);
        }
    }, [selectedComponent?.id, selectedComponent?.name]);

    // --- Handlers ---

    const handleCodeUpdate = (id, updates) => {
        updateComponent(id, updates);
    };

    const handleAddComment = (commentData) => {
        // Note: CommentPanel manages its own comment creation via useComments hook
    };

    const handleCreateFolder = () => createFolder("New Folder");

    const handleCreateComponent = (folderId) => {
        createComponent({
            name: "New Component",
            folder_id: folderId,
            code: "<!-- New Component -->\n<div>Hello World</div>",
            position: { x: 100, y: 100 },
            size: { width: 900, height: 600 },
            mode: 'edit'
        });
    };

    return (
        <div className="flex h-screen bg-[#fafafa] overflow-hidden p-4 gap-4 relative">
            <ModeSwitcher currentMode="dashboard" />

            {/* Sidebar Open Button — below ModeSwitcher, always visible */}
            {!isSidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute left-4 top-16 z-[101] h-8 w-8 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5]"
                    title="Open Sidebar"
                >
                    <PanelLeft className="w-4 h-4 text-[#a3a3a3]" />
                </Button>
            )}

            {/* Sidebar */}
            <div className={cn(
                "flex flex-col transition-all duration-300 ease-in-out overflow-hidden rounded-[10px] bg-white border border-[#e5e5e5] z-20",
                isSidebarOpen ? "w-72 ml-0" : "w-0 -ml-4 opacity-0"
            )}>
                <div className="px-4 pb-3 pt-14 border-b border-[#f0f0f0] flex items-center justify-between min-w-[288px]">
                    <div className="flex items-center gap-1 ml-auto">
                        <Button variant="ghost" size="icon" onClick={() => setIsFindReplaceOpen(true)} title="Find & Replace" className="h-8 w-8 hover:bg-[#f5f5f5]">
                            <Search className="w-4 h-4 text-[#a3a3a3]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} title="Close Sidebar" className="h-8 w-8 hover:bg-[#f5f5f5]">
                            <PanelLeftClose className="w-4 h-4 text-[#a3a3a3]" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden min-w-[288px]">
                    <FileExplorer
                        folders={folders}
                        components={components}
                        selectedComponentId={selectedComponentId}
                        onSelectComponent={setSelectedComponentId}
                        onUpdateFolder={(id, data) => updateFolder(id, data)}
                        onUpdateComponent={(id, data) => updateComponent(id, data)}
                        onCreateFolder={handleCreateFolder}
                        onCreateComponent={handleCreateComponent}
                        onDeleteFolder={(id) => deleteFolder(id)}
                        onDeleteComponent={(id) => deleteComponent(id)}
                    />
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col min-w-0 gap-4">
                {selectedComponent ? (
                    <>
                        <DashboardToolbar
                            selectedComponent={selectedComponent}
                            componentName={componentName}
                            setComponentName={setComponentName}
                            folders={folders}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            showComments={showComments}
                            setShowComments={setShowComments}
                            commentsCount={comments.length}
                            onUpdateComponent={(id, data) => updateComponent(id, data)}
                            isSidebarOpen={isSidebarOpen}
                            setIsSidebarOpen={setIsSidebarOpen}
                        />

                        {/* Editor & Preview Split */}
                        <div className="flex-1 flex overflow-hidden relative gap-3">
                            {/* Editor Section */}
                            <div className={cn(
                                "flex flex-col bg-white border border-[#e5e5e5] rounded-[10px] relative transition-all duration-200 ease-out overflow-hidden",
                                viewMode === 'preview' ? "w-0 border-none opacity-0" :
                                viewMode === 'split' ? "w-1/2 opacity-100" :
                                "w-full opacity-100"
                            )}>
                                <div className="absolute top-3 right-3 z-10 text-[9px] font-semibold uppercase tracking-wider text-[#d4d4d4]">
                                    EDITOR
                                </div>
                                <div className="w-full h-full">
                                    <CodeEditor component={selectedComponent} onUpdate={handleCodeUpdate} />
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className={cn(
                                "flex flex-col bg-white border border-[#e5e5e5] rounded-[10px] relative transition-all duration-200 ease-out overflow-hidden",
                                viewMode === 'code' ? "w-0 p-0 border-none opacity-0" :
                                viewMode === 'split' ? "w-1/2 p-4 opacity-100" :
                                "w-full p-6 opacity-100"
                            )}>
                                <div className="absolute top-3 right-3 z-10 text-[9px] font-semibold uppercase tracking-wider text-[#d4d4d4]">
                                    PREVIEW
                                </div>
                                <div className="w-full h-full overflow-hidden">
                                    <PreviewPane component={selectedComponent} />
                                </div>
                            </div>

                            {/* Comments Overlay */}
                            {showComments && (
                                <div className="absolute top-4 right-4 w-96 h-[calc(100%-2rem)] z-50">
                                    <CommentPanel
                                        componentId={selectedComponent.id}
                                        onClose={() => setShowComments(false)}
                                        className="w-full h-full shadow-2xl border-slate-200"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <DashboardEmptyState />
                )}
            </div>

            <FindReplaceDialog
                isOpen={isFindReplaceOpen}
                onClose={() => setIsFindReplaceOpen(false)}
                components={components}
                onBatchUpdate={(updates) => batchUpdateComponents(updates)}
            />
        </div>
    );
}
