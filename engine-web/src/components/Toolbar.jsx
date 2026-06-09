import React, { useEffect } from 'react'
import useEditorStore from '../store/editorStore'

export default function Toolbar() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (mode !== 'edit') return
      if (e.code === 'KeyW') setTransformMode('translate')
      if (e.code === 'KeyE') setTransformMode('rotate')
      if (e.code === 'KeyR') setTransformMode('scale')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setTransformMode, mode])

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">EngineWeb</span>
        <div className="toolbar-separator" />
        {mode === 'edit' && (
          <div className="transform-buttons">
            <button
              className={`tb-btn ${transformMode === 'translate' ? 'active' : ''}`}
              onClick={() => setTransformMode('translate')}
              title="Mover (W)"
            >
              ⇄
            </button>
            <button
              className={`tb-btn ${transformMode === 'rotate' ? 'active' : ''}`}
              onClick={() => setTransformMode('rotate')}
              title="Rotar (E)"
            >
              ↻
            </button>
            <button
              className={`tb-btn ${transformMode === 'scale' ? 'active' : ''}`}
              onClick={() => setTransformMode('scale')}
              title="Escalar (R)"
            >
              ⊞
            </button>
          </div>
        )}
      </div>
      <div className="toolbar-center">
        {mode === 'edit' ? (
          <button className="play-btn" onClick={() => setMode('play')}>
            ▶ Play
          </button>
        ) : (
          <button className="exit-btn" onClick={() => setMode('edit')}>
            ⬛ Stop
          </button>
        )}
      </div>
      <div className="toolbar-right">
        <span className={`mode-badge ${mode}`}>
          {mode === 'edit' ? 'EDITOR' : 'PLAY'}
        </span>
      </div>
    </div>
  )
}