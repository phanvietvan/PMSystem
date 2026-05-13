import React from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import ParkingSlot3D from './ParkingSlot3D';

interface ParkingFloor3DProps {
  level: number;
}

const ParkingFloor3D: React.FC<ParkingFloor3DProps> = ({ level }) => {
  const generateSlots = () => {
    const slots = [];
    const rows = 2; 
    const slotsPerRow = 8;
    const spacingX = 4.5;
    const roadWidth = 11;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < slotsPerRow; c++) {
        const id = `${r === 0 ? 'A' : 'B'}${c + 1}`;
        const seed = (level * 100) + (r * 10) + c;
        const pseudoRandom = (Math.sin(seed) + 1) / 2;
        const status = pseudoRandom > 0.6 ? 'occupied' : pseudoRandom > 0.4 ? 'reserved' : 'available';
        
        slots.push({
          id,
          position: [
            (c - (slotsPerRow - 1) / 2) * spacingX,
            0,
            r === 0 ? -roadWidth / 2 - 2.8 : roadWidth / 2 + 2.8
          ] as [number, number, number],
          status,
          isPremium: c < 2
        });
      }
    }
    return slots;
  };

  const slots = generateSlots();

  return (
    <group>
      {/* Luxury Reflective Floor - The secret to "Premium" */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
        />
      </mesh>

      {/* Cyber Road with glowing lane lines */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[70, 10]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
        
        <group position={[0, 0.01, 0]}>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[70, 0.05]} />
            <meshBasicMaterial color="#00f2ff" toneMapped={false} transparent opacity={0.3} />
          </mesh>
          {/* Animated looking dashes */}
          {[-30, -20, -10, 0, 10, 20, 30].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2, 0.2]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.1} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Decorative Cyber Structures */}
      {[[-35, 0, 0], [35, 0, 0]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[0.5, 4, 15]} />
            <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.2} />
          </mesh>
          <pointLight position={[0, 4, 0]} color="#00f2ff" intensity={50} distance={20} />
        </group>
      ))}

      {/* Parking Slots Grid */}
      {slots.map((slot) => (
        <ParkingSlot3D
          key={slot.id}
          id={slot.id}
          position={slot.position}
          status={slot.status as any}
          isPremium={slot.isPremium}
        />
      ))}
    </group>
  );
};

export default ParkingFloor3D;
