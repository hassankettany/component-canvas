import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Replace, ArrowRight, RefreshCw, FileCode } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function FindReplaceDialog({ isOpen, onClose, components, onBatchUpdate }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [replaceTerm, setReplaceTerm] = useState("");
    const [matches, setMatches] = useState([]);

    // Calculate matches whenever searchTerm or components change
    useEffect(() => {
        if (!searchTerm) {
            setMatches([]);
            return;
        }

        const newMatches = components.reduce((acc, comp) => {
            if (!comp.code) return acc;
            
            // Simple case-sensitive search. For advanced regex, we'd need more UI.
            // Escaping special regex characters if we used regex, but for now string search is safer/simpler for "words"
            const parts = comp.code.split(searchTerm);
            const matchCount = parts.length - 1;

            if (matchCount > 0) {
                acc.push({
                    id: comp.id,
                    name: comp.name,
                    count: matchCount,
                    preview: getPreview(comp.code, searchTerm)
                });
            }
            return acc;
        }, []);

        setMatches(newMatches);
    }, [searchTerm, components]);

    const getPreview = (code, term) => {
        const index = code.indexOf(term);
        if (index === -1) return "";
        
        const start = Math.max(0, index - 20);
        const end = Math.min(code.length, index + term.length + 20);
        return "..." + code.substring(start, end) + "...";
    };

    const handleReplaceAll = () => {
        if (!searchTerm || matches.length === 0) return;

        const updates = matches.map(match => {
            const comp = components.find(c => c.id === match.id);
            // Use split/join for global replacement of literal string
            const newCode = comp.code.split(searchTerm).join(replaceTerm);
            return {
                id: comp.id,
                data: { code: newCode }
            };
        });

        onBatchUpdate(updates);
        setSearchTerm(""); // Reset or maybe keep? Reset feels like "done"
        setMatches([]);
        onClose();
    };

    const handleReplaceOne = (componentId) => {
        const comp = components.find(c => c.id === componentId);
        if (!comp) return;

        const newCode = comp.code.split(searchTerm).join(replaceTerm);
        onBatchUpdate([{
            id: comp.id,
            data: { code: newCode }
        }]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-600" />
                        Find & Replace
                    </DialogTitle>
                    <DialogDescription>
                        Search across all components and replace text globally.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Find</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Text to find..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Replace with</label>
                        <div className="relative">
                            <Replace className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Replacement text..."
                                value={replaceTerm}
                                onChange={(e) => setReplaceTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg bg-slate-50/50">
                        <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {matches.length} Files Matching
                            </span>
                            {matches.length > 0 && (
                                <span className="text-xs text-indigo-600 font-medium">
                                    {matches.reduce((sum, m) => sum + m.count, 0)} total occurrences
                                </span>
                            )}
                        </div>
                        <ScrollArea className="h-[200px]">
                            {matches.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                                    <Search className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">No matches found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {matches.map((match) => (
                                        <div key={match.id} className="p-3 hover:bg-white transition-colors flex items-center justify-between group">
                                            <div className="min-w-0 flex-1 mr-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 truncate">
                                                        {match.name}
                                                    </span>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        {match.count}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono truncate bg-slate-100/50 px-1.5 py-0.5 rounded">
                                                    {match.preview}
                                                </p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs text-slate-500 hover:text-indigo-600"
                                                onClick={() => handleReplaceOne(match.id)}
                                            >
                                                Replace File
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center gap-2">
                    <div className="text-xs text-slate-400">
                        Changes are saved immediately
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleReplaceAll}
                            disabled={matches.length === 0 || !searchTerm}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Replace All
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}