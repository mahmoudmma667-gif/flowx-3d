'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Html, OrbitControls, Stars, useProgress } from '@react-three/drei';
import { Monitor, Hand, RotateCw, X } from 'lucide-react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { CameraView } from '@/components/vision/camera-view';
import { UploadDropzone } from '@/components/upload/upload-dropzone';
import { Button } from '@/components/ui/button';
import { useInteractionStore } from '@/lib/store/interaction-store';
import { PREVIEWABLE_MODEL_DROPZONE_ACCEPT, type UploadSuccessResponse } from '@/lib/upload-config';

const PARTICLE_COUNT = 200;

function seededNoise(seed: number) {
    const value = Math.sin(seed * 12.9898) * 43758.5453123;
    return value - Math.floor(value);
}

function createParticlePositions(count: number) {
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
        positions[index * 3] = (seededNoise(index * 3 + 1) - 0.5) * 30;
        positions[index * 3 + 1] = (seededNoise(index * 3 + 2) - 0.5) * 30;
        positions[index * 3 + 2] = (seededNoise(index * 3 + 3) - 0.5) * 30;
    }

    return positions;
}

const PARTICLE_POSITIONS = createParticlePositions(PARTICLE_COUNT);

function InteractiveCube() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { rotation, scale, gesture, isHandDetected } = useInteractionStore();

    useFrame(() => {
        if (!meshRef.current) {
            return;
        }

        if (isHandDetected && gesture === 'GRAB') {
            meshRef.current.rotation.x = rotation.x;
            meshRef.current.rotation.y = rotation.y;
        } else if (!isHandDetected) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x += 0.002;
        }

        meshRef.current.scale.setScalar(scale);
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <mesh ref={meshRef} castShadow receiveShadow>
                <torusKnotGeometry args={[1, 0.35, 128, 32]} />
                <meshStandardMaterial
                    color="#00f0ff"
                    roughness={0.15}
                    metalness={0.9}
                    emissive="#00f0ff"
                    emissiveIntensity={0.15}
                />
            </mesh>
        </Float>
    );
}

function ParticleField() {
    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[PARTICLE_POSITIONS, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#bd00ff" transparent opacity={0.6} sizeAttenuation />
        </points>
    );
}

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono">{progress.toFixed(0)}%</span>
            </div>
        </Html>
    );
}

function GestureModel({ url, format }: { url: string; format: string }) {
    const meshRef = useRef<THREE.Object3D | null>(null);
    const { rotation, scale, gesture, isHandDetected } = useInteractionStore();
    const [scene, setScene] = useState<THREE.Object3D | null>(null);

    useEffect(() => {
        let active = true;

        const loadModel = async () => {
            try {
                const threeStdlib = await import('three-stdlib');

                if (format === 'glb' || format === 'gltf') {
                    new threeStdlib.GLTFLoader().load(url, (result) => {
                        if (active) {
                            setScene(result.scene);
                        }
                    });
                    return;
                }

                if (format === 'fbx') {
                    new threeStdlib.FBXLoader().load(url, (result) => {
                        if (active) {
                            setScene(result);
                        }
                    });
                    return;
                }

                if (format === 'obj') {
                    new threeStdlib.OBJLoader().load(url, (result) => {
                        if (!active) {
                            return;
                        }

                        result.traverse((child) => {
                            const mesh = child as THREE.Mesh;
                            if (mesh.isMesh && !mesh.material) {
                                mesh.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                            }
                        });

                        setScene(result);
                    });
                    return;
                }

                if (format === 'stl' || format === 'ply') {
                    const loader = format === 'stl' ? new threeStdlib.STLLoader() : new threeStdlib.PLYLoader();
                    loader.load(url, (geometry) => {
                        if (!active) {
                            return;
                        }

                        geometry.computeVertexNormals();
                        const material = new THREE.MeshStandardMaterial({
                            color: format === 'stl' ? '#00f0ff' : '#bd00ff',
                            metalness: 0.25,
                            roughness: 0.45,
                            vertexColors: format === 'ply' && geometry.hasAttribute('color'),
                        });
                        setScene(new THREE.Mesh(geometry, material));
                    });
                    return;
                }

                if (format === 'dae') {
                    new threeStdlib.ColladaLoader().load(url, (result) => {
                        if (active) {
                            setScene(result.scene);
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to load model in workspace:', error);
            }
        };

        void loadModel();

        return () => {
            active = false;
        };
    }, [format, url]);

    useFrame(() => {
        if (!meshRef.current) {
            return;
        }

        if (isHandDetected && gesture === 'GRAB') {
            meshRef.current.rotation.x = rotation.x;
            meshRef.current.rotation.y = rotation.y;
        } else if (!isHandDetected) {
            meshRef.current.rotation.y += 0.005;
        }

        meshRef.current.scale.setScalar(scale * (format === 'fbx' ? 0.01 : 1));
    });

    if (!scene) {
        return null;
    }

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <primitive ref={meshRef} object={scene} />
        </Float>
    );
}

export default function StudioPage() {
    const { gesture, isHandDetected } = useInteractionStore();
    const [showGuide, setShowGuide] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [customModel, setCustomModel] = useState<{ url: string; format: string } | null>(null);

    const handleUploadSuccess = (result: UploadSuccessResponse) => {
        if (result.type !== '3d') {
            return;
        }

        setCustomModel({
            url: result.data.url,
            format: result.data.format,
        });
        setShowUpload(false);
    };

    return (
        <main className="h-screen w-screen bg-brand-dark overflow-hidden flex flex-col">
            <Navbar />

            <div className="md:hidden flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 animate-pulse">
                    <Monitor className="w-8 h-8 text-brand-cyan" />
                </div>
                <h2 className="text-2xl font-bold font-space text-white">Desktop Experience</h2>
                <p className="text-gray-400 max-w-sm">
                    This interactive 3D studio needs a desktop-size viewport for stable camera input and scene controls.
                </p>
                <div className="pt-4">
                    <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
                        Return Home
                    </Button>
                </div>
            </div>

            <div className="hidden md:block flex-1 relative h-full">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
                    <Suspense fallback={<Loader />}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f0ff" castShadow />
                        <pointLight position={[-10, -5, -10]} intensity={1} color="#bd00ff" />

                        {customModel ? (
                            <GestureModel url={customModel.url} format={customModel.format} />
                        ) : (
                            <InteractiveCube />
                        )}

                        <ParticleField />
                        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
                        <OrbitControls enableZoom enablePan={false} maxDistance={15} minDistance={2} makeDefault />
                        {/* Environment preset="night" removed to fix offline/network crashes */}
                    </Suspense>
                </Canvas>

                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-30" />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-24 left-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold font-space text-white mb-2 drop-shadow-lg">
                        Studio <span className="text-brand-cyan">Experience</span>
                    </h1>
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-400 text-xs max-w-xs backdrop-blur-sm bg-black/20 p-2 rounded-lg">
                            Control the object with your hands. Grab to rotate, pinch to scale.
                        </p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="bg-brand-purple/20 hover:bg-brand-purple/40 text-brand-purple border border-brand-purple/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 w-fit pointer-events-auto"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {customModel ? 'Change Model' : 'Load Your Model'}
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showUpload && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-xl relative"
                            >
                                <button
                                    onClick={() => setShowUpload(false)}
                                    className="absolute -top-12 right-0 text-white/60 hover:text-white flex items-center gap-2 text-sm"
                                >
                                    Close <X className="w-4 h-4" />
                                </button>
                                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                                    <h2 className="text-2xl font-bold text-white mb-6 font-space text-center">Load Custom Asset</h2>
                                    <UploadDropzone
                                        isDemo
                                        availableTabs={['3d']}
                                        modelAccept={PREVIEWABLE_MODEL_DROPZONE_ACCEPT}
                                        onUploadSuccess={handleUploadSuccess}
                                    />
                                    <p className="text-[10px] text-gray-500 text-center mt-6 uppercase tracking-widest">
                                        Asset uploads are saved locally and appear in your workspace library.
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-24 right-8"
                >
                    <div className="glass-panel rounded-2xl p-4 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2 h-2 rounded-full ${isHandDetected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Status</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Hand</span>
                                <span className={isHandDetected ? 'text-green-400' : 'text-gray-600'}>
                                    {isHandDetected ? 'DETECTED' : 'SEARCHING'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Gesture</span>
                                <span className={gesture !== 'IDLE' ? 'text-brand-cyan' : 'text-gray-600'}>
                                    {gesture}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-28 left-1/2 -translate-x-1/2"
                    >
                        <div className="glass-panel rounded-2xl p-4 flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                                    <Hand className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Grab to Rotate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                                    <RotateCw className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Automatic Rotation</span>
                            </div>
                            <button onClick={() => setShowGuide(false)} className="text-gray-600 hover:text-white ml-2">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <CameraView />
                </div>
            </div>
        </main>
    );
}
