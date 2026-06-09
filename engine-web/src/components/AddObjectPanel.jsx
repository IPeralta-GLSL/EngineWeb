import React, { useState } from 'react'
import useEditorStore from '../store/editorStore'

export default function AddObjectPanel() {
  const mode = useEditorStore((s) => s.mode)
  const addObject = useEditorStore((s) => s.addObject)
  const [isOpen, setIsOpen] = useState(false)

  if (mode !== 'edit') return null

  const primitives = [
    { type: 'box', icon: '▣', label: 'Cubo' },
    { type: 'sphere', icon: '●', label: 'Esfera' },
    { type: 'cylinder', icon: '●', label: 'Cilindro' },
    { type: 'cone', icon: '▲', label: 'Cono' },
    { type: 'torus', icon: '◎', label: 'Torus' },
    { type: 'capsule', icon: '●', label: 'Cápsula' },
  ]

  const lights = [
    { type: 'directionalLight', icon: '☀', label: 'Direccional' },
    { type: 'pointLight', icon: '💡', label: 'Puntual' },
  ]

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('objectType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="add-panel">
      <button
        className={`add-panel-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="add-icon">+</span>
      </button>
      {isOpen && (
        <div className="add-panel-dropdown">
          <div className="add-panel-section">
            <div className="add-panel-title">Primitivos</div>
            <div className="add-panel-grid">
              {primitives.map((item) => (
                <button
                  key={item.type}
                  className="add-panel-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onClick={() => {
                    addObject(item.type)
                  }}
                  title="Click: crear | Drag: soltar en escena"
                >
                  <span className="add-panel-icon">{item.icon}</span>
                  <span className="add-panel-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="add-panel-section">
            <div className="add-panel-title">Luces</div>
            <div className="add-panel-grid">
              {lights.map((item) => (
                <button
                  key={item.type}
                  className="add-panel-item light-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onClick={() => {
                    addObject(item.type)
                  }}
                  title="Click: crear | Drag: soltar en escena"
                >
                  <span className="add-panel-icon">{item.icon}</span>
                  <span className="add-panel-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}