# Component Canvas — Product Spec

**The Interactive FigJam**

---

## 1. Vision

In an era where designers can build interactive prototypes to showcase their ideas, the static Figma environment is not enough. Designers want to generate interactive widgets and display them in brainstorming environments — sketching, annotating, and iterating on living components side by side.

**Component Canvas is where interactive design meets collaborative brainstorming.** It is a spatial canvas for creating, arranging, and reviewing interactive prototypes — connected directly to AI agents that build alongside the designer.

---

## 2. Target Persona

A designer fluent with code and AI, who has integrated agentic workflows into their day-to-day. They design with tools like Claude Code and Cursor, iterate rapidly, and prototype interactive experiences from the get-go. They don't let the traditional design process slow them down.

They think in interactions, not static screens. They prompt, review, adjust, and ship — and they need an environment built for that speed.

---

## 3. Pain Points

| Pain Point | Impact |
|---|---|
| Too much friction between prompting and seeing live design | The feedback loop is slow; momentum is lost |
| Can't view multiple interactive designs on one screen | Designers miss this core capability from Figma |
| Static mockups don't capture the interactive essence of what's being built | Stakeholders can't feel the design |
| Code lives in files, designs live in Figma — the two worlds are disconnected | Context is fragmented across tools |
| Brainstorming interactive ideas requires constant context-switching | Creative flow is repeatedly broken |

---

## 4. Current State (POC)

The proof of concept is live and deployed to GitHub Pages. It delivers two core modes:

**Canvas View** — A spatial layout of interactive HTML components rendered as iframes. Components are draggable, resizable, and zoomable. Folders are color-coded for organization. Sticky notes and freehand drawing support brainstorming directly on the canvas. A comments system enables feedback in context.

**Dashboard View** — A file explorer sidebar paired with a split-pane code editor (CodeMirror) and live preview. Designers manage files on the left, edit code in the center, and see results on the right — all without leaving the tool.

**Core capabilities:**
- Undo/redo (Cmd+Z / Cmd+Shift+Z)
- Minimalist, Notion/Apple-inspired UI
- Claude Code integration via MCP — AI can read the canvas and create components
- GitHub Pages deployment

---

## 5. The Innovation

The innovation is **the experience** — not just another code editor or canvas tool, but the seamless connection between three layers:

- **AI Agent** — Prompts become live interactive widgets
- **Canvas** — Widgets appear spatially alongside annotations, notes, and drawings
- **Code** — Editable in-place, preview updates live

The feedback loop collapses: **prompt, see, iterate — all in one environment.** No tab-switching. No copy-pasting code into viewers. No waiting. The designer's thought and the artifact it produces exist in the same space.

---

## 6. Future Vision

- **React Components** — Move beyond raw HTML to a full component development environment supporting modern frameworks
- **Git-like Versioning** — Branches and versions of interactive widgets, with a visual interface for comparing and merging
- **Node-based Logic** — Widgets interact with each other through visual connections (inspired by TouchDesigner / Weavy), enabling complex prototypes from composable pieces
- **Multi-user Collaboration** — Real-time shared workspaces with user profiles, cursors, and presence
- **Deeper Agent Integration** — Claude reads the entire board (components, notes, drawings), understands context holistically, and builds alongside the user as a creative partner
- **Plugin Ecosystem** — Connect to design systems, component libraries, and external APIs

---

## 7. Technical Direction

| Dimension | Now (POC) | Next | Future |
|---|---|---|---|
| Components | HTML iframes | React components | Any framework |
| Storage | localStorage | File-based + Git | Cloud database |
| AI | MCP server (read/write canvas) | Full agent loop | Multi-agent collaboration |
| Collaboration | Single user | Shared links | Real-time multiplayer |
| Versioning | None | Git integration | Branch/merge UI |

---

## 8. Agent Integration (MCP)

Component Canvas connects to Claude Code via a Model Context Protocol (MCP) server. This gives the AI agent direct access to the canvas as both a reader and a creator.

**Available tools:**

| Tool | Description |
|---|---|
| `canvas_read` | AI reads everything on the canvas — components, notes, layout |
| `canvas_create_component` | AI creates interactive components from natural language prompts |
| `canvas_create_sticky_note` | AI adds annotations and context to the board |
| `canvas_update_component` | AI edits existing component code in place |

**Demo flow:**

> User prompts Claude --> Component appears on the canvas in real-time --> User iterates with follow-up prompts --> The prototype evolves through conversation

This is the core loop that makes Component Canvas different: the AI doesn't just generate code — it participates in the spatial design environment directly.

---

## Origin Story

Component Canvas started as an internal tool at Wix. Designers creating animations for the `@wix/interact` library were pushing HTML files to GitHub. Every review cycle meant copying code into an HTML viewer — a manual, repetitive process that broke creative flow.

Component Canvas was built to centralize this: a visual canvas where designers upload HTML files and developers review code, with both a canvas view for brainstorming and a dashboard view for organized file management and editing. What began as a workflow fix became the foundation for something larger.

---

*Component Canvas — March 2026*
