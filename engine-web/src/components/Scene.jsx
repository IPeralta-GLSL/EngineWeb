import React, { useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky, OrbitControls, TransformControls, Edges } from '@react-three/drei'
import * as THREE from 'three'
import useEditorStore from '../store/editorStore'
import ThirdPersonController from './ThirdPersonController'

function SceneObject({ obj }) {
  const meshRef = useRef()
  const mode = useEditorStore((s) => s.mode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const selectObject = useEditorStore((s) => s.selectObject)
  const isSelected = selectedObjectId === obj.id

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit') {
        selectObject(obj.id)
      }
    },
    [mode, obj.id, selectObject]
  )

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...obj.position)
      meshRef.current.rotation.set(...obj.rotation)
      meshRef.current.scale.set(...obj.scale)
    }
  }, [obj.position, obj.rotation, obj.scale])

  const geometryMap = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.4, 0.15, 16, 32]} />,
    capsule: <capsuleGeometry args={[0.3, 0.6, 16, 32]} />,
  }

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      castShadow
      receiveShadow
      userData={{ objectId: obj.id }}
    >
      {geometryMap[obj.type] || geometryMap.box}
      <meshStandardMaterial
        color={obj.color}
        roughness={0.5}
        metalness={0.1}
      />
      {isSelected && mode === 'edit' && (
        <Edges threshold={15} color="#00bfff" lineWidth={2} />
      )}
    </mesh>
  )
}

function GizmoManager() {
  const mode = useEditorStore((s) => s.mode)
  const transformMode = useEditorStore((s) => s.transformMode)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const updateObject = useEditorStore((s) => s.updateObject)
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  const { scene } = useThree()
  const controlsRef = useRef()
  const objRef = useRef()

  useEffect(() => {
    if (!controlsRef.current) return
    const ctrl = controlsRef.current

    const onDraggingChanged = (event) => {
      if (event.value === false && objRef.current) {
        const mesh = objRef.current
        const selectedObj = sceneObjects.find((o) => o.id === selectedObjectId)
        if (!selectedObj) return
        updateObject(selectedObj.id, {
          position: [mesh.position.x, mesh.position.y, mesh.position.z],
          rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
          scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
        })
      }
    }

    ctrl.addEventListener('dragging-changed', onDraggingChanged)
    return () => ctrl.removeEventListener('dragging-changed', onDraggingChanged)
  }, [selectedObjectId, sceneObjects, updateObject])

  useEffect(() => {
    objRef.current = null
    if (mode !== 'edit' || !selectedObjectId) return

    scene.traverse((child) => {
      if (child.isMesh && child.userData?.objectId === selectedObjectId) {
        objRef.current = child
      }
    })

    if (controlsRef.current && objRef.current) {
      controlsRef.current.attach(objRef.current)
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.detach()
      }
    }
  }, [mode, selectedObjectId, scene])

  if (mode !== 'edit' || !selectedObjectId) return null

  return (
    <TransformControls
      ref={controlsRef}
      mode={transformMode}
    />
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={['#87ceeb', '#362312', 0.4]} />
    </>
  )
}

function SceneObjects() {
  const sceneObjects = useEditorStore((s) => s.sceneObjects)
  return (
    <>
      {sceneObjects.map((obj) => (
        <SceneObject key={obj.id} obj={obj} />
      ))}
    </>
  )
}

function EditorCamera() {
  const mode = useEditorStore((s) => s.mode)

  if (mode !== 'edit') return null

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

function SceneContent() {
  return (
    <>
      <Lights />
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.5}
        azimuth={0.25}
        turbidity={8}
        rayleigh={2}
      />
      <SceneObjects />
      <GizmoManager />
      <ThirdPersonController />
      <EditorCamera />
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