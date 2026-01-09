"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere } from "@react-three/drei"
import * as THREE from "three"
import { useEffect, useMemo, useRef, useState } from "react"
import { feature } from "topojson-client"

const RADIUS = 2

// Lower = faster + fewer vertices, higher = smoother outlines.
// 110m topo is already coarse; sampling every 2–4 points usually looks fine.
const SAMPLE_EVERY = 2

const SPHERE_SEGMENTS = 24

function latLngToVec3(lat: number, lon: number, radius = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function pushSegment(out: number[], a: THREE.Vector3, b: THREE.Vector3) {
  out.push(a.x, a.y, a.z, b.x, b.y, b.z)
}

function GlobeScene({ rotationSpeed = 0.12 }: { rotationSpeed?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  // Use refs so mouse movement doesn’t cause React re-renders.
  const mouseYRef = useRef(0)
  const isMouseInRef = useRef(true)

  // Single merged geometry instead of hundreds/thousands of <Line /> components.
  const [landGeometry, setLandGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false

    async function loadData() {
      try {
        const res = await fetch("/data/countries-110m.json", { signal: controller.signal })
        const topoData = await res.json()
        const geo = feature(topoData, topoData.objects.countries) as any

        const positions: number[] = []

        for (const f of geo.features ?? []) {
          const geom = f?.geometry
          if (!geom) continue

          const coords = geom.coordinates
          const rings =
            geom.type === "Polygon"
              ? [coords]
              : geom.type === "MultiPolygon"
                ? coords
                : []

          for (const polygon of rings) {
            // polygon[0] is the outer ring (ignore holes for performance)
            const ring: [number, number][] = polygon?.[0]
            if (!ring || ring.length < 2) continue

            // Downsample points to reduce vertex count.
            const sampled: [number, number][] = []
            for (let i = 0; i < ring.length; i += SAMPLE_EVERY) {
              sampled.push(ring[i])
            }
            if (sampled.length < 2) continue

            const pts: THREE.Vector3[] = sampled.map(([lon, lat]) =>
              latLngToVec3(lat, lon, RADIUS + 0.01)
            )

            for (let i = 0; i < pts.length - 1; i++) {
              pushSegment(positions, pts[i], pts[i + 1])
            }
            // close the ring
            pushSegment(positions, pts[pts.length - 1], pts[0])
          }
        }

        const geom = new THREE.BufferGeometry()
        geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
        geom.computeBoundingSphere()

        if (disposed) {
          geom.dispose()
          return
        }

        // Dispose previous geometry before swapping
        setLandGeometry((prev) => {
          prev?.dispose()
          return geom
        })
      } catch (err) {
        // Ignore aborts; log anything else.
        if ((err as any)?.name !== "AbortError") {
          console.error("Failed to load globe data:", err)
        }
      }
    }

    loadData()

    return () => {
      disposed = true
      controller.abort()
      // Dispose current geometry
      setLandGeometry((g) => {
        g?.dispose()
        return null
      })
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseYRef.current = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const handleLeave = () => {
      isMouseInRef.current = false
    }

    const handleEnter = () => {
      isMouseInRef.current = true
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleLeave)
    window.addEventListener("mouseenter", handleEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleLeave)
      window.removeEventListener("mouseenter", handleEnter)
    }
  }, [])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    // Continuous spin around its own axis (Y). `rotationSpeed` is radians/sec.
    // Negative sign makes the globe appear to spin left → right from the camera view.
    g.rotation.y += -rotationSpeed * delta

    // Cursor tilt around X-axis.
    const targetX = isMouseInRef.current ? mouseYRef.current * 0.3 : 0
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, 0.08)
  })

  const wireMat = useMemo(
    () => <meshBasicMaterial color="#dbeafe" wireframe transparent opacity={0.08} />,
    []
  )

  return (
    <group ref={groupRef}>
      <Sphere args={[RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}>{wireMat}</Sphere>

      {landGeometry && (
        <lineSegments geometry={landGeometry}>
          <lineBasicMaterial color="#7dd3fc" transparent opacity={0.9} />
        </lineSegments>
      )}
    </group>
  )
}

export default function InteractiveGlobe({
  rotationSpeed = 0.12,
}: {
  rotationSpeed?: number
}) {
  // IMPORTANT: Hooks like useFrame must be used INSIDE Canvas.
  // This wrapper ensures GlobeScene runs within <Canvas /> so R3F hook errors go away.
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={0.6} />
      <GlobeScene rotationSpeed={rotationSpeed} />
    </Canvas>
  )
}
