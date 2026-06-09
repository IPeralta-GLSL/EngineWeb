import React from 'react'
import useEditorStore from '../store/editorStore'
import { OBJECT_ICONS } from '../utils/constants'

export default function HierarchyPanel() {
  const mode = useEditorStore((s) => s.mode)
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const removeObject = useEditorStore((s) => s.removeObject)

  if (mode !== 'edit') return null

  return (
    <div className="panel hierarchy-panel">
      <div className="panel-header">
        <span className="panel-title">Jerarquía</span>
      </div>
      <div className="panel-content">
        {sceneObjects.map((obj) => (
          <div
            key={obj.id}
            className={`hierarchy-item ${selectedObjectId === obj.id ? 'selected' : ''}`}
            onClick={() => selectObject(obj.id)}
          >
            <span className="hierarchy-icon" style={{ color: obj.color }}>
              {OBJECT_ICONS[obj.type] || '●'}
            </span>
            <span className="hierarchy-name">{obj.name}</span>
            {obj.id !== 'platform' && (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  removeObject(obj.id)
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}