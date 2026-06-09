import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const GLB_PATH = '/Assets/Character/Mesh/human-base.glb'
const IDLE_PATH = '/Assets/Character/animations/idle.glb'
const JOG_PATH = '/Assets/Character/animations/jog.glb'

useGLTF.preload(GLB_PATH)
useGLTF.preload(IDLE_PATH)
useGLTF.preload(JOG_PATH)

export default function PlayerCharacter({ position, rotation, isMoving, direction }) {
  const groupRef = useRef()
  const prevMovingRef = useRef(false)
  const fadeTimeRef = useRef(0)

  const gltfModel = useGLTF(GLB_PATH)
  const idleClip = useMemo(() => {
    const anims = new THREE.Object3D()
    return null
  }, [])

  const { animations } = useGLTF(GLB_PATH)

  const idleGltf = useGLTF(IDLE_PATH)
  const jogGltf = useGLTF(JOG_PATH)

  const allClips = useMemo(() => {
    const clips = []
    if (idleGltf.animations.length > 0) {
      clips.push({ name: 'idle', clip: idleGltf.animations[0] })
    }
    if (jogGltf.animations.length > 0) {
      clips.push({ name: 'jog', clip: jogGltf.animations[0] })
    }
    return clips
  }, [idleGltf, jogGltf])

  const clipArray = useMemo(() => allClips.map((c) => c.clip), [allClips])

  const { actions, mixer } = useAnimations(clipArray, gltfModel.scene)

  const currentActionRef = useRef(null)

  useEffect(() => {
    return () => {
      Object.values(actions).forEach((a) => {
        if (a) a.stop()
      })
    }
  }, [actions])

  useEffect(() => {
    if (!actions) return

    const actionName = isMoving ? 'jog' : 'idle'
    const nextAction = actions[actionName]
    if (!nextAction) return

    if (currentActionRef.current && currentActionRef.current !== nextAction) {
      nextAction.reset()
      nextAction.setEffectiveTimeScale(1)
      nextAction.setEffectiveWeight(1)
      nextAction.crossFadeFrom(currentActionRef.current, 0.2, true)
      nextAction.play()
    } else if (!currentActionRef.current) {
      nextAction.reset()
      nextAction.play()
    }

    currentActionRef.current = nextAction
  }, [isMoving, actions])

  useFrame((_, delta) => {
    if (mixer) mixer.update(delta)

    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2])

      if (direction !== undefined) {
        groupRef.current.rotation.y = direction
      }
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={gltfModel.scene.clone()} />
    </group>
  )
}