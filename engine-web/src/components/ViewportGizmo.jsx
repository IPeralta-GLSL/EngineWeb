import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ViewportGizmo } from 'three-viewport-gizmo'

export default function ViewportGizmoWidget() {
  const { camera, gl } = useThree()
  const gizmoRef = useRef(null)

  useEffect(() => {
    const gizmo = new ViewportGizmo(camera, gl, {
      type: 'sphere',
      size: 120,
      placement: 'bottom-right',
      animated: true,
      speed: 1,
      resolution: 64,
      background: {
        enabled: true,
        color: 0x222222,
        opacity: 0.6,
        hover: {
          color: 0x333333,
          opacity: 0.8,
        },
      },
      x: { color: 0xff4444, labelColor: 0xff6666 },
      y: { color: 0x44ff44, labelColor: 0x66ff66 },
      z: { color: 0x4444ff, labelColor: 0x6666ff },
      offset: {
        right: 10,
        bottom: 10,
      },
    })

    gizmoRef.current = gizmo

    return () => {
      if (gizmoRef.current) {
        gizmoRef.current.dispose()
        gizmoRef.current = null
      }
    }
  }, [camera, gl])

  useFrame(() => {
    if (gizmoRef.current) {
      gizmoRef.current.cameraUpdate().render()
    }
  })

  return null
}