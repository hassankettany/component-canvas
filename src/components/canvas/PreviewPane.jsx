import React, { useState, memo } from 'react';
import { RefreshCw } from 'lucide-react';

const PreviewPane = memo(function PreviewPane({ component }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Inject zoom handler script into the iframe
    const srcDoc = component.code + `
        <script>
            const preventGesture = (e) => e.preventDefault();
            window.addEventListener('gesturestart', preventGesture);
            window.addEventListener('gesturechange', preventGesture);
            window.addEventListener('gestureend', preventGesture);

            window.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'CANVAS_ZOOM', deltaY: e.deltaY }, '*');
                }
            }, { passive: false });

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    window.parent.postMessage({ type: 'SPACE_DOWN' }, '*');
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'Space') {
                    window.parent.postMessage({ type: 'SPACE_UP' }, '*');
                }
            });
        </script>
    `;

    return (
        <div className="h-full bg-white relative group">
            {/* Refresh Button */}
            <button
                onClick={handleRefresh}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="absolute top-3 right-3 z-10 px-2.5 py-1.5 bg-white/60 backdrop-blur-sm border border-white/40 text-slate-500 text-[11px] font-medium rounded-lg shadow-sm hover:bg-white/90 hover:text-indigo-600 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex items-center gap-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
                <RefreshCw 
                    className={`w-3 h-3 transition-transform duration-500 ${isHovered ? 'rotate-180' : ''}`} 
                />
                Refresh
            </button>

            {/* Sandboxed iframe */}
            <iframe
                key={refreshKey}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
                className="w-full h-full border-0"
                title={`Preview of ${component.name}`}
            />
        </div>
    );
});

export default PreviewPane;