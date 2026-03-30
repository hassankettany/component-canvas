# Component Canvas

A canvas environment for visually brainstorming interactive HTML components (iframes) with a dashboard view for code editing and file management.

## Running

```bash
npm run dev    # Start dev server at http://localhost:5173
npm run build  # Production build to dist/
```

## Architecture

- **Frontend**: React 18 + Vite + TailwindCSS
- **Data**: localStorage (via `src/api/localStorageClient.js`) with React Query for state management
- **Editor**: CodeMirror 6
- **Canvas**: Custom drag/resize with pointer events + requestAnimationFrame

## Canvas MCP Integration

This project includes an MCP server that lets Claude Code interact with the canvas.

### How it works
1. The Vite dev server syncs canvas state to `.canvas/state.json`
2. The MCP server (`canvas-mcp/server.js`) reads/writes this file
3. The canvas app polls for external changes every 2 seconds

### Available tools
- `canvas_read` — See everything on the canvas (components, sticky notes, folders)
- `canvas_create_component` — Create a new interactive HTML component. Always provide complete HTML documents with `<!DOCTYPE html>`, `<style>`, and `<script>` tags.
- `canvas_create_sticky_note` — Add a sticky note (colors: yellow, blue, green, pink, purple)
- `canvas_update_component` — Update an existing component's code by ID

### Demo flow
1. Make sure `npm run dev` is running
2. Use `canvas_read` to see what's on the canvas
3. Use `canvas_create_component` to add interactive components
4. Components appear on the canvas within 2 seconds

## Key Directories

```
src/
  api/              # localStorage client
  components/       # React components (canvas/, dashboard/, common/, ui/)
  hooks/            # Custom hooks (data, canvas engine, sync)
  pages/            # Canvas.jsx, Dashboard.jsx
  constants/        # Colors, canvas settings, templates
canvas-mcp/         # MCP server for Claude Code integration
.canvas/            # Synced state file (gitignored)
```
