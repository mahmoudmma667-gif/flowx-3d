'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Grid, Html, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useInteractionStore } from '@/lib/store/interaction-store';
import * as THREE from 'three';

type ObjectRef = React.RefObject<THREE.Object3D | null>;

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
                <span className="text-sm font-mono">{progress.toFixed(0)}%</span>
            </div>
        </Html>
    );
}

function supportsWireframe(material: THREE.Material): material is THREE.Material & { wireframe: boolean } {
    return 'wireframe' in material;
}

function applyWireframe(object: THREE.Object3D, wireframe: boolean) {
    object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) {
            return;
        }

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
            if (supportsWireframe(material)) {
                material.wireframe = wireframe;
            }
        });
    });
}

function ensureMaterial(object: THREE.Object3D) {
    object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || mesh.material) {
            return;
        }

        mesh.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    });
}

function useSceneTransform(ref: ObjectRef, scaleMultiplier = 1) {
    const rotation = useInteractionStore((state) => state.rotation);
    const scale = useInteractionStore((state) => state.scale);

    useFrame(() => {
        const object = ref.current;
        if (!object) {
            return;
        }

        object.rotation.x = rotation.x;
        object.rotation.y = rotation.y;
        object.scale.setScalar(scale * scaleMultiplier);
    });
}

async function loadObject3D(url: string, format: 'fbx' | 'obj' | 'dae') {
    const threeStdlib = await import('three-stdlib');

    return new Promise<THREE.Object3D>((resolve, reject) => {
        const loader =
            format === 'fbx'
                ? new threeStdlib.FBXLoader()
                : format === 'obj'
                    ? new threeStdlib.OBJLoader()
                    : new threeStdlib.ColladaLoader();

        loader.load(
            url,
            (result) => {
                if (format === 'dae') {
                    resolve((result as { scene: THREE.Object3D }).scene);
                    return;
                }

                resolve(result as THREE.Object3D);
            },
            undefined,
            (error) => reject(error)
        );
    });
}

async function loadGeometry(url: string, format: 'stl' | 'ply') {
    const threeStdlib = await import('three-stdlib');

    return new Promise<THREE.BufferGeometry>((resolve, reject) => {
        const loader = format === 'stl' ? new threeStdlib.STLLoader() : new threeStdlib.PLYLoader();

        loader.load(
            url,
            (geometry) => {
                geometry.computeVertexNormals();
                resolve(geometry);
            },
            undefined,
            (error) => reject(error)
        );
    });
}

function ObjectModel({
    url,
    format,
    scaleMultiplier = 1,
    prepareObject,
}: {
    url: string;
    format: 'fbx' | 'obj' | 'dae';
    scaleMultiplier?: number;
    prepareObject?: (object: THREE.Object3D) => void;
}) {
    const [object, setObject] = useState<THREE.Object3D | null>(null);
    const [error, setError] = useState<string | null>(null);
    const objectRef = useRef<THREE.Object3D | null>(null);
    const wireframe = useInteractionStore((state) => state.wireframe);

    useSceneTransform(objectRef, scaleMultiplier);

    useEffect(() => {
        let active = true;

        loadObject3D(url, format)
            .then((loadedObject) => {
                if (!active) {
                    return;
                }

                prepareObject?.(loadedObject);
                setObject(loadedObject);
            })
            .catch((loadError) => {
                if (!active) {
                    return;
                }

                setError(loadError instanceof Error ? loadError.message : `Failed to load ${format.toUpperCase()}`);
            });

        return () => {
            active = false;
        };
    }, [format, prepareObject, url]);

    useEffect(() => {
        if (object) {
            applyWireframe(object, wireframe);
        }
    }, [object, wireframe]);

    if (error) {
        return <Html center><div className="text-red-400 text-sm">Failed to load {format.toUpperCase()}: {error}</div></Html>;
    }

    if (!object) {
        return <Loader />;
    }

    return <primitive ref={objectRef} object={object} />;
}

function GeometryModel({
    url,
    format,
    color,
}: {
    url: string;
    format: 'stl' | 'ply';
    color: string;
}) {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const wireframe = useInteractionStore((state) => state.wireframe);

    useSceneTransform(meshRef, 1);

    useEffect(() => {
        let active = true;

        loadGeometry(url, format)
            .then((loadedGeometry) => {
                if (active) {
                    setGeometry(loadedGeometry);
                }
            })
            .catch((loadError) => {
                if (!active) {
                    return;
                }

                setError(loadError instanceof Error ? loadError.message : `Failed to load ${format.toUpperCase()}`);
            });

        return () => {
            active = false;
        };
    }, [format, url]);

    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    if (error) {
        return <Html center><div className="text-red-400 text-sm">Failed to load {format.toUpperCase()}: {error}</div></Html>;
    }

    if (!geometry) {
        return <Loader />;
    }

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial
                color={color}
                metalness={format === 'stl' ? 0.3 : 0.2}
                roughness={format === 'stl' ? 0.4 : 0.5}
                vertexColors={format === 'ply' && geometry.hasAttribute('color')}
                wireframe={wireframe}
            />
        </mesh>
    );
}

function GLTFModel({ url }: { url: string }) {
    const { scene, animations } = useGLTF(url);
    const objectRef = useRef<THREE.Object3D | null>(null);
    const wireframe = useInteractionStore((state) => state.wireframe);
    const animationPlaying = useInteractionStore((state) => state.animationPlaying);
    const animationSpeed = useInteractionStore((state) => state.animationSpeed);
    const selectedAnimation = useInteractionStore((state) => state.selectedAnimation);
    const setSelectedAnimation = useInteractionStore((state) => state.setSelectedAnimation);
    const setAvailableAnimations = useInteractionStore((state) => state.setAvailableAnimations);
    const { actions, names } = useAnimations(animations, objectRef);

    useSceneTransform(objectRef, 1);

    useEffect(() => {
        applyWireframe(scene, wireframe);
    }, [scene, wireframe]);

    useEffect(() => {
        setAvailableAnimations(names);
        if (names.length > 0 && selectedAnimation >= names.length) {
            setSelectedAnimation(0);
        }

        return () => {
            setAvailableAnimations([]);
        };
    }, [names, selectedAnimation, setAvailableAnimations, setSelectedAnimation]);

    useEffect(() => {
        const actionMap = Object.values(actions ?? {}).filter(
            (action): action is THREE.AnimationAction => Boolean(action)
        );

        actionMap.forEach((action) => action.stop());

        if (!animationPlaying || names.length === 0) {
            return;
        }

        const activeName = names[selectedAnimation] ?? names[0];
        const activeAction = actions?.[activeName];
        if (!activeAction) {
            return;
        }

        activeAction.reset().setEffectiveTimeScale(animationSpeed).fadeIn(0.2).play();

        return () => {
            activeAction.fadeOut(0.2);
            activeAction.stop();
        };
    }, [actions, animationPlaying, animationSpeed, names, selectedAnimation]);

    return <primitive ref={objectRef} object={scene} />;
}

function UnsupportedModel({ format }: { format: string }) {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <AlertTriangle className="w-8 h-8 text-yellow-300" />
                </div>
                <p className="text-white font-bold">Unsupported Preview</p>
                <p className="text-gray-400 text-sm">
                    The <span className="text-brand-cyan font-mono">.{format}</span> format cannot be previewed in the browser. You can still download this file.
                </p>
            </div>
        </Html>
    );
}

function SmartModel({ url, format }: { url: string; format: string }) {
    switch (format.toLowerCase()) {
        case 'glb':
        case 'gltf':
            return <GLTFModel url={url} />;
        case 'fbx':
            return <ObjectModel url={url} format="fbx" scaleMultiplier={0.01} />;
        case 'obj':
            return <ObjectModel url={url} format="obj" prepareObject={ensureMaterial} />;
        case 'stl':
            return <GeometryModel url={url} format="stl" color="#00f0ff" />;
        case 'ply':
            return <GeometryModel url={url} format="ply" color="#bd00ff" />;
        case 'dae':
            return <ObjectModel url={url} format="dae" />;
        default:
            return <UnsupportedModel format={format} />;
    }
}

function SceneGrid() {
    const showGrid = useInteractionStore((state) => state.showGrid);

    if (!showGrid) {
        return null;
    }

    return (
        <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#1a1f2e"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#00f0ff"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
            position={[0, -1, 0]}
        />
    );
}

interface ModelViewerProps {
    modelUrl: string;
    format?: string;
    autoRotate?: boolean;
}

export function ModelViewer({ modelUrl, format = 'glb', autoRotate = false }: ModelViewerProps) {
    const environment = useInteractionStore((state) => state.environment);
    const lightIntensity = useInteractionStore((state) => state.lightIntensity);

    return (
        <div className="w-full h-full relative bg-brand-dark/50">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)] opacity-20 pointer-events-none" />

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
                <Suspense fallback={<Loader />}>
                    {/* <Environment preset={environment} /> */}
                    <ambientLight intensity={lightIntensity * 0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={lightIntensity} castShadow />
                    <directionalLight position={[-5, -5, -5]} intensity={lightIntensity * 0.3} />

                    <SmartModel url={modelUrl} format={format} />
                    <SceneGrid />
                </Suspense>
                <OrbitControls
                    autoRotate={autoRotate}
                    makeDefault
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>

            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-brand-cyan/10 text-brand-cyan text-[10px] font-bold tracking-widest border border-brand-cyan/20 uppercase backdrop-blur-md">
                    {format} viewer
                </span>
            </div>
        </div>
    );
}
