import { create } from 'zustand'

let nextId = 1

const MAX_HISTORY = 50

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
      hasPhysics: true,
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
      hasPhysics: false,
    },
    {
      id: 'sun',
      type: 'directionalLight',
      name: 'Sol',
      position: [10, 15, 10],
      rotation: [0, -Math.PI / 4, 0],
      scale: [1, 1, 1],
      color: '#fbbf24',
      intensity: 2,
      hasPhysics: false,
    },
  ],
  transformMode: 'translate',
  isGizmoDragging: false,
  _history: [],
  _historyIndex: -1,

  _pushHistory: () => {
    const state = get()
    const snapshot = JSON.parse(JSON.stringify(state.sceneObjects))
    const history = [...state._history]
    const idx = state._historyIndex
    const newHistory = history.slice(0, idx + 1)
    newHistory.push(snapshot)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({
      _history: newHistory,
      _historyIndex: newHistory.length - 1,
    })
  },

  undo: () => {
    const state = get()
    if (state._historyIndex > 0) {
      const newIndex = state._historyIndex - 1
      const snapshot = JSON.parse(JSON.stringify(state._history[newIndex]))
      set({
        sceneObjects: snapshot,
        _historyIndex: newIndex,
        selectedObjectId: null,
      })
    }
  },

  redo: () => {
    const state = get()
    if (state._historyIndex < state._history.length - 1) {
      const newIndex = state._historyIndex + 1
      const snapshot = JSON.parse(JSON.stringify(state._history[newIndex]))
      set({
        sceneObjects: snapshot,
        _historyIndex: newIndex,
        selectedObjectId: null,
      })
    }
  },

  canUndo: () => {
    const state = get()
    return state._historyIndex > 0
  },

  canRedo: () => {
    const state = get()
    return state._historyIndex < state._history.length - 1
  },

  initHistory: () => {
    const state = get()
    if (state._history.length === 0) {
      const snapshot = JSON.parse(JSON.stringify(state.sceneObjects))
      set({ _history: [snapshot], _historyIndex: 0 })
    }
  },

  setMode: (mode) => set({ mode }),

  selectObject: (id) => set({ selectedObjectId: id }),

  deselectAll: () => set({ selectedObjectId: null }),

  addObject: (type, position) => {
    const id = `obj_${nextId++}`
    const templates = {
      box: { name: 'Cubo', color: '#e74c3c', hasPhysics: true },
      sphere: { name: 'Esfera', color: '#2ecc71', hasPhysics: true },
      cylinder: { name: 'Cilindro', color: '#3498db', hasPhysics: true },
      cone: { name: 'Cono', color: '#f39c12', hasPhysics: true },
      torus: { name: 'Torus', color: '#9b59b6', hasPhysics: true },
      capsule: { name: 'Cápsula', color: '#1abc9c', hasPhysics: true },
      spawn: { name: 'Spawn', color: '#22c55e', hasPhysics: false },
      directionalLight: { name: 'Luz Direccional', color: '#fbbf24', intensity: 2, hasPhysics: false, rotation: [0, 0, 0] },
      pointLight: { name: 'Luz Puntual', color: '#fbbf24', intensity: 5, hasPhysics: false },
    }
    const t = templates[type] || templates.box
    const obj = {
      id,
      type,
      name: t.name,
      position: position || [0, 2, 0],
      rotation: t.rotation || [0, 0, 0],
      scale: [1, 1, 1],
      color: t.color,
      intensity: t.intensity,
      hasPhysics: t.hasPhysics,
    }
    set((state) => ({
      sceneObjects: [...state.sceneObjects, obj],
      selectedObjectId: id,
    }))
    get()._pushHistory()
  },

  removeObject: (id) => {
    if (id === 'platform' || id === 'spawn' || id === 'sun') return
    set((state) => ({
      sceneObjects: state.sceneObjects.filter((o) => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }))
    get()._pushHistory()
  },

  updateObject: (id, updates) => {
    set((state) => ({
      sceneObjects: state.sceneObjects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    }))
  },

  updateObjectFinal: (id, updates) => {
    set((state) => ({
      sceneObjects: state.sceneObjects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    }))
    get()._pushHistory()
  },

  setGizmoDragging: (val) => set({ isGizmoDragging: val }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  getSpawnPosition: () => {
    const state = get()
    const spawn = state.sceneObjects.find((o) => o.type === 'spawn')
    return spawn ? [...spawn.position] : [0, 1, 0]
  },
}))

export default useEditorStore