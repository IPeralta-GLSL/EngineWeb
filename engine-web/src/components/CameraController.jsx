import React, { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import useEditorStore from '../store/editorStore'

const MOVE_SPEED = 5
const MOUSE_SENSITIVITY = 0.003
const LERP_SPEED = 8
const CAMERA_COLLISION_MARGIN = 0.5
const JUMP_FORCE = 6

const ANIMATIONS = {
  idle: '/Assets/Character/animations/idle.glb',
  jog: '/Assets/Character/animations/jog.glb',
  jumpStart: '/Assets/Character/animations/Jump_Start.glb',
  jumpLoop: '/Assets/Character/animations/Jump_Loop.glb',
  jumpLand: '/Assets/Character/animations/Jump_Land.glb',
  crouchIdle: '/Assets/Character/animations/Crouch_Idle.glb',
  crouchFwd: '/Assets/Character/animations/Crouch_Fwd_Loop.glb',
  death: '/Assets/Character/animations/Death.glb',
  swimIdle: '/Assets/Character/animations/Swim_Idle.glb',
  swimFwd: '/Assets/Character/animations/Swim_Fwd_Loop.glb',
}

const MODEL_URL = '/Assets/Character/Mesh/human-base.glb'

function CharacterModel({ rigidBodyRef, animationState }) {
  const { scene } = useThree()
  const characterGroupRef = useRef()
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const loadedRef = useRef(false)
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
        characterGroupRef.current = null
      }
      actionsRef.current = {}
      currentActionRef.current = null
    }

    cleanupRef.current = cleanup

    const loadAll = async () => {
      const entries = Object.entries(ANIMATIONS)
      const promises = [
        new Promise((r, j) => loader.load(MODEL_URL, r, undefined, j)),
        ...entries.map(([, url]) =>
          new Promise((r, j) => loader.load(url, r, undefined, j))
        ),
      ]
      const results = await Promise.all(promises)
      if (cancelled) return

      cleanup()

      const modelScene = results[0].scene
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      const group = new THREE.Group()
      group.add(modelScene)
      group.rotation.y = Math.PI
      scene.add(group)
      characterGroupRef.current = group

      const mixer = new THREE.AnimationMixer(modelScene)
      mixerRef.current = mixer

      entries.forEach(([key], index) => {
        const clip = results[index + 1].animations[0]
        if (clip) {
          const action = mixer.clipAction(clip)
          action.setLoop(THREE.LoopRepeat, Infinity)
          actionsRef.current[key] = action
        }
      })

      if (actionsRef.current.idle) {
        actionsRef.current.idle.play()
        currentActionRef.current = actionsRef.current.idle
      }

      loadedRef.current = true
    }

    loadAll().catch(console.error)
    return () => { cancelled = true; cleanup() }
  }, [scene])

  const switchAnimation = useCallback((name) => {
    const next = actionsRef.current[name]
    if (next && next !== currentActionRef.current) {
      next.reset()
      next.setEffectiveTimeScale(1)
      next.setEffectiveWeight(1)
      if (currentActionRef.current) {
        next.crossFadeFrom(currentActionRef.current, 0.15, true)
      }
      next.play()
      currentActionRef.current = next
    }
  }, [])

  useFrame(() => {
    if (!characterGroupRef.current || !rigidBodyRef.current) return

    const rb = rigidBodyRef.current
    const pos = rb.translation()
    const rot = rb.rotation()

    characterGroupRef.current.position.set(pos.x, pos.y, pos.z)
    characterGroupRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w)

    if (mixerRef.current) mixerRef.current.update(0.016)

    if (animationState.current) {
      switchAnimation(animationState.current)
    }
  })

  return null
}

function PlayMode() {
  const { camera, gl, scene } = useThree()
  const getSpawnPosition = useEditorStore((s) => s.getSpawnPosition)
  const setMode = useEditorStore((s) => s.setMode)

  const rigidBodyRef = useRef()
  const keysRef = useRef({})
  const yawRef = useRef(Math.PI)
  const pitchRef = useRef(0.3)
  const distanceRef = useRef(8)
  const targetRotationRef = useRef(Math.PI)
  const isRightDragRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const isGroundedRef = useRef(true)
  const jumpCooldownRef = useRef(0)
  const animationState = useRef('idle')
  const collidableMeshesRef = useRef([])
  const raycasterRef = useRef(new THREE.Raycaster())
  const camDir = useRef(new THREE.Vector3())
  const camPosResult = useRef(new THREE.Vector3())
  const initializedRef = useRef(false)
  const pivotRef = useRef(new THREE.Vector3(0, 0, 0))

  const spawnPos = getSpawnPosition()

  useEffect(() => {
    if (!initializedRef.current) {
      pivotRef.current.set(spawnPos[0], spawnPos[1], spawnPos[2])
      yawRef.current = Math.PI
      pitchRef.current = 0.3
      distanceRef.current = 8
      targetRotationRef.current = Math.PI
      initializedRef.current = true
    }

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true
      if (e.code === 'Escape') {
        if (document.pointerLockElement) document.exitPointerLock()
        setMode('edit')
      }
    }
    const onKeyUp = (e) => { keysRef.current[e.code] = false }
    const onMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) {
        isRightDragRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const onMouseUp = () => { isRightDragRef.current = false }
    const onMouseMove = (e) => {
      if (!isRightDragRef.current) return
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      yawRef.current -= dx * MOUSE_SENSITIVITY
      pitchRef.current = THREE.MathUtils.clamp(pitchRef.current - dy * MOUSE_SENSITIVITY, -1.2, 1.2)
    }
    const onWheel = (e) => {
      distanceRef.current = THREE.MathUtils.clamp(distanceRef.current + e.deltaY * 0.01, 2, 20)
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

    el.requestPointerLock()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContextMenu)
      if (document.pointerLockElement === el) document.exitPointerLock()
      initializedRef.current = false
    }
  }, [gl, getSpawnPosition, setMode])

  const updateCollidableMeshes = useCallback(() => {
    const meshes = []
    scene.traverse((child) => {
      if (child.isMesh && child.userData?.objectId) {
        meshes.push(child)
      }
    })
    collidableMeshesRef.current = meshes
  }, [scene])

  useFrame((_, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const pivot = pivotRef.current
    const dir = new THREE.Vector3()

    if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dir.z -= 1
    if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dir.z += 1
    if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dir.x -= 1
    if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dir.x += 1

    const moving = dir.length() > 0
    const pos = rb.translation()
    pivot.set(pos.x, pos.y, pos.z)

    const linvel = rb.linvel()
    const verticalSpeed = Math.abs(linvel.y)
    isGroundedRef.current = verticalSpeed < 0.5 && pos.y < 1.5

    if (jumpCooldownRef.current > 0) jumpCooldownRef.current -= delta

    if (keysRef.current['Space'] && isGroundedRef.current && jumpCooldownRef.current <= 0) {
      rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true)
      jumpCooldownRef.current = 0.5
      animationState.current = 'jumpStart'
    } else if (!isGroundedRef.current) {
      animationState.current = 'jumpLoop'
    } else if (moving) {
      animationState.current = 'jog'
    } else {
      animationState.current = 'idle'
    }

    let targetAngle = yawRef.current + Math.PI

    if (moving && isGroundedRef.current) {
      dir.normalize()
      const angle = yawRef.current
      const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle))
      const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
      const move = new THREE.Vector3()
      move.addScaledVector(forward, -dir.z)
      move.addScaledVector(right, dir.x)
      move.normalize()

      rb.setLinvel({
        x: move.x * MOVE_SPEED,
        y: linvel.y,
        z: move.z * MOVE_SPEED,
      }, true)

      if (move.lengthSq() > 0.0001) {
        targetAngle = Math.atan2(move.x, move.z)
      }
    } else {
      rb.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
    }

    const currentAngle = targetRotationRef.current
    let angleDiff = targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    targetRotationRef.current = currentAngle + angleDiff * Math.min(1, LERP_SPEED * delta)

    if (moving) {
      const currentRot = rb.rotation()
      const targetQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, targetRotationRef.current, 0)
      )
      const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w)
      currentQuat.slerp(targetQuat, Math.min(1, LERP_SPEED * delta))
      rb.setRotation({ x: currentQuat.x, y: currentQuat.y, z: currentQuat.z, w: currentQuat.w }, true)
    }

    const dist = distanceRef.current
    const yaw = yawRef.current
    const pitch = pitchRef.current
    const camX = pivot.x + dist * Math.sin(yaw) * Math.cos(pitch)
    const camY = pivot.y + dist * Math.sin(pitch) + 1.5
    const camZ = pivot.z + dist * Math.cos(yaw) * Math.cos(pitch)

    const pivotPos = camDir.current.set(pivot.x, pivot.y + 1, pivot.z)
    const desiredCam = camPosResult.current.set(camX, camY, camZ)
    camDir.current.subVectors(desiredCam, pivotPos)
    const camDistance = camDir.current.length()

    if (camDistance > 0.01) {
      camDir.current.normalize()
      raycasterRef.current.set(pivotPos, camDir.current, 0, camDistance)
      if (collidableMeshesRef.current.length === 0) updateCollidableMeshes()
      const intersects = raycasterRef.current.intersectObjects(collidableMeshesRef.current, false)
      if (intersects.length > 0) {
        const hitDist = intersects[0].distance - CAMERA_COLLISION_MARGIN
        const safeDist = Math.max(hitDist, 0.5)
        desiredCam.copy(pivotPos).addScaledVector(camDir.current, safeDist)
        desiredCam.y = Math.max(desiredCam.y, pivotPos.y + 0.3)
      }
    }

    camera.position.copy(desiredCam)
    camera.lookAt(pivot.x, pivot.y + 1, pivot.z)
  })

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        colliders="capsule"
        position={spawnPos}
        mass={1}
        restitution={0}
        friction={1}
        enabledRotations={[false, false, false]}
        linearDamping={0.1}
      >
        <mesh visible={false}>
          <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
      <CharacterModel rigidBodyRef={rigidBodyRef} animationState={animationState} />
    </>
  )
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