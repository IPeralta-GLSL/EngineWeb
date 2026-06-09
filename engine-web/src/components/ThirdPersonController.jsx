import { useRef, useEffect, useState, useCallback, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useEditorStore from '../store/editorStore'
import PlayerCharacter from './PlayerCharacter'

const MOVE_SPEED = 5
const MOUSE_SENSITIVITY = 0.003
const LERP_SPEED = 8

export default function ThirdPersonController() {
  const mode = useEditorStore((s) => s.mode)
  const getSpawnPosition = useEditorStore((s) => s.getSpawnPosition)

  const { camera, gl } = useThree()
  const keysRef = useRef({})
  const yawRef = useRef(Math.PI)
  const pitchRef = useRef(0.3)
  const distanceRef = useRef(8)
  const pivotRef = useRef(new THREE.Vector3(0, 1, 0))
  const targetRotationRef = useRef(Math.PI)
  const isRightDragRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const initializedRef = useRef(false)
  const [playerState, setPlayerState] = useState({
    position: [0, 0, 0],
    isMoving: false,
    direction: 0,
  })

  useEffect(() => {
    if (mode !== 'play') {
      initializedRef.current = false
      return
    }

    if (!initializedRef.current) {
      const spawnPos = getSpawnPosition()
      pivotRef.current.set(spawnPos[0], spawnPos[1], spawnPos[2])
      yawRef.current = Math.PI
      pitchRef.current = 0.3
      distanceRef.current = 8
      targetRotationRef.current = Math.PI
      initializedRef.current = true
    }

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true
    }
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false
    }
    const onMouseDown = (e) => {
      if (e.button === 2) {
        isRightDragRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    }
    const onMouseUp = (e) => {
      if (e.button === 2) {
        isRightDragRef.current = false
      }
    }
    const onMouseMove = (e) => {
      if (!isRightDragRef.current) return
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
    const onContextMenu = (e) => {
      e.preventDefault()
    }

    const el = gl.domElement
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    el.addEventListener('wheel', onWheel)
    el.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContextMenu)
    }
  }, [mode, gl, getSpawnPosition])

  useFrame((_, delta) => {
    if (mode !== 'play') {
      setPlayerState((s) => ({ ...s, position: [0, -100, 0] }))
      return
    }

    const pivot = pivotRef.current
    const dir = new THREE.Vector3()

    if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dir.z -= 1
    if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dir.z += 1
    if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dir.x -= 1
    if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dir.x += 1

    const isMoving = dir.length() > 0
    let targetAngle = yawRef.current + Math.PI

    if (isMoving) {
      dir.normalize()
      const angle = yawRef.current
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle))
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
      const move = new THREE.Vector3()
      move.addScaledVector(forward, -dir.z)
      move.addScaledVector(right, dir.x)
      move.normalize().multiplyScalar(MOVE_SPEED * delta)
      pivot.add(move)

      pivot.y = Math.max(0, pivot.y)

      if (move.lengthSq() > 0.0001) {
        targetAngle = Math.atan2(move.x, move.z)
      }
    }

    const currentAngle = targetRotationRef.current
    let angleDiff = targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    targetRotationRef.current = currentAngle + angleDiff * Math.min(1, LERP_SPEED * delta)

    const dist = distanceRef.current
    const yaw = yawRef.current
    const pitch = pitchRef.current

    const camX = pivot.x + dist * Math.sin(yaw) * Math.cos(pitch)
    const camY = pivot.y + dist * Math.sin(pitch)
    const camZ = pivot.z + dist * Math.cos(yaw) * Math.cos(pitch)

    camera.position.set(camX, camY, camZ)
    camera.lookAt(pivot.x, pivot.y + 1.5, pivot.z)

    setPlayerState({
      position: [pivot.x, pivot.y, pivot.z],
      isMoving,
      direction: targetRotationRef.current,
    })
  })

  return (
    <group>
      {mode === 'play' && (
        <Suspense fallback={null}>
          <PlayerCharacter
            position={playerState.position}
            isMoving={playerState.isMoving}
            direction={playerState.direction}
          />
        </Suspense>
      )}
    </group>
  )
}