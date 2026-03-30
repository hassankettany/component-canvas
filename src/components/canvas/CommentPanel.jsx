import React, { useState, useRef, useEffect } from 'react';
import { useComments } from '@/hooks/useComments';
import { ArrowUp, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CommentPanel({ componentId, onClose, ...props }) {
    const [newComment, setNewComment] = useState('');
    const bottomRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const { comments, createComment, deleteComment } = useComments(componentId);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments?.length]);

    // Stop event propagation to prevent Canvas from capturing scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) return;
            e.stopPropagation();
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        createComment({
            component_id: componentId,
            text: newComment,
            author: 'User'
        });
        setNewComment('');
    };

    return (
        <div className={`flex flex-col overflow-hidden bg-white border border-[#e5e5e5] rounded-[10px] z-50 no-drag cursor-default ${props.className || 'w-80 h-full'}`}>
            <div className="px-4 py-3 border-b border-[#f0f0f0] flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Comments <span className="text-slate-400 font-normal ml-1">{comments.length}</span></h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200/50" onClick={onClose}>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                </Button>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
            >
                {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">No comments yet</p>
                        <p className="text-xs text-slate-400 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment, index) => (
                        <div key={comment.id} className={`py-3 group ${index !== comments.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-medium text-slate-400">{comment.author}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-300">
                                        {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button
                                        onClick={() => deleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50"
                                        title="Delete comment"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed break-words">
                                {comment.text}
                            </p>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-[#f0f0f0]">
                <div className="relative flex items-center gap-2">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-white border-slate-200 focus:ring-indigo-500/20 shadow-sm rounded-full pl-4 pr-4"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 bg-[#2563eb] hover:bg-[#2563eb]/90 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        disabled={!newComment.trim()}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
