function createEntity(storageKey) {
  function readAll() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function writeAll(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  return {
    async list() {
      return readAll();
    },

    async filter(criteria) {
      const items = readAll();
      return items.filter(item =>
        Object.entries(criteria).every(([key, value]) => item[key] === value)
      );
    },

    async create(data) {
      const items = readAll();
      const now = new Date().toISOString();
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        timestamp: now,
      };
      items.push(newItem);
      writeAll(items);
      return newItem;
    },

    async update(id, data) {
      const items = readAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Item ${id} not found in ${storageKey}`);
      items[index] = {
        ...items[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      writeAll(items);
      return items[index];
    },

    async delete(id) {
      const items = readAll();
      writeAll(items.filter(item => item.id !== id));
    },
  };
}

export const base44 = {
  entities: {
    Folder: createEntity('canvas_folders'),
    Component: createEntity('canvas_components'),
    Comment: createEntity('canvas_comments'),
    StickyNote: createEntity('canvas_sticky_notes'),
    Stroke: createEntity('canvas_strokes'),
  },
};
