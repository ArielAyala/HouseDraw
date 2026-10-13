import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { useTheme } from '../app/ThemeProvider'
import { canvasColorsFromTheme } from '../canvas/colors'
import { useDocumentStore } from '../document/store'
import { buildSceneBoxes, MM_PER_M, type SceneBox, sceneFraming } from './model'
import styles from './Preview3D.module.css'

export default function Preview3D() {
  const plan = useDocumentStore((state) => state.document)
  const { theme } = useTheme()
  const colors = canvasColorsFromTheme(theme)
  const boxes = useMemo(() => buildSceneBoxes(plan), [plan])
  const framing = useMemo(() => sceneFraming(boxes), [boxes])
  const [tx, ty, tz] = framing.target
  const d = framing.distanceM

  return (
    <div className={styles.wrap}>
      <Canvas
        camera={{
          position: [tx + d * 0.7, ty + d * 0.6, tz + d * 0.7],
          fov: 40,
          near: 0.1,
          far: 500,
        }}
      >
        <color attach="background" args={[colors.background]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.9} />
        {boxes.map((box) => (
          <SceneBoxMesh
            key={box.id}
            box={box}
            color={box.kind === 'wall' ? colors.wall : colors.wallSelected}
          />
        ))}
        <gridHelper args={[framing.groundSizeM, framing.groundSizeM]} />
        <OrbitControls makeDefault target={framing.target} />
      </Canvas>
    </div>
  )
}

function SceneBoxMesh(props: { box: SceneBox; color: string }) {
  const { box, color } = props
  const rotationY = -(box.rotationDeg * Math.PI) / 180
  return (
    <mesh
      position={[box.x / MM_PER_M, box.z / MM_PER_M, box.y / MM_PER_M]}
      rotation={[0, rotationY, 0]}
    >
      <boxGeometry
        args={[
          box.lengthMm / MM_PER_M,
          box.heightMm / MM_PER_M,
          box.thicknessMm / MM_PER_M,
        ]}
      />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}
