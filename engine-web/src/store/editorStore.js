import { create } from 'zustand'

let nextId = 1

const useEditorStore = create((set, get) => ({
  mode: 'edit',
  selectedObjectId: null,
  sceneObjects: [
    {
      id: 'platform',
      type: 'box',
      name: 'Plataforma',
      position: [0, -0.5, 0],
      rotation: [0, 0, 0],
      scale: [50, 1, 50],
      color: '#4a90d9',
    },
    {
      id: 'spawn',
      type: 'spawn',
      name: 'Spawn',
      position: [0, 0.1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#22c55e',
      intensity: 1,
    },
  ],
  transformMode: 'translate',

  setMode: (mode) => set({ mode }),

  selectObject: (id) => set({ selectedObjectId: id }),

  deselectAll: () => set({ selectedObjectId: null }),

  addObject: (type, position) => {
    const id = `obj_${nextId++}`
    const templates = {
      box: { name: 'Cubo', color: '#e74c3c' },
      sphere: { name: 'Esfera', color: '#2ecc71' },
      cylinder: { name: 'Cilindro', color: '#3498db' },
      cone: { name: 'Cono', color: '#f39c12' },
      torus: { name: 'Torus', color: '#9b59b6' },
      capsule: { name: 'Cápsula', color: '#1abc9c' },
      spawn: { name: 'Spawn', color: '#22c55e' },
      directionalLight: { name: 'Luz Direccional', color: '#fbbf24', intensity: 2 },
      pointLight: { name: 'Luz Puntual', color: '#fbbf24', intensity: 5 },
    }
    const t = templates[type] || templates.box
    const obj = {
      id,
      type,
      name: t.name,
      position: position || [0, 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: t.color,
      intensity: t.intensity,
    }
    set((state) => ({
      sceneObjects: [...state.sceneObjects, obj],
      selectedObjectId: id,
    }))
  },

  removeObject: (id) => {
    if (id === 'platform' || id === 'spawn') return
    set((state) => ({
      sceneObjects: state.sceneObjects.filter((o) => o.id !== id),
      selectedObjectId:
        state.selectedObjectId === id ? null : state.selectedObjectId,
    }))
  },

  updateObject: (id, updates) =>
    set((state) => ({
      sceneObjects: state.sceneObjects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  setTransformMode: (mode) => set({ transformMode: mode }),

  getSpawnPosition: () => {
    const state = get()
    const spawn = state.sceneObjects.find((o) => o.type === 'spawn')
    return spawn ? [...spawn.position] : [0, 1, 0]
  },
}))

export default useEditorStore