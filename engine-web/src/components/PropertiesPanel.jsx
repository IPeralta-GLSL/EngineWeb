import React from 'react'
import useEditorStore from '../store/editorStore'
import { OBJECT_TYPES } from '../utils/constants'

export default function PropertiesPanel() {
  const mode = useEditorStore((s) => s.mode)
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const updateObject = useEditorStore((s) => s.updateObject)
  const addObject = useEditorStore((s) => s.addObject)

  if (mode !== 'edit') return null

  const selectedObj = sceneObjects.find((o) => o.id === selectedObjectId)

  return (
    <div className="panel properties-panel">
      <div className="panel-header">
        <span className="panel-title">Propiedades</span>
      </div>
      <div className="panel-content">
        {selectedObj ? (
          <SelectedObjectProperties obj={selectedObj} updateObject={updateObject} />
        ) : (
          <div className="no-selection">
            <p className="hint">Selecciona un objeto</p>
            <AddObjectMenu addObject={addObject} />
          </div>
        )}
      </div>
    </div>
  )
}

function SelectedObjectProperties({ obj, updateObject }) {
  const handleNameChange = (e) => {
    updateObject(obj.id, { name: e.target.value })
  }

  const handlePositionChange = (axis, value) => {
    const pos = [...obj.position]
    pos[axis] = parseFloat(value) || 0
    updateObject(obj.id, { position: pos })
  }

  const handleRotationChange = (axis, value) => {
    const rot = [...obj.rotation]
    rot[axis] = parseFloat(value) || 0
    updateObject(obj.id, { rotation: rot })
  }

  const handleScaleChange = (axis, value) => {
    const scl = [...obj.scale]
    scl[axis] = Math.max(0.01, parseFloat(value) || 0.01)
    updateObject(obj.id, { scale: scl })
  }

  const handleColorChange = (e) => {
    updateObject(obj.id, { color: e.target.value })
  }

  return (
    <div className="properties-content">
      <div className="prop-group">
        <label className="prop-label">Nombre</label>
        <input
          className="prop-input"
          value={obj.name}
          onChange={handleNameChange}
        />
      </div>

      <div className="prop-group">
        <label className="prop-label">Tipo</label>
        <span className="prop-value">{OBJECT_TYPES[obj.type] || obj.type}</span>
      </div>

      <div className="prop-group">
        <label className="prop-label">Color</label>
        <input
          type="color"
          className="prop-color"
          value={obj.color}
          onChange={handleColorChange}
        />
      </div>

      <Vector3Input
        label="Posición"
        value={obj.position}
        onChange={handlePositionChange}
      />

      <Vector3Input
        label="Rotación"
        value={obj.rotation}
        onChange={handleRotationChange}
      />

      <Vector3Input
        label="Escala"
        value={obj.scale}
        onChange={handleScaleChange}
        min={0.01}
      />

      <AddObjectMenu addObject={(type) => addObject(type)} />
    </div>
  )
}

function Vector3Input({ label, value, onChange, min }) {
  const axes = ['X', 'Y', 'Z']
  const colors = ['#ff4444', '#44ff44', '#4444ff']

  return (
    <div className="prop-group vector3-group">
      <label className="prop-label">{label}</label>
      <div className="vector3-inputs">
        {axes.map((axis, i) => (
          <div key={axis} className="vector3-axis">
            <span className="axis-label" style={{ color: colors[i] }}>{axis}</span>
            <input
              type="number"
              className="prop-input number-input"
              value={parseFloat(value[i].toFixed(2))}
              onChange={(e) => onChange(i, e.target.value)}
              step={0.1}
              min={min}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function AddObjectMenu({ addObject }) {
  const [isOpen, setIsOpen] = React.useState(false)

  const items = [
    { type: 'box', icon: '▣', label: 'Cubo' },
    { type: 'sphere', icon: '●', label: 'Esfera' },
    { type: 'cylinder', icon: '●', label: 'Cilindro' },
    { type: 'cone', icon: '▲', label: 'Cono' },
    { type: 'torus', icon: '◎', label: 'Torus' },
    { type: 'capsule', icon: '●', label: 'Cápsula' },
  ]

  return (
    <div className="add-object-section">
      <button className="add-btn" onClick={() => setIsOpen(!isOpen)}>
        + Agregar Objeto
      </button>
      {isOpen && (
        <div className="add-menu">
          {items.map((item) => (
            <button
              key={item.type}
              className="add-menu-item"
              onClick={() => {
                addObject(item.type)
                setIsOpen(false)
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}