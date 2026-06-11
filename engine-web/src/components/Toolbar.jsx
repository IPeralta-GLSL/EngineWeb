import React, { useEffect } from 'react'
import useEditorStore from '../store/editorStore'

export default function Toolbar() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const initHistory = useEditorStore((s) => s.initHistory)

  useEffect(() => { initHistory() }, [initHistory])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.target.tagName === 'BUTTON') return
      if (mode !== 'edit') return
      if (e.code === 'KeyW') setTransformMode('translate')
      if (e.code === 'KeyE') setTransformMode('rotate')
      if (e.code === 'KeyR') setTransformMode('scale')
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setTransformMode, mode, undo, redo, initHistory])

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">EngineWeb</span>
        <div className="toolbar-separator" />
        {mode === 'edit' && (
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
          <button
            className="play-btn"
            onClick={() => setMode('play')}
            onKeyDown={(e) => e.stopPropagation()}
          >
            ▶ Play
          </button>
        ) : (
          <button
            className="exit-btn"
            onClick={() => setMode('edit')}
            onKeyDown={(e) => e.stopPropagation()}
          >
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