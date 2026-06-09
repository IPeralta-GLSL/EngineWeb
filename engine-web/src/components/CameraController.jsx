import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import useEditorStore from '../store/editorStore'

const MOVE_SPEED = 5
const MOUSE_SENSITIVITY = 0.003
const LERP_SPEED = 8

const MODEL_URL = '/Assets/Character/Mesh/human-base.glb'
const IDLE_URL = '/Assets/Character/animations/idle.glb'
const JOG_URL = '/Assets/Character/animations/jog.glb'

function PlayMode() {
  const { camera, gl, scene } = useThree()
  const getSpawnPosition = useEditorStore((s) => s.getSpawnPosition)

  const keysRef = useRef({})
  const yawRef = useRef(Math.PI)
  const pitchRef = useRef(0.3)
  const distanceRef = useRef(8)
  const pivotRef = useRef(new THREE.Vector3(0, 1, 0))
  const targetRotationRef = useRef(Math.PI)
  const isRightDragRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })

  const characterGroupRef = useRef()
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const cleanupRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()

    const cleanup = () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      if (characterGroupRef.current) {
        scene.remove(characterGroupRef.current)
        characterGroupRef.current.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material]
              mats.forEach((m) => m.dispose())
            }
          }
        })
        characterGroupRef.current = null
      }
      actionsRef.current = {}
      currentActionRef.current = null
    }

    cleanupRef.current = cleanup

    const loadAll = async () => {
      const [modelGltf, idleGltf, jogGltf] = await Promise.all([
        new Promise((resolve, reject) => loader.load(MODEL_URL, resolve, undefined, reject)),
        new Promise((resolve, reject) => loader.load(IDLE_URL, resolve, undefined, reject)),
        new Promise((resolve, reject) => loader.load(JOG_URL, resolve, undefined, reject)),
      ])

      if (cancelled) return

      cleanup()

      const modelScene = modelGltf.scene

      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      const characterGroup = new THREE.Group()
      characterGroup.add(modelScene)

      const spawnPos = getSpawnPosition()
      characterGroup.position.set(spawnPos[0], spawnPos[1], spawnPos[2])
      characterGroup.rotation.y = Math.PI

      scene.add(characterGroup)

      const mixer = new THREE.AnimationMixer(modelScene)
      mixerRef.current = mixer

      const idleClip = idleGltf.animations[0]
      const jogClip = jogGltf.animations[0]

      if (idleClip) {
        const idleAction = mixer.clipAction(idleClip)
        idleAction.setLoop(THREE.LoopRepeat, Infinity)
        idleAction.play()
        actionsRef.current.idle = idleAction
        currentActionRef.current = idleAction
      }

      if (jogClip) {
        const jogAction = mixer.clipAction(jogClip)
        jogAction.setLoop(THREE.LoopRepeat, Infinity)
        actionsRef.current.jog = jogAction
      }

      characterGroupRef.current = characterGroup
    }

    loadAll().catch(console.error)

    return () => {
      cancelled = true
      cleanup()
    }
  }, [scene, getSpawnPosition])

  useEffect(() => {
    const spawnPos = getSpawnPosition()
    pivotRef.current.set(spawnPos[0], spawnPos[1], spawnPos[2])
    yawRef.current = Math.PI
    pitchRef.current = 0.3
    distanceRef.current = 8
    targetRotationRef.current = Math.PI

    const onKeyDown = (e) => { keysRef.current[e.code] = true }
    const onKeyUp = (e) => { keysRef.current[e.code] = false }
    const onMouseDown = (e) => {
      if (e.button === 2) {
        isRightDragRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    }
    const onMouseUp = (e) => {
      if (e.button === 2) { isRightDragRef.current = false }
    }
    const onMouseMove = (e) => {
      if (!isRightDragRef.current) return
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      yawRef.current -= dx * MOUSE_SENSITIVITY
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - dy * MOUSE_SENSITIVITY, -1.2, 1.2
      )
    }
    const onWheel = (e) => {
      distanceRef.current = THREE.MathUtils.clamp(
        distanceRef.current + e.deltaY * 0.01, 2, 20
      )
    }
    const onContextMenu = (e) => { e.preventDefault() }

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
  }, [gl, getSpawnPosition])

  useFrame((_, delta) => {
    const pivot = pivotRef.current
    const dir = new THREE.Vector3()

    if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dir.z -= 1
    if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dir.z += 1
    if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dir.x -= 1
    if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dir.x += 1

    const moving = dir.length() > 0

    const nextActionName = moving ? 'jog' : 'idle'
    const nextAction = actionsRef.current[nextActionName]
    if (nextAction && nextAction !== currentActionRef.current) {
      nextAction.reset()
      nextAction.setEffectiveTimeScale(1)
      nextAction.setEffectiveWeight(1)
      if (currentActionRef.current) {
        nextAction.crossFadeFrom(currentActionRef.current, 0.2, true)
      }
      nextAction.play()
      currentActionRef.current = nextAction
    }

    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    let targetAngle = yawRef.current + Math.PI

    if (moving) {
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
    targetRotationRef.current =
      currentAngle + angleDiff * Math.min(1, LERP_SPEED * delta)

    if (characterGroupRef.current) {
      characterGroupRef.current.position.set(pivot.x, pivot.y, pivot.z)
      characterGroupRef.current.rotation.y = targetRotationRef.current
    }

    const dist = distanceRef.current
    const yaw = yawRef.current
    const pitch = pitchRef.current

    const camX = pivot.x + dist * Math.sin(yaw) * Math.cos(pitch)
    const camY = pivot.y + dist * Math.sin(pitch) + 1.5
    const camZ = pivot.z + dist * Math.cos(yaw) * Math.cos(pitch)

    camera.position.set(camX, camY, camZ)
    camera.lookAt(pivot.x, pivot.y + 1, pivot.z)
  })

  return null
}

export default function CameraController() {
  const mode = useEditorStore((s) => s.mode)

  if (mode === 'edit') {
    return (
      <OrbitControls
        makeDefault
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    )
  }

  return <PlayMode />
}