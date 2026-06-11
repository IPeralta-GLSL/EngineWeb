import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Sky, TransformControls, Edges } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import useEditorStore from '../store/editorStore'
import CameraController from './CameraController'
import ViewportGizmoWidget from './ViewportGizmo'

function createSunTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 128)
  const cx = 64, cy = 64
  ctx.beginPath()
  ctx.arc(cx, cy, 16, 0, Math.PI * 2)
  ctx.fillStyle = '#fbbf24'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)
  ctx.strokeStyle = '#fff3b0'
  ctx.lineWidth = 2
  ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20)
    ctx.lineTo(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 30)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function SpawnObject({ obj }) {
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const isSelected = selectedObjectId === obj.id

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit') selectObject(obj.id)
    },
    [mode, obj.id, selectObject]
  )

  return (
    <group position={obj.position} onClick={handleClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color={obj.color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.6, 0.65, 32]} />
        <meshBasicMaterial color={obj.color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <pointLight color={obj.color} intensity={0.5} distance={3} />
      {isSelected && mode === 'edit' && <Edges threshold={15} color="#00bfff" lineWidth={2} />}
    </group>
  )
}

function DirectionalLightObject({ obj }) {
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const updateObject = useEditorStore((s) => s.updateObject)
  const transformMode = useEditorStore((s) => s.transformMode)
  const isSelected = selectedObjectId === obj.id
  const isPlay = mode === 'play'
  const groupRef = useRef()
  const iconRef = useRef()

  const { camera } = useThree()

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit') selectObject(obj.id)
    },
    [mode, obj.id, selectObject]
  )

  const sunTex = useMemo(() => createSunTexture(), [])

  useFrame(() => {
    if (iconRef.current) {
      iconRef.current.quaternion.copy(camera.quaternion)
    }
  })

  const content = (
    <group position={obj.position} rotation={obj.rotation} onClick={handleClick}>
      <directionalLight
        color={obj.color}
        intensity={obj.intensity || 2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {!isPlay && (
        <>
          <sprite ref={iconRef} scale={[2, 2, 1]}>
            <spriteMaterial
              map={sunTex}
              transparent
              depthTest={false}
              opacity={isSelected ? 1 : 0.7}
            />
          </sprite>
          {isSelected && (
            <mesh>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color="#00bfff" wireframe transparent opacity={0.5} />
            </mesh>
          )}
        </>
      )}
    </group>
  )

  if (isSelected && !isPlay && mode === 'edit') {
    return (
      <DirectionalLightGizmo obj={obj} updateObject={updateObject} transformMode={transformMode}>
        {content}
      </DirectionalLightGizmo>
    )
  }

  return content
}

function DirectionalLightGizmo({ obj, updateObject, transformMode, children }) {
  const tcRef = useRef()

  useEffect(() => {
    const ctrl = tcRef.current
    if (!ctrl) return
    const onObjectChange = () => {
      updateObject(obj.id, { rotation: [...obj.rotation] })
    }
    ctrl.addEventListener('objectChange', onObjectChange)
    return () => ctrl.removeEventListener('objectChange', onObjectChange)
  }, [obj.id, updateObject, obj.rotation])

  return <TransformControls ref={tcRef} mode={transformMode}>{children}</TransformControls>
}

function PointLightObject({ obj }) {
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const isSelected = selectedObjectId === obj.id
  const isPlay = mode === 'play'
  const isGizmoDragging = useEditorStore((s) => s.isGizmoDragging)

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit' && !isGizmoDragging) selectObject(obj.id)
    },
    [mode, obj.id, selectObject, isGizmoDragging]
  )

  return (
    <group position={obj.position} onClick={handleClick}>
      <pointLight color={obj.color} intensity={obj.intensity || 5} distance={15} castShadow />
      {!isPlay && (
        <>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={obj.color} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color={obj.color} transparent opacity={0.15} wireframe />
          </mesh>
          {isSelected && (
            <mesh>
              <sphereGeometry args={[0.55, 16, 16]} />
              <meshBasicMaterial color="#00bfff" wireframe transparent opacity={0.5} />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}

function SceneObject({ obj }) {
  const meshRef = useRef()
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const updateObject = useEditorStore((s) => s.updateObject)
  const transformMode = useEditorStore((s) => s.transformMode)
  const isSelected = selectedObjectId === obj.id
  const hasPhysics = obj.hasPhysics !== false
  const isPlay = mode === 'play'
  const isGizmoDragging = useEditorStore((s) => s.isGizmoDragging)

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit' && !isGizmoDragging) selectObject(obj.id)
    },
    [mode, obj.id, selectObject, isGizmoDragging]
  )

  const geometryMap = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.4, 0.15, 16, 32]} />,
    capsule: <capsuleGeometry args={[0.3, 0.6, 16, 32]} />,
  }

  const colliderType = obj.type === 'sphere' ? 'ball' : obj.type === 'box' ? 'cuboid' : 'hull'
  const pos = obj.position
  const rot = obj.rotation
  const scl = obj.scale

  if (isPlay && hasPhysics) {
    return (
      <RigidBody
        type={obj.id === 'platform' ? 'fixed' : 'dynamic'}
        colliders={colliderType}
        position={pos}
        rotation={rot}
        scale={scl}
        restitution={0.1}
        friction={0.9}
      >
        <mesh
          ref={meshRef}
          onClick={handleClick}
          castShadow
          receiveShadow
          userData={{ objectId: obj.id }}
        >
          {geometryMap[obj.type] || geometryMap.box}
          <meshStandardMaterial color={obj.color} roughness={0.5} metalness={0.1} />
        </mesh>
      </RigidBody>
    )
  }

  if (!isPlay && isSelected && mode === 'edit') {
    return (
      <MeshGizmoWrapper meshRef={meshRef} mode={transformMode} obj={obj} updateObject={updateObject} pos={pos} rot={rot} scl={scl} onClick={handleClick} type={obj.type} color={obj.color} hasEdge={true} />
    )
  }

  return (
    <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={handleClick} castShadow receiveShadow userData={{ objectId: obj.id }}>
      {geometryMap[obj.type] || geometryMap.box}
      <meshStandardMaterial color={obj.color} roughness={0.5} metalness={0.1} />
    </mesh>
  )
}

function MeshGizmoWrapper({ meshRef, mode, obj, updateObject, pos, rot, scl, onClick, type, color, hasEdge }) {
  const tcRef = useRef()
  const innerRef = useRef()
  const setGizmoDragging = useEditorStore((s) => s.setGizmoDragging)

  useEffect(() => {
    const ctrl = tcRef.current
    if (!ctrl) return

    const onDraggingChanged = (event) => {
      setGizmoDragging(event.value)
    }

    const handler = () => {
      if (!innerRef.current) return
      const m = innerRef.current
      updateObject(obj.id, {
        position: [m.position.x, m.position.y, m.position.z],
        rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
        scale: [m.scale.x, m.scale.y, m.scale.z],
      })
    }

    ctrl.addEventListener('dragging-changed', onDraggingChanged)
    ctrl.addEventListener('objectChange', handler)
    return () => {
      ctrl.removeEventListener('dragging-changed', onDraggingChanged)
      ctrl.removeEventListener('objectChange', handler)
      setGizmoDragging(false)
    }
  }, [obj.id, updateObject, setGizmoDragging])

  const geometryMap = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.4, 0.15, 16, 32]} />,
    capsule: <capsuleGeometry args={[0.3, 0.6, 16, 32]} />,
  }

  return (
    <TransformControls ref={tcRef} mode={mode}>
      <mesh ref={(el) => { innerRef.current = el; meshRef.current = el; }} position={pos} rotation={rot} scale={scl} onClick={onClick} castShadow receiveShadow userData={{ objectId: obj.id }}>
        {geometryMap[type] || geometryMap.box}
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        {hasEdge && <Edges threshold={15} color="#00bfff" lineWidth={2} />}
      </mesh>
    </TransformControls>
  )
}

function LightRenderers() {
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  return (
    <>
      {sceneObjects.map((obj) => {
        if (obj.type === 'directionalLight') return <DirectionalLightObject key={obj.id} obj={obj} />
        if (obj.type === 'pointLight') return <PointLightObject key={obj.id} obj={obj} />
        return null
      })}
    </>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#87ceeb', '#362312', 0.4]} />
    </>
  )
}

function SceneObjects() {
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  return (
    <>
      {sceneObjects.map((obj) => {
        if (obj.type === 'spawn') return <SpawnObject key={obj.id} obj={obj} />
        if (obj.type === 'directionalLight') return null
        if (obj.type === 'pointLight') return null
        return <SceneObject key={obj.id} obj={obj} />
      })}
    </>
  )
}

function DropHandler() {
  const { camera, raycaster, gl } = useThree()
  const addObject = useEditorStore((s) => s.addObject)
  const mode = useEditorStore((s) => s.mode)

  const onDrop = useCallback(
    (e) => {
      if (mode !== 'edit') return
      e.preventDefault()
      const objectType = e.dataTransfer.getData('objectType')
      if (!objectType) return
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)
      if (intersection) addObject(objectType, [intersection.x, 0.5, intersection.z])
    },
    [camera, raycaster, addObject, mode, gl]
  )

  const onDragOver = useCallback((e) => { e.preventDefault() }, [])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('drop', onDrop)
    canvas.addEventListener('dragover', onDragOver)
    return () => {
      canvas.removeEventListener('drop', onDrop)
      canvas.removeEventListener('dragover', onDragOver)
    }
  }, [onDrop, onDragOver, gl])

  return null
}

function SceneContent() {
  const mode = useEditorStore((s) => s.mode)
  const isPlay = mode === 'play'

  return (
    <>
      <Lights />
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0.5} azimuth={0.25} turbidity={8} rayleigh={2} />
      {isPlay ? (
        <Physics gravity={[0, -9.81, 0]}>
          <SceneObjects />
          <LightRenderers />
          <CameraController />
        </Physics>
      ) : (
        <>
          <SceneObjects />
          <LightRenderers />
          <CameraController />
        </>
      )}
      <ViewportGizmoWidget />
      <DropHandler />
    </>
  )
}

export default function Scene() {
  const deselectAll = useEditorStore((s) => s.deselectAll)
  return (
    <Canvas
      shadows
      camera={{ position: [10, 8, 10], fov: 50 }}
      onPointerMissed={() => deselectAll()}
      style={{ background: '#1a1a2e' }}
      gl={{ antialias: true }}
    >
      <SceneContent />
    </Canvas>
  )
}