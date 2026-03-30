import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, GripVertical, Code2, Eye, MessageSquare } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import CodeEditor from './CodeEditor';
import PreviewPane from './PreviewPane';
import CommentPanel from './CommentPanel';
import FolderSelector from '@/components/common/FolderSelector';
import { debounce } from 'lodash';
import { FOLDER_HEADER_STYLES } from '@/constants/colors';

const ComponentWindow = memo(function ComponentWindow({ component, folderColor = 'slate', onUpdate, onSave, onDelete, onBringToFront, scale = 1, onDragEnd }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const dragInfo = useRef({ startX: 0, startY: 0, initialPos: { x: 0, y: 0 } });
    const resizeInfo = useRef({ startX: 0, startY: 0, initialSize: { width: 0, height: 0 } });
    const windowRef = useRef(null);
    const rafRef = useRef(null);
    const pendingUpdateRef = useRef(null);

    // Prevent native zoom on the component itself
    useEffect(() => {
        const element = windowRef.current;
        if (!element) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) e.preventDefault();
        };
        const preventGesture = (e) => e.preventDefault();

        element.addEventListener('wheel', handleWheel, { passive: false });
        element.addEventListener('gesturestart', preventGesture);
        element.addEventListener('gesturechange', preventGesture);
        element.addEventListener('gestureend', preventGesture);

        return () => {
            element.removeEventListener('wheel', handleWheel);
            element.removeEventListener('gesturestart', preventGesture);
            element.removeEventListener('gesturechange', preventGesture);
            element.removeEventListener('gestureend', preventGesture);
        };
    }, []);

    const { comments } = useComments(component.id);

    // --- Pointer event handlers ---

    const handleDragStart = (e) => {
        if (e.target.closest('.no-drag')) return;
        onBringToFront(component.id);
        setIsDragging(true);
        dragInfo.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialPos: { ...component.position },
        };
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        onBringToFront(component.id);
        setIsResizing(true);
        resizeInfo.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialSize: { ...component.size },
        };
    };

    const debouncedSave = useRef(
        debounce((id) => { if (onSave) onSave(id); }, 1000)
    ).current;

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        // Prevent text selection and iframe event capture
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        const handlePointerMove = (e) => {
            let updates;
            if (isDragging) {
                const dx = (e.clientX - dragInfo.current.startX) / scale;
                const dy = (e.clientY - dragInfo.current.startY) / scale;
                updates = {
                    position: {
                        x: dragInfo.current.initialPos.x + dx,
                        y: dragInfo.current.initialPos.y + dy,
                    },
                };
            }
            if (isResizing) {
                const dx = (e.clientX - resizeInfo.current.startX) / scale;
                const dy = (e.clientY - resizeInfo.current.startY) / scale;
                updates = {
                    size: {
                        width: Math.max(400, resizeInfo.current.initialSize.width + dx),
                        height: Math.max(300, resizeInfo.current.initialSize.height + dy),
                    },
                };
            }

            // RAF batching — only one frame in flight
            pendingUpdateRef.current = updates;
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(() => {
                    if (pendingUpdateRef.current) {
                        onUpdate(component.id, pendingUpdateRef.current);
                        pendingUpdateRef.current = null;
                    }
                    rafRef.current = null;
                });
            }
        };

        const handlePointerUp = () => {
            // Flush last pending RAF update
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (pendingUpdateRef.current) {
                onUpdate(component.id, pendingUpdateRef.current);
                pendingUpdateRef.current = null;
            }

            if (isDragging || isResizing) {
                if (onDragEnd) onDragEnd();
                if (onSave) onSave(component.id);
            }

            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            setIsDragging(false);
            setIsResizing(false);
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        };
    }, [isDragging, isResizing, component.id, scale, onDragEnd, onUpdate, onSave]);

    const toggleMode = () => {
        onUpdate(component.id, {
            mode: component.mode === 'edit' ? 'preview' : 'edit',
        });
    };

    const isInteracting = isDragging || isResizing;

    return (
        <div
            ref={windowRef}
            className="absolute group"
            style={{
                left: component.position.x,
                top: component.position.y,
                width: component.size.width,
                height: component.size.height,
                zIndex: component.zIndex,
                cursor: isDragging ? 'move' : 'default',
                willChange: isInteracting ? 'left, top, width, height' : 'auto',
            }}
            onPointerDown={() => onBringToFront(component.id)}
        >
            {/* Floating Header Bar */}
            <div
                className={`absolute -top-14 left-0 right-0 h-12 flex items-center gap-2 px-2 border rounded-lg cursor-move transition-all ${FOLDER_HEADER_STYLES[folderColor] || FOLDER_HEADER_STYLES.slate}`}
                onPointerDown={handleDragStart}
            >
                <div className="px-2">
                    <GripVertical className="w-4 h-4 opacity-50" />
                </div>

                <div className="no-drag">
                    <FolderSelector
                        currentFolderId={component.folder_id}
                        onFolderChange={(newFolderId) => {
                            onUpdate(component.id, { folder_id: newFolderId });
                            debouncedSave(component.id);
                        }}
                    />
                </div>

                <Input
                    value={component.name}
                    onChange={(e) => {
                        onUpdate(component.id, { name: e.target.value });
                        debouncedSave(component.id);
                    }}
                    className="no-drag flex-1 h-8 text-sm font-medium border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-indigo-500/30 px-2 rounded-md hover:bg-white/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                />

                <div className="no-drag flex items-center gap-1 pl-2 border-l border-[#e5e5e5]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 relative rounded-full transition-all active:scale-95 ${showComments ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                        onClick={() => setShowComments(!showComments)}
                        title="Comments"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {comments.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center bg-indigo-600 text-white text-[9px] font-bold rounded-full border border-white shadow-sm px-0.5">
                                {comments.length}
                            </span>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                        onClick={toggleMode}
                        title={component.mode === 'edit' ? 'Preview' : 'Edit'}
                    >
                        {component.mode === 'edit' ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-[#d4d4d4] hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                        onClick={() => onDelete(component.id)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Comments Panel */}
            {showComments && (
                <CommentPanel
                    componentId={component.id}
                    onClose={() => setShowComments(false)}
                    className="absolute top-0 left-[calc(100%+16px)] w-80 h-full max-h-[600px]"
                />
            )}

            {/* Window Content */}
            <div className="w-full h-full bg-white rounded-[10px] overflow-hidden border border-[#e5e5e5] relative">
                {/* Interaction overlay — blocks iframe from capturing pointer events */}
                {isInteracting && <div className="absolute inset-0 z-10" />}

                <div className="w-full h-full">
                    {component.mode === 'edit' ? (
                        <CodeEditor component={component} onUpdate={onUpdate} onSave={onSave} />
                    ) : (
                        <PreviewPane component={component} />
                    )}
                </div>

                {/* Resize Handle */}
                <div
                    className="no-drag absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group/resize z-10"
                    onPointerDown={handleResizeStart}
                >
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-[#e5e5e5] group-hover/resize:border-indigo-500 transition-colors rounded-br-[2px]" />
                </div>
            </div>
        </div>
    );
});

export default ComponentWindow;
