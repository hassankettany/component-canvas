# UI Modernization: Refined Light

## Direction

Minimalist, flat, Notion/Apple-inspired. Typography-driven hierarchy. No shadows, no blur, no decoration. Color reserved for folder identity only. Every element earns its place.

## Design System

### Background
- Canvas & Dashboard background: `#fafafa`
- Dot grid: smaller dots (0.8px), larger spacing (32px), lower opacity (0.4)

### Surfaces
- All panels/cards: `white` background, `1px solid #e5e5e5` border, `border-radius: 10px`
- Toolbars and controls: `border-radius: 8px`
- Inner elements (chips, toggles): `border-radius: 6px`
- No shadows anywhere. No backdrop-blur. Depth through layering and border contrast only.

### Typography Hierarchy (4 levels)
| Level | Color | Usage |
|-------|-------|-------|
| Primary | `#171717` | Component names, folder names, active labels |
| Secondary | `#737373` | Toolbar labels, inactive text |
| Tertiary | `#a3a3a3` | Icons, placeholder text, subtle labels |
| Ghost | `#d4d4d4` | Dismiss buttons, dividers, line numbers |

### Folder Color System
- Folder identity shown as 6px rounded squares (border-radius: 2px)
- Folder chips: light tinted background (e.g., `#f0f0ff` for indigo) with colored text
- Component header borders tinted with folder color at 15% opacity
- The 18-color palette stays unchanged

### Controls
- **Primary action** (Add Component): `#171717` black, white text, 8px radius
- **Segmented controls** (Code/Split/Preview): white container with #e5e5e5 border, active item gets `#f5f5f5` background
- **Icon buttons**: 32x32px, 8px radius, #e5e5e5 border, #a3a3a3 icon color
- **Dividers**: 1px `#e5e5e5` (in toolbars), 1px `#f0f0f0` (in file trees)

### Icons
- Keep all existing Lucide icons (GripVertical, MessageSquare, Code2, Eye, X, Folder, FileCode, etc.)
- Icon color follows the typography hierarchy: #a3a3a3 default, #171717 active

## Canvas View

### Background
- `#fafafa` with subtle dot grid (0.8px dots, 32px spacing, 0.4 opacity)

### ModeSwitcher
- White container, 1px #e5e5e5 border, 8px radius, 2px padding
- Active tab: `#f5f5f5` background, `#171717` text, 6px radius
- Inactive tab: no background, `#a3a3a3` text

### Center Toolbar
- White container, 1px #e5e5e5 border, 8px radius
- Items separated by 1px #e5e5e5 vertical dividers
- "All" badge: `#f0f0f0` background, `#525252` text, 4px radius
- Text labels in `#737373`, 12px

### Zoom Controls
- White container, 1px #e5e5e5 border, 8px radius
- Buttons: 28x28px, 6px radius
- Percentage: 11px, font-weight 500, tabular-nums, `#525252`

### Add Component Button
- `#171717` background, white text, 8px radius
- 12px font, font-weight 500
- "+" character at font-weight 300, 14px

### Component Windows
- **Header bar**: white background, 1px border tinted with folder color (e.g., `rgba(99,102,241,.15)` for indigo), 8px radius, 30px height
  - Grip dots icon (GripVertical) at `#d4d4d4`
  - Folder chip with colored dot + tinted background
  - Component name in `#171717`, 12px, font-weight 500
  - Action icons (comments, code/preview, delete) separated by 1px #e5e5e5 divider
- **Window body**: white background, 1px #e5e5e5 border, 10px radius
- **Resize handle**: border-right + border-bottom at `#e5e5e5`, 2px width

## Dashboard View

### Layout
- `#fafafa` background with 16px padding, 12px gaps
- ModeSwitcher floating at top-left (same as canvas)
- Sidebar on the left as a white card
- Main area: NO outer container — elements float directly on background

### Sidebar
- White card, 1px #e5e5e5 border, 10px radius, 240px width
- Header: "EXPLORER" label in 10px uppercase #a3a3a3, with icon buttons
- File tree:
  - Folder rows: chevron + 6px colored square + name in #171717 font-weight 500
  - File rows: file icon + name in #525252, indented with 1px #f0f0f0 left border
  - Selected file: `#f5f5f5` background, name in folder accent color, icon in accent color
  - Collapsed folder: chevron not rotated, no children shown

### Top Bar (no container)
- Component name: 14px, font-weight 500, `#171717` — floating directly on #fafafa
- "/" divider in `#d4d4d4`
- Folder badge chip (same style as canvas headers)
- View mode toggle: own compact white container with #e5e5e5 border, 8px radius
  - Active: `#f5f5f5` background, `#171717` text
  - Inactive: no background, `#a3a3a3` text
- Comments button: own 32x32 white container with #e5e5e5 border

### Editor & Preview
- Two sibling floating cards side by side with 12px gap
- Editor card: white, 1px #e5e5e5 border, 10px radius
  - "EDITOR" label: 9px uppercase `#d4d4d4`, top-right corner
  - CodeMirror with light theme matching the color system
- Preview card: white, 1px #e5e5e5 border, 10px radius
  - "PREVIEW" label: 9px uppercase `#d4d4d4`, top-right corner
  - iframe fills the card directly — no inner wrapper or gray background

### Empty State (no component selected)
- Centered text on `#fafafa` background
- "Select a component to start editing" in `#a3a3a3`

## What Changes (file-by-file)

| File | Changes |
|------|---------|
| `src/index.css` | Update CSS variables for the new color system |
| `src/pages/Canvas.jsx` | Background color, grid styling |
| `src/pages/Dashboard.jsx` | Remove toolbar container, make editor/preview siblings, update all classes |
| `src/components/canvas/ComponentWindow.jsx` | Header: white + folder-tinted border, 8px radius. Window: 10px radius. Remove shadows. |
| `src/components/canvas/CanvasToolbar.jsx` | 8px radius instead of rounded-full, remove shadows/blur, update colors |
| `src/components/canvas/CanvasEmptyState.jsx` | Update to match new color system |
| `src/components/common/ModeSwitcher.jsx` | 8px radius, #f5f5f5 active state, remove shadow |
| `src/components/dashboard/FileExplorer.jsx` | Update selected/hover styles, folder dot to 6px square |
| `src/components/dashboard/DashboardToolbar.jsx` | Decompose into floating elements — name/badge float, toggle is compact |
| `src/components/common/FolderSelector.jsx` | Update to match new chip style |
| `src/components/canvas/CommentPanel.jsx` | Remove shadows/blur, use border-only design |
| `src/constants/colors.js` | Update FOLDER_HEADER_STYLES for white + tinted border pattern |

## What Stays the Same

- All Lucide icons
- Layout structure (canvas with floating components, dashboard with sidebar + split view)
- Folder color palette (18 colors)
- CodeMirror editor (just needs a theme tweak)
- All hooks and data layer
- Component functionality (drag, resize, zoom, pan, comments, etc.)
