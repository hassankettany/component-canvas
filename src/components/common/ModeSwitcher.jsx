import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Layout, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ModeSwitcher({ currentMode }) {
    const modes = [
        { id: 'dashboard', label: 'Dashboard', icon: Layout, path: 'Dashboard' },
        { id: 'canvas', label: 'Canvas', icon: Grid, path: 'Canvas' }
    ];

    return (
        <div className="absolute top-4 left-4 z-[100]">
            <div className="flex bg-white border border-[#e5e5e5] rounded-lg p-0.5 gap-px relative">
                {modes.map((mode) => {
                    const isActive = currentMode === mode.id;
                    const inner = (
                        <div className={cn(
                            "relative z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150",
                            isActive ? "text-[#171717]" : "text-[#a3a3a3] hover:text-[#737373]"
                        )}>
                            <mode.icon className="w-3.5 h-3.5" />
                            {mode.label}
                        </div>
                    );

                    return (
                        <div key={mode.id} className="relative">
                            {isActive && (
                                <motion.div
                                    layoutId="mode-indicator"
                                    className="absolute inset-0 bg-[#2563eb]/10 rounded-md"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                />
                            )}
                            {isActive ? (
                                <div className="cursor-default">{inner}</div>
                            ) : (
                                <Link to={createPageUrl(mode.path)} className="block">{inner}</Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
