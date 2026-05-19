import React, { useState, useRef, useMemo } from 'react';
import { Text, Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ParkingSlot3DProps {
  position: [number, number, number];
  id: string;
  status: 'available' | 'occupied' | 'reserved';
  isPremium?: boolean;
}

// Concept Luxury Car - High Detail Procedural
const ConceptCar = ({ status, hovered }: { status: string, hovered: boolean }) => {
  const group = useRef<THREE.Group>(null);
  
  const accentColor = useMemo(() => {
    if (status === 'occupied') return new THREE.Color('#00f2ff');
    if (status === 'reserved') return new THREE.Color('#8b5cf6');
    return new THREE.Color('#10b981');
  }, [status]);

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={group} scale={0.75} position={[0, 0.45, 0]}>
        {/* Aerodynamic Chassis */}
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.3, 3.8]} />
          <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
        </mesh>
        
        {/* Tapered Cabin */}
        <mesh position={[0, 0.35, -0.2]} castShadow>
          <boxGeometry args={[1.4, 0.4, 2.2]} />
          <meshStandardMaterial color="#0f172a" metalness={1} roughness={0} transparent opacity={0.9} />
        </mesh>

        {/* Headlight Bars - Ultra Bright for Bloom */}
        <group position={[0, 0.1, 1.91]}>
          <mesh position={[0.6, 0, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.05]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
          <mesh position={[-0.6, 0, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.05]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
        </group>

        {/* Tail Light Strip */}
        <mesh position={[0, 0.2, -1.91]}>
          <boxGeometry args={[1.6, 0.02, 0.05]} />
          <meshBasicMaterial color="#ff0055" toneMapped={false} />
        </mesh>

        {/* Hidden Wheels with Underglow */}
        {[[-0.9, -0.2, 1.2], [0.9, -0.2, 1.2], [-0.9, -0.2, -1.2], [0.9, -0.2, -1.2]].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.2, 32]} />
              <meshStandardMaterial color="#000000" roughness={1} />
            </mesh>
          </group>
        ))}

        {/* Dynamic Underglow Light */}
        <pointLight position={[0, -0.5, 0]} color={accentColor} intensity={hovered ? 20 : 10} distance={5} />
      </group>
    </Float>
  );
};

const ParkingSlot3D: React.FC<ParkingSlot3DProps> = ({ position, id, status, isPremium }) => {
  const [hovered, setHovered] = useState(false);

  const colors = {
    available: { main: '#10b981', glow: '#34d399' },
    occupied: { main: '#00f2ff', glow: '#67e8f9' },
    reserved: { main: '#8b5cf6', glow: '#c4b5fd' },
  };

  const theme = colors[status];

  return (
    <group position={position}>
      {/* Holographic Base Plate */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        position={[0, 0.01, 0]}
      >
        <boxGeometry args={[3.2, 0.02, 5.2]} />
        <meshStandardMaterial 
          color={status === 'occupied' ? '#0f172a' : '#ffffff'} 
          metalness={0.9} 
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Cyber Borders - Glowing Strips */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[1.58, 0, 0]}>
          <boxGeometry args={[0.04, 0.02, 5.2]} />
          <meshBasicMaterial color={theme.glow} toneMapped={false} transparent opacity={hovered ? 1 : 0.4} />
        </mesh>
        <mesh position={[-1.58, 0, 0]}>
          <boxGeometry args={[0.04, 0.02, 5.2]} />
          <meshBasicMaterial color={theme.glow} toneMapped={false} transparent opacity={hovered ? 1 : 0.4} />
        </mesh>
      </group>

      {/* ID Label - Minimal Tech Font */}
      <Billboard position={[0, 2.8, 0]}>
        <Text
          fontSize={0.5}
          color={hovered ? theme.glow : '#94a3b8'}
          fontWeight={900}
          letterSpacing={0.2}
        >
          {id}
        </Text>
      </Billboard>

      {/* Car Rendering */}
      {status === 'occupied' && <ConceptCar status={status} hovered={hovered} />}

      {/* Smart Node Indicator */}
      <group position={[0, 0, 2.4]}>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={theme.main} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.6, 0]} color={theme.main} intensity={hovered ? 5 : 2} distance={3} />
      </group>

      {/* Premium Marker */}
      {isPremium && (
        <mesh position={[0, 0.03, -2.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.2]} />
          <meshBasicMaterial color="#f59e0b" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

export default ParkingSlot3D;
