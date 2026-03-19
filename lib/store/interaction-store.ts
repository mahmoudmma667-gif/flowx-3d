import { create } from 'zustand';

export type Environment = 'city' | 'sunset' | 'dawn' | 'night' | 'studio' | 'park' | 'apartment' | 'forest' | 'lobby' | 'warehouse';
export type Gesture = 'IDLE' | 'GRAB' | 'PINCH' | 'OPEN';

const POSITION_EPSILON = 0.002;
const ROTATION_EPSILON = 0.0001;
const SCALE_EPSILON = 0.0001;

interface InteractionState {
    isHandDetected: boolean;
    gesture: Gesture;
    handPosition: { x: number; y: number; z: number };

    // 3D Object Properties
    rotation: { x: number; y: number };
    scale: number;

    // Scene Properties
    environment: Environment;
    wireframe: boolean;
    showGrid: boolean;
    lightIntensity: number;

    // Animation
    animationPlaying: boolean;
    animationSpeed: number;
    selectedAnimation: number;
    availableAnimations: string[];

    // Actions
    setHandDetected: (detected: boolean) => void;
    setGesture: (gesture: Gesture) => void;
    setHandPosition: (pos: { x: number; y: number; z: number }) => void;
    updateRotation: (deltaX: number, deltaY: number) => void;
    updateScale: (factor: number) => void;
    resetTransform: () => void;

    setEnvironment: (env: Environment) => void;
    setWireframe: (enabled: boolean) => void;
    setShowGrid: (enabled: boolean) => void;
    setLightIntensity: (intensity: number) => void;

    setAnimationPlaying: (playing: boolean) => void;
    setAnimationSpeed: (speed: number) => void;
    setSelectedAnimation: (index: number) => void;
    setAvailableAnimations: (animations: string[]) => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
    isHandDetected: false,
    gesture: 'IDLE',
    handPosition: { x: 0, y: 0, z: 0 },

    rotation: { x: 0, y: 0 },
    scale: 1,

    environment: 'city',
    wireframe: false,
    showGrid: true,
    lightIntensity: 0.6,

    animationPlaying: true,
    animationSpeed: 1,
    selectedAnimation: 0,
    availableAnimations: [],

    setHandDetected: (detected) => set((state) => (
        state.isHandDetected === detected ? state : { isHandDetected: detected }
    )),
    setGesture: (gesture) => set((state) => (
        state.gesture === gesture ? state : { gesture }
    )),
    setHandPosition: (pos) => set((state) => {
        const { handPosition } = state;
        const isStable =
            Math.abs(handPosition.x - pos.x) < POSITION_EPSILON &&
            Math.abs(handPosition.y - pos.y) < POSITION_EPSILON &&
            Math.abs(handPosition.z - pos.z) < POSITION_EPSILON;

        return isStable ? state : { handPosition: pos };
    }),

    updateRotation: (deltaX, deltaY) => set((state) => {
        const nextRotation = {
            x: state.rotation.x + deltaY * 0.005,
            y: state.rotation.y + deltaX * 0.005,
        };

        const unchanged =
            Math.abs(nextRotation.x - state.rotation.x) < ROTATION_EPSILON &&
            Math.abs(nextRotation.y - state.rotation.y) < ROTATION_EPSILON;

        return unchanged ? state : { rotation: nextRotation };
    }),

    updateScale: (factor) => set((state) => {
        const nextScale = Math.max(0.5, Math.min(3, state.scale * factor));
        return Math.abs(nextScale - state.scale) < SCALE_EPSILON ? state : { scale: nextScale };
    }),

    resetTransform: () => set({ rotation: { x: 0, y: 0 }, scale: 1 }),

    setEnvironment: (environment) => set({ environment }),
    setWireframe: (wireframe) => set({ wireframe }),
    setShowGrid: (showGrid) => set({ showGrid }),
    setLightIntensity: (lightIntensity) => set({ lightIntensity: Math.max(0, Math.min(2, lightIntensity)) }),

    setAnimationPlaying: (animationPlaying) => set({ animationPlaying }),
    setAnimationSpeed: (animationSpeed) => set({ animationSpeed: Math.max(0.1, Math.min(3, animationSpeed)) }),
    setSelectedAnimation: (selectedAnimation) => set((state) => (
        state.selectedAnimation === selectedAnimation ? state : { selectedAnimation }
    )),
    setAvailableAnimations: (availableAnimations) => set((state) => {
        const unchanged =
            state.availableAnimations.length === availableAnimations.length &&
            state.availableAnimations.every((animation, index) => animation === availableAnimations[index]);

        return unchanged ? state : { availableAnimations };
    }),
}));
