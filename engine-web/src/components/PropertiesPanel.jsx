import React from 'react'
import useEditorStore from '../store/editorStore'
import { OBJECT_ICONS } from '../utils/constants'

export default function PropertiesPanel() {
  const mode = useEditorStore((s) => s.mode)
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const updateObject = useEditorStore((s) => s.updateObject)

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
            <p className="hint-small">Usa el botón + para agregar</p>
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

  const handleIntensityChange = (e) => {
    updateObject(obj.id, { intensity: parseFloat(e.target.value) || 0 })
  }

  const handlePhysicsToggle = (e) => {
    updateObject(obj.id, { hasPhysics: e.target.checked })
  }

  const isLight = obj.type === 'directionalLight' || obj.type === 'pointLight'
  const isDirectionalLight = obj.type === 'directionalLight'
  const isSpawn = obj.type === 'spawn'
  const isGeometry = !isLight && !isSpawn
  const hasPhysicsOption = isGeometry || obj.type === 'box'

  return (
    <div className="properties-content">
      <div className="prop-group">
        <label className="prop-label">Nombre</label>
        <input className="prop-input" value={obj.name} onChange={handleNameChange} />
      </div>

      <div className="prop-group">
        <label className="prop-label">Tipo</label>
        <span className="prop-value">{OBJECT_ICONS[obj.type] || '●'} {obj.type}</span>
      </div>

      {isLight && (
        <div className="prop-group">
          <label className="prop-label">Intensidad</label>
          <input
            type="number"
            className="prop-input number-input"
            value={obj.intensity || 1}
            onChange={handleIntensityChange}
            step={0.5}
            min={0}
          />
        </div>
      )}

      <div className="prop-group">
        <label className="prop-label">Color</label>
        <input type="color" className="prop-color" value={obj.color} onChange={handleColorChange} />
      </div>

      {hasPhysicsOption && (
        <div className="prop-group prop-toggle-group">
          <label className="prop-label">Físicas</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={obj.hasPhysics !== false}
              onChange={handlePhysicsToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      )}

      <Vector3Input
        label="Posición"
        value={obj.position}
        onChange={handlePositionChange}
      />

      {(isGeometry || isDirectionalLight) && (
        <Vector3Input
          label="Rotación"
          value={obj.rotation}
          onChange={handleRotationChange}
        />
      )}

      {isGeometry && (
        <Vector3Input
          label="Escala"
          value={obj.scale}
          onChange={handleScaleChange}
          min={0.01}
        />
      )}
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