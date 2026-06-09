import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useEditorStore from '../store/editorStore'

const MOVE_SPEED = 5
const MOUSE_SENSITIVITY = 0.002

export default function ThirdPersonController() {
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  const updateObject = useEditorStore((s) => s.updateObject)

  const { camera, gl } = useThree()
  const keysRef = useRef({})
  const yawRef = useRef(0)
  const pitchRef = useRef(-0.3)
  const distanceRef = useRef(8)
  const pivotRef = useRef(new THREE.Vector3(0, 2, 0))
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (mode !== 'play') return

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true
    }
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false
    }
    const onMouseDown = (e) => {
      if (e.button === 0) {
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const onMouseUp = (e) => {
      if (e.button === 0) {
        isDraggingRef.current = false
      }
    }
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      yawRef.current -= dx * MOUSE_SENSITIVITY
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - dy * MOUSE_SENSITIVITY,
        -1.2,
        1.2
      )
    }
    const onWheel = (e) => {
      distanceRef.current = THREE.MathUtils.clamp(
        distanceRef.current + e.deltaY * 0.01,
        2,
        20
      )
    }

    const el = gl.domElement
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    el.addEventListener('wheel', onWheel)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [mode, gl])

  useFrame((_, delta) => {
    if (mode !== 'play') return

    const pivot = pivotRef.current
    const dir = new THREE.Vector3()

    if (keysRef.current['KeyW']) dir.z -= 1
    if (keysRef.current['KeyS']) dir.z += 1
    if (keysRef.current['KeyA']) dir.x -= 1
    if (keysRef.current['KeyD']) dir.x += 1

    if (dir.length() > 0) {
      dir.normalize()
      const angle = yawRef.current
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle))
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
      const move = new THREE.Vector3()
      move.addScaledVector(forward, -dir.z)
      move.addScaledVector(right, dir.x)
      move.normalize().multiplyScalar(MOVE_SPEED * delta)
      pivot.add(move)

      const selectedObj = sceneObjects.find((o) => o.id === selectedObjectId)
      if (selectedObj) {
        updateObject(selectedObj.id, {
          position: [pivot.x, pivot.y, pivot.z],
          rotation: selectedObj.rotation,
          scale: selectedObj.scale,
        })
      }
    }

    const dist = distanceRef.current
    const yaw = yawRef.current
    const pitch = pitchRef.current

    const camX = pivot.x + dist * Math.sin(yaw) * Math.cos(pitch)
    const camY = pivot.y + dist * Math.sin(pitch)
    const camZ = pivot.z + dist * Math.cos(yaw) * Math.cos(pitch)

    camera.position.set(camX, camY, camZ)
    camera.lookAt(pivot)
  })

  useEffect(() => {
    if (mode === 'play') {
      const selectedObj = sceneObjects.find((o) => o.id === selectedObjectId)
      if (selectedObj) {
        pivotRef.current.set(
          selectedObj.position[0],
          selectedObj.position[1],
          selectedObj.position[2]
        )
      } else {
        pivotRef.current.set(0, 2, 0)
      }
    }
  }, [mode, selectedObjectId, sceneObjects])

  return null
}