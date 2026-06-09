import React, { useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Sky, TransformControls, Edges } from '@react-three/drei'
import * as THREE from 'three'
import useEditorStore from '../store/editorStore'
import CameraController from './CameraController'

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
        <meshBasicMaterial
          color={obj.color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.6, 0.65, 32]} />
        <meshBasicMaterial
          color={obj.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <pointLight color={obj.color} intensity={0.5} distance={3} />
      {isSelected && mode === 'edit' && (
        <Edges threshold={15} color="#00bfff" lineWidth={2} />
      )}
    </group>
  )
}

function DirectionalLightObject({ obj }) {
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
      <directionalLight
        color={obj.color}
        intensity={obj.intensity || 2}
        position={[0, 0, 0]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={obj.color} wireframe />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.08, 0.3, 4]} />
        <meshBasicMaterial color={obj.color} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.08, 0.3, 4]} />
        <meshBasicMaterial color={obj.color} />
      </mesh>
      {isSelected && mode === 'edit' && (
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial
            color="#00bfff"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  )
}

function PointLightObject({ obj }) {
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
      <pointLight
        color={obj.color}
        intensity={obj.intensity || 5}
        distance={15}
        castShadow
      />
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={obj.color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color={obj.color}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
      {isSelected && mode === 'edit' && (
        <mesh>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial
            color="#00bfff"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
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

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (mode === 'edit') selectObject(obj.id)
    },
    [mode, obj.id, selectObject]
  )

  const geometryMap = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.4, 0.15, 16, 32]} />,
    capsule: <capsuleGeometry args={[0.3, 0.6, 16, 32]} />,
  }

  const mesh = (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
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

  if (isSelected && mode === 'edit' && meshRef) {
    return (
      <TransformControlsWrapper
        meshRef={meshRef}
        mode={transformMode}
        obj={obj}
        updateObject={updateObject}
      >
        {mesh}
      </TransformControlsWrapper>
    )
  }

  return mesh
}

function TransformControlsWrapper({ meshRef, mode, obj, updateObject, children }) {
  const tcRef = useRef()

  const onPointerUp = useCallback(() => {
    if (!tcRef.current || !meshRef.current) return
    const m = meshRef.current
    updateObject(obj.id, {
      position: [m.position.x, m.position.y, m.position.z],
      rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
      scale: [m.scale.x, m.scale.y, m.scale.z],
    })
  }, [obj.id, updateObject, meshRef])

  return (
    <TransformControls
      ref={tcRef}
      mode={mode}
      onPointerUp={onPointerUp}
      onMouseUp={onPointerUp}
      object={meshRef.current || undefined}
    >
      {children}
    </TransformControls>
  )
}

function LightRenderers() {
  const sceneObjects = useEditorStore((s) => s.sceneObjects)

  return (
    <>
      {sceneObjects.map((obj) => {
        if (obj.type === 'directionalLight') {
          return <DirectionalLightObject key={obj.id} obj={obj} />
        }
        if (obj.type === 'pointLight') {
          return <PointLightObject key={obj.id} obj={obj} />
        }
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
  const { camera, raycaster } = useThree()
  const addObject = useEditorStore((s) => s.addObject)

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      const objectType = e.dataTransfer.getData('objectType')
      if (!objectType) return

      const rect = e.target.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)

      if (intersection) {
        const pos = [intersection.x, 0.5, intersection.z]
        addObject(objectType, pos)
      }
    },
    [camera, raycaster, addObject]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    const canvas = document.querySelector('.viewport canvas')
    if (!canvas) return
    canvas.addEventListener('drop', onDrop)
    canvas.addEventListener('dragover', onDragOver)
    return () => {
      canvas.removeEventListener('drop', onDrop)
      canvas.removeEventListener('dragover', onDragOver)
    }
  }, [onDrop, onDragOver])

  return null
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
      <LightRenderers />
      <CameraController />
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