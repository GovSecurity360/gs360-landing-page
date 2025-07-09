"use client"

import { useFrame } from "@react-three/fiber"
import { Sphere } from "@react-three/drei"
import * as THREE from "three"
import { useRef, useEffect, useState } from "react"
import { feature } from "topojson-client"

const RADIUS = 2

function latLngToVec3(lat: number, lon: number, radius = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

export default function InteractiveGlobe() {
  const groupRef = useRef<THREE.Group>(null)
  const [landMeshes, setLandMeshes] = useState<React.ReactNode[]>([])
  const [mouseY, setMouseY] = useState(0)
  const [isMouseIn, setIsMouseIn] = useState(true)

  useEffect(() => {
    async function loadData() {
      const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      const topoData = await res.json()
      const geo = feature(topoData, topoData.objects.countries)

      const meshes: React.ReactNode[] = []

      for (const feature of geo.features) {
        if (!feature.geometry) continue
        const coords = feature.geometry.coordinates

        const rings =
          feature.geometry.type === "Polygon"
            ? [coords]
            : feature.geometry.type === "MultiPolygon"
            ? coords
            : []

        for (const polygon of rings) {
          const points: THREE.Vector3[] = polygon[0].map(([lon, lat]: [number, number]) =>
            latLngToVec3(lat, lon, RADIUS + 0.01)
          )

          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({ color: "#00d4ff" })

          const line = (
            <primitive
              key={Math.random()}
              object={new THREE.Line(geometry, material)}
            />
          )

          meshes.push(line)
        }
      }

      setLandMeshes(meshes)
    }

    loadData()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const y = -(e.clientY / window.innerHeight) * 2 + 1 // from -1 (bottom) to 1 (top)
      setMouseY(y)
    }

    const handleLeave = () => setIsMouseIn(false)
    const handleEnter = () => setIsMouseIn(true)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleLeave)
    window.addEventListener("mouseenter", handleEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleLeave)
      window.removeEventListener("mouseenter", handleEnter)
    }
  }, [])

  useFrame(() => {
    if (groupRef.current) {
      // Continuous spin around Y-axis
      groupRef.current.rotation.y += 0.002

      // Cursor tilt around X-axis
      const targetX = isMouseIn ? mouseY * 0.3 : 0
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.05
      )
    }
  })

  return (
    <group ref={groupRef}>
      <Sphere args={[RADIUS, 64, 64]}>
        <meshStandardMaterial color="black" transparent opacity={0.1} />
      </Sphere>
      {landMeshes}
    </group>
  )
}
