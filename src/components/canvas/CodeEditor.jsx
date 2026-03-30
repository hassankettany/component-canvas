import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { EditorState } from '@codemirror/state';
import { debounce } from 'lodash';

export default function CodeEditor({ component, onUpdate, onSave }) {
    const containerRef = useRef(null);
    const viewRef = useRef(null);
    const componentIdRef = useRef(null);

    const debouncedUpdate = useRef(
        debounce((id, code) => {
            onUpdate(id, { code });
            if (onSave) onSave(id);
        }, 1500)
    ).current;

    // Create/recreate editor when component ID changes
    useEffect(() => {
        if (!containerRef.current) return;
        if (viewRef.current) viewRef.current.destroy();

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                debouncedUpdate(component.id, update.state.doc.toString());
            }
        });

        const theme = EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
        });

        const state = EditorState.create({
            doc: component.code || '',
            extensions: [basicSetup, html(), updateListener, theme, EditorView.lineWrapping],
        });

        viewRef.current = new EditorView({ state, parent: containerRef.current });
        componentIdRef.current = component.id;

        return () => {
            debouncedUpdate.flush();
            if (viewRef.current) viewRef.current.destroy();
        };
    }, [component.id]);

    // Sync external code changes (e.g., find-replace)
    useEffect(() => {
        if (
            viewRef.current &&
            componentIdRef.current === component.id &&
            component.code !== viewRef.current.state.doc.toString()
        ) {
            viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: component.code || '',
                },
            });
        }
    }, [component.code]);

    // Stop ctrl+wheel from bubbling (let Canvas handle zoom)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) e.preventDefault();
            else e.stopPropagation();
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
}
