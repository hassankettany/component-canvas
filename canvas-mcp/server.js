import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STATE_FILE = path.resolve(import.meta.dirname, '..', '.canvas', 'state.json');

function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { folders: [], components: [], stickyNotes: [], strokes: [] };
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { folders: [], components: [], stickyNotes: [], strokes: [] };
  }
}

function writeState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  state._lastModified = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

const server = new McpServer({
  name: 'Component Canvas',
  version: '1.0.0',
});

// --- Tool: canvas_read ---
server.tool(
  'canvas_read',
  'Read everything on the Component Canvas — components, sticky notes, folders. Use this to understand what the user has on their canvas before making changes.',
  {},
  async () => {
    const state = readState();
    const components = (state.components || []).map(c => ({
      id: c.id,
      name: c.name,
      folder: (state.folders || []).find(f => f.id === c.folder_id)?.name || 'Unknown',
      codePreview: (c.code || '').substring(0, 200) + ((c.code || '').length > 200 ? '...' : ''),
    }));
    const notes = (state.stickyNotes || []).map(n => ({
      id: n.id,
      text: n.text,
      color: n.color,
    }));
    const folders = (state.folders || []).map(f => ({
      id: f.id,
      name: f.name,
    }));

    let summary = `## Canvas State\n\n`;
    summary += `**${components.length} components**, **${notes.length} sticky notes**, **${folders.length} folders**\n\n`;

    if (folders.length > 0) {
      summary += `### Folders\n`;
      folders.forEach(f => { summary += `- ${f.name} (${f.id})\n`; });
      summary += '\n';
    }

    if (components.length > 0) {
      summary += `### Components\n`;
      components.forEach(c => {
        summary += `- **${c.name}** [folder: ${c.folder}] (${c.id})\n  Code preview: ${c.codePreview}\n\n`;
      });
    }

    if (notes.length > 0) {
      summary += `### Sticky Notes\n`;
      notes.forEach(n => { summary += `- [${n.color}] "${n.text}" (${n.id})\n`; });
    }

    return { content: [{ type: 'text', text: summary }] };
  }
);

// --- Tool: canvas_create_component ---
server.tool(
  'canvas_create_component',
  'Create a new interactive component on the canvas. Provide the full HTML code (including <style> and <script> tags). The component will appear as a live iframe preview on the canvas.',
  {
    name: z.string().describe('Component name'),
    code: z.string().describe('Full HTML code for the component (complete HTML document with <!DOCTYPE html>)'),
    folder: z.string().optional().describe('Folder name to put the component in. Defaults to "General".'),
  },
  async ({ name, code, folder: folderName }) => {
    const state = readState();

    // Find or create folder
    let folder = (state.folders || []).find(f => f.name === (folderName || 'General'));
    if (!folder) {
      folder = {
        id: randomUUID(),
        name: folderName || 'General',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!state.folders) state.folders = [];
      state.folders.push(folder);
    }

    // Calculate position (offset from last component)
    const existing = state.components || [];
    const offsetX = 100 + existing.length * 30;
    const offsetY = 100 + existing.length * 30;

    const component = {
      id: randomUUID(),
      name,
      folder_id: folder.id,
      code,
      position: { x: offsetX, y: offsetY },
      size: { width: 900, height: 600 },
      mode: 'preview',
      zIndex: existing.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    if (!state.components) state.components = [];
    state.components.push(component);
    writeState(state);

    return { content: [{ type: 'text', text: `Created component "${name}" (${component.id}) in folder "${folder.name}". It will appear on the canvas within 2 seconds.` }] };
  }
);

// --- Tool: canvas_create_sticky_note ---
server.tool(
  'canvas_create_sticky_note',
  'Create a sticky note on the canvas for annotations, reminders, or feedback.',
  {
    text: z.string().describe('Text content of the sticky note'),
    color: z.enum(['yellow', 'blue', 'green', 'pink', 'purple']).optional().describe('Note color. Defaults to yellow.'),
  },
  async ({ text, color }) => {
    const state = readState();

    const existing = [...(state.components || []), ...(state.stickyNotes || [])];
    const maxZ = existing.length > 0 ? Math.max(...existing.map(e => e.zIndex || 0)) + 1 : 1;

    // Position near the last component or center
    const lastComp = (state.components || []).slice(-1)[0];
    const x = lastComp ? lastComp.position.x + lastComp.size.width + 40 : 200;
    const y = lastComp ? lastComp.position.y : 200;

    const note = {
      id: randomUUID(),
      text,
      color: color || 'yellow',
      position: { x, y },
      size: { width: 200, height: 200 },
      zIndex: maxZ,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    if (!state.stickyNotes) state.stickyNotes = [];
    state.stickyNotes.push(note);
    writeState(state);

    return { content: [{ type: 'text', text: `Created ${color || 'yellow'} sticky note: "${text}". It will appear on the canvas within 2 seconds.` }] };
  }
);

// --- Tool: canvas_update_component ---
server.tool(
  'canvas_update_component',
  'Update an existing component\'s HTML code. Use canvas_read first to get the component ID.',
  {
    id: z.string().describe('Component ID (UUID)'),
    code: z.string().describe('New full HTML code for the component'),
  },
  async ({ id, code }) => {
    const state = readState();
    const comp = (state.components || []).find(c => c.id === id);
    if (!comp) {
      return { content: [{ type: 'text', text: `Component ${id} not found. Use canvas_read to see available components.` }] };
    }

    comp.code = code;
    comp.updated_at = new Date().toISOString();
    writeState(state);

    return { content: [{ type: 'text', text: `Updated component "${comp.name}" (${id}). Changes will appear on the canvas within 2 seconds.` }] };
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
