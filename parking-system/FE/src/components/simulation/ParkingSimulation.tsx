import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

import ParkingFloor3D from './ParkingFloor3D';

interface ParkingSimulationProps {
  selectedLevel: number;
}

const ParkingSimulation: React.FC<ParkingSimulationProps> = ({ selectedLevel }) => {
  return (
    <div className="w-full h-full min-h-[750px] relative rounded-[4rem] overflow-hidden bg-[#020617] shadow-2xl border border-white/5">
      <Canvas shadows gl={{ antialias: false, powerPreference: "high-performance" }}>
        <color attach="background" args={['#000000']} />
        
        <Suspense fallback={null}>
          <SoftShadows size={25} samples={16} focus={0.5} />
          
          <PerspectiveCamera makeDefault position={[35, 30, 35]} fov={30} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={20}
            maxDistance={80}
            makeDefault
          />

          {/* Luxury High-Contrast Lighting */}
          <ambientLight intensity={0.1} />
          <directionalLight 
            position={[50, 50, 50]} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[4096, 4096]}
          />
          
          <spotLight position={[-20, 30, 10]} angle={0.3} penumbra={1} intensity={1000} color="#00f2ff" castShadow />
          <spotLight position={[20, 30, -10]} angle={0.3} penumbra={1} intensity={1000} color="#8b5cf6" castShadow />

          {/* 3D Scene */}
          <ParkingFloor3D level={selectedLevel} />

          {/* Post Processing - The secret to "Wow" */}
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
          </EffectComposer>

          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {/* Futuristic HUD Overlay */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="absolute top-14 left-14 pointer-events-none z-10"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center backdrop-blur-3xl bg-cyan-500/5">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                   className="w-14 h-14 rounded-full border border-cyan-500/50 flex items-center justify-center"
                >
                   <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                </motion.div>
                <span className="material-symbols-outlined absolute text-cyan-400 text-[32px]">dataset</span>
              </div>
            </div>
            <div className="flex flex-col">
              <motion.h3 
                initial={{ letterSpacing: "0.5em" }}
                animate={{ letterSpacing: "-0.05em" }}
                transition={{ duration: 1 }}
                className="text-white font-display font-black text-3xl leading-none"
              >
                PARK<span className="text-cyan-400">INTEL</span>
              </motion.h3>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
                Quantum Digital Twin v2.0
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-14 left-14 pointer-events-none z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-white/10 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            ></motion.div>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">System Online</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium font-mono tracking-tighter">NODE_ID: PX-99 • LAT: 10.76 • LNG: 106.66</p>
        </div>
      </motion.div>

      {/* Right Stats Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-14 right-14 pointer-events-none z-10"
      >
        <div className="flex flex-col gap-4">
          {[
            { label: 'Occupancy', value: '74%', color: 'text-cyan-400' },
            { label: 'Energy Usage', value: '1.2kW', color: 'text-white' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/5 w-48 shadow-2xl">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color} font-mono italic`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ParkingSimulation;
