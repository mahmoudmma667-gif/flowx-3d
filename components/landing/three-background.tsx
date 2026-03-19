'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Stars, Icosahedron, Torus, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

function InteractiveShape({
    position,
    color,
    speed,
    ShapeComponent,
    scale = 1,
    factor = 1
}: {
    position: [number, number, number],
    color: string,
    speed: number,
    ShapeComponent: React.ComponentType<{ children?: React.ReactNode }>,
    scale?: number,
    factor?: number
}) {
    const groupRef = useRef<THREE.Group>(null);
    const initialPos = useRef(new THREE.Vector3(...position));
    const { viewport, mouse } = useThree();

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * speed * 0.2;
            groupRef.current.rotation.y += delta * speed * 0.1;

            const targetX = initialPos.current.x + (mouse.x * viewport.width / 2) * 0.15 * factor;
            const targetY = initialPos.current.y + (mouse.y * viewport.height / 2) * 0.15 * factor;

            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.03);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.03);
        }
    });

    return (
        <Float speed={1.5 * speed} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
                <ShapeComponent>
                    <meshStandardMaterial
                        color={color}
                        roughness={0.2}
                        metalness={0.9}
                        emissive={color}
                        emissiveIntensity={0.4}
                        transparent
                        opacity={0.6}
                    />
                </ShapeComponent>
            </group>
        </Float>
    );
}

export function ThreeBackground() {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="absolute inset-0 z-0 h-full w-full bg-brand-dark" />;
    }

    return (
        <div className="absolute inset-0 z-0 h-full w-full">
            <Canvas
                key="hero-background-canvas"
                camera={{ position: [0, 0, 15], fov: 45 }}
                dpr={[1, 2]}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#bd00ff" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <group>
                    <InteractiveShape ShapeComponent={Icosahedron} position={[-4, 2, -5]} color="#00f0ff" speed={0.5} scale={1.8} factor={1.2} />
                    <InteractiveShape ShapeComponent={Torus} position={[5, -3, -4]} color="#bd00ff" speed={0.4} scale={1.2} factor={1.5} />
                    <InteractiveShape ShapeComponent={Octahedron} position={[-3, -4, -8]} color="#00f0ff" speed={0.3} scale={2.0} factor={0.8} />
                    <InteractiveShape ShapeComponent={Icosahedron} position={[4, 4, -8]} color="#bd00ff" speed={0.6} scale={1.5} factor={1.1} />
                    <InteractiveShape ShapeComponent={Torus} position={[0, 5, -12]} color="#ffffff" speed={0.2} scale={0.8} factor={0.5} />
                    <InteractiveShape ShapeComponent={Octahedron} position={[-6, 0, -15]} color="#bd00ff" speed={0.1} scale={3.0} factor={0.3} />
                    <InteractiveShape ShapeComponent={Icosahedron} position={[6, -2, -15]} color="#00f0ff" speed={0.15} scale={2.5} factor={0.3} />
                </group>

                {/* Environment removed to bypass network fetch errors */}
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/10 via-brand-dark/30 to-brand-dark/80 pointer-events-none" />
        </div>
    );
}
