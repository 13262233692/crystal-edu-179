import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei'
import * as THREE from 'three'

function Atom({ position, color, radius = 0.3, onClick, isSelected, occupancy = 1, isDisordered = false }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      let baseScale = isSelected ? 1.2 : 1
      
      if (isDisordered) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1
        baseScale *= pulse
      }
      
      if (occupancy < 1 && !isDisordered) {
        baseScale *= (0.7 + occupancy * 0.3)
      }
      
      meshRef.current.scale.lerp(new THREE.Vector3(baseScale, baseScale, baseScale), 0.1)
    }
  })
  
  const opacity = isDisordered ? 0.7 : (occupancy < 1 ? Math.max(0.4, occupancy) : 1)
  const transparent = occupancy < 1 || isDisordered
  
  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={isSelected ? color : (isDisordered ? color : '#000000')}
        emissiveIntensity={isSelected ? 0.3 : (isDisordered ? 0.2 : 0)}
        roughness={0.3}
        metalness={0.5}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  )
}

function Bond({ start, end, color = '#888888' }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
    />
  )
}

function UnitCell({ cellParams }) {
  const { a, b, c, alpha, beta, gamma } = cellParams
  
  const vectors = useMemo(() => {
    const alphaRad = (alpha * Math.PI) / 180
    const betaRad = (beta * Math.PI) / 180
    const gammaRad = (gamma * Math.PI) / 180
    
    const ax = a
    const ay = 0
    const az = 0
    
    const bx = b * Math.cos(gammaRad)
    const by = b * Math.sin(gammaRad)
    const bz = 0
    
    const cx = c * Math.cos(betaRad)
    const cy = c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad)
    const cz = Math.sqrt(c * c - cx * cx - cy * cy)
    
    return {
      a: [ax, ay, az],
      b: [bx, by, bz],
      c: [cx, cy, cz]
    }
  }, [a, b, c, alpha, beta, gamma])
  
  const corners = useMemo(() => {
    const { a, b, c } = vectors
    const origin = [0, 0, 0]
    return [
      origin,
      a,
      b,
      c,
      [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
      [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
      [b[0] + c[0], b[1] + c[1], b[2] + c[2]],
      [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]
    ]
  }, [vectors])
  
  const edges = useMemo(() => {
    const edgeIndices = [
      [0, 1], [0, 2], [0, 3],
      [1, 4], [1, 5],
      [2, 4], [2, 6],
      [3, 5], [3, 6],
      [4, 7], [5, 7], [6, 7]
    ]
    
    return edgeIndices.map(([i, j]) => [corners[i], corners[j]])
  }, [corners])
  
  return (
    <group>
      {edges.map((edge, i) => (
        <Bond key={i} start={edge[0]} end={edge[1]} color="#4ade80" />
      ))}
    </group>
  )
}

function LatticePoints({ cellParams, extent = 2 }) {
  const { a, b, c, alpha, beta, gamma } = cellParams
  
  const vectors = useMemo(() => {
    const alphaRad = (alpha * Math.PI) / 180
    const betaRad = (beta * Math.PI) / 180
    const gammaRad = (gamma * Math.PI) / 180
    
    const ax = a
    const ay = 0
    const az = 0
    
    const bx = b * Math.cos(gammaRad)
    const by = b * Math.sin(gammaRad)
    const bz = 0
    
    const cx = c * Math.cos(betaRad)
    const cy = c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad)
    const cz = Math.sqrt(c * c - cx * cx - cy * cy)
    
    return { a: [ax, ay, az], b: [bx, by, bz], c: [cx, cy, cz] }
  }, [a, b, c, alpha, beta, gamma])
  
  const points = useMemo(() => {
    const pts = []
    for (let i = -extent; i <= extent; i++) {
      for (let j = -extent; j <= extent; j++) {
        for (let k = -extent; k <= extent; k++) {
          pts.push([
            i * vectors.a[0] + j * vectors.b[0] + k * vectors.c[0],
            i * vectors.a[1] + j * vectors.b[1] + k * vectors.c[1],
            i * vectors.a[2] + j * vectors.b[2] + k * vectors.c[2]
          ])
        }
      }
    }
    return pts
  }, [vectors, extent])
  
  return (
    <group>
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  )
}

function CrystalStructure({ crystalData, onAtomClick, selectedAtoms, showBonds = true }) {
  const { atoms, bonds, cell } = crystalData
  
  const cartesianAtoms = useMemo(() => {
    const alphaRad = (cell.alpha * Math.PI) / 180
    const betaRad = (cell.beta * Math.PI) / 180
    const gammaRad = (cell.gamma * Math.PI) / 180
    
    const ax = cell.a
    const ay = 0
    const az = 0
    
    const bx = cell.b * Math.cos(gammaRad)
    const by = cell.b * Math.sin(gammaRad)
    const bz = 0
    
    const cx = cell.c * Math.cos(betaRad)
    const cy = cell.c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad)
    const cz = Math.sqrt(cell.c * cell.c - cx * cx - cy * cy)
    
    return atoms.map(atom => ({
      ...atom,
      position: [
        atom.fract_x * ax + atom.fract_y * bx + atom.fract_z * cx,
        atom.fract_x * ay + atom.fract_y * by + atom.fract_z * cy,
        atom.fract_x * az + atom.fract_y * bz + atom.fract_z * cz
      ]
    }))
  }, [atoms, cell])
  
  const bondPositions = useMemo(() => {
    return bonds.map(bond => ({
      start: cartesianAtoms[bond.atom1]?.position,
      end: cartesianAtoms[bond.atom2]?.position,
      length: bond.length
    })).filter(b => b.start && b.end)
  }, [bonds, cartesianAtoms])
  
  return (
    <group>
      {showBonds && bondPositions.map((bond, i) => (
        <Bond key={i} start={bond.start} end={bond.end} />
      ))}
      
      {cartesianAtoms.map((atom, i) => (
        <Atom
          key={i}
          position={atom.position}
          color={atom.color}
          radius={0.25}
          onClick={(e) => {
            e.stopPropagation()
            onAtomClick && onAtomClick(i, atom)
          }}
          isSelected={selectedAtoms?.includes(i)}
          occupancy={atom.occupancy || 1}
          isDisordered={atom.is_disordered || false}
        />
      ))}
    </group>
  )
}

function SymmetryAnimation({ operation, isPlaying }) {
  const groupRef = useRef()
  
  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current || !operation) return
    
    switch (operation.id) {
      case 'rotation_2':
        groupRef.current.rotation.z += delta * Math.PI
        break
      case 'rotation_3':
        groupRef.current.rotation.z += delta * (2 * Math.PI / 3)
        break
      case 'rotation_4':
        groupRef.current.rotation.z += delta * (Math.PI / 2)
        break
      case 'rotation_6':
        groupRef.current.rotation.z += delta * (Math.PI / 3)
        break
      case 'mirror_xy':
      case 'mirror_xz':
      case 'mirror_yz':
        const scale = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5
        groupRef.current.scale.z = operation.id === 'mirror_xy' ? 1 - scale : 1
        groupRef.current.scale.y = operation.id === 'mirror_xz' ? 1 - scale : 1
        groupRef.current.scale.x = operation.id === 'mirror_yz' ? 1 - scale : 1
        break
      case 'inversion':
        const invScale = Math.sin(state.clock.elapsedTime * 2)
        groupRef.current.scale.setScalar(1 - invScale * 0.5)
        break
    }
  })
  
  return <group ref={groupRef} />
}

export default function CrystalScene({ 
  crystalData, 
  showCell = true, 
  showLattice = false,
  showBonds = true,
  onAtomClick,
  selectedAtoms,
  symmetryOperation,
  isSymmetryPlaying
}) {
  return (
    <Canvas dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />
      
      <group position={[-2, -2, -2]}>
        {showCell && crystalData && <UnitCell cellParams={crystalData.cell} />}
        {showLattice && crystalData && <LatticePoints cellParams={crystalData.cell} extent={1} />}
        {crystalData && (
          <CrystalStructure 
            crystalData={crystalData}
            onAtomClick={onAtomClick}
            selectedAtoms={selectedAtoms}
            showBonds={showBonds}
          />
        )}
        <SymmetryAnimation operation={symmetryOperation} isPlaying={isSymmetryPlaying} />
      </group>
      
      <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, -3, 0]} />
    </Canvas>
  )
}
