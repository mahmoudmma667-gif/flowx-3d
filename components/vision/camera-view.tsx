'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarkerService } from '@/lib/vision/hand-landmarker';
import { useInteractionStore } from '@/lib/store/interaction-store';
import { recognizeGesture } from '@/lib/gestures/recognizer';
import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";

export function CameraView() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>(0);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const isActiveRef = useRef(true);

    const {
        setHandDetected,
        setGesture,
        setHandPosition,
        updateRotation,
        updateScale,
        gesture,
    } = useInteractionStore();

    // Previous positions for delta calculation
    const prevHandPos = useRef<{ x: number, y: number } | null>(null);
    const prevPinchDistance = useRef<number | null>(null);
    const predictWebcamRef = useRef<() => void>(() => {});

    useEffect(() => {
        predictWebcamRef.current = () => {
        if (!isActiveRef.current || !landmarkerRef.current || !videoRef.current || !canvasRef.current) {
            return;
        }

        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            requestRef.current = requestAnimationFrame(() => predictWebcamRef.current());
            return;
        }

        if (video.currentTime === lastVideoTimeRef.current) {
            requestRef.current = requestAnimationFrame(() => predictWebcamRef.current());
            return;
        }
        lastVideoTimeRef.current = video.currentTime;

        const canvas = canvasRef.current;
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            requestRef.current = requestAnimationFrame(() => predictWebcamRef.current());
            return;
        }

        if (!drawingUtilsRef.current) {
            drawingUtilsRef.current = new DrawingUtils(ctx);
        }

        const results = landmarkerRef.current.detectForVideo(video, performance.now());

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true);
            const landmarks = results.landmarks[0];
            const drawingUtils = drawingUtilsRef.current;

            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00F0FF",
                lineWidth: 3
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: "#FFFFFF",
                lineWidth: 1,
                radius: 3
            });

            const detectedGesture = recognizeGesture(landmarks);
            setGesture(detectedGesture);

            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            setHandPosition({ x: indexTip.x, y: indexTip.y, z: indexTip.z ?? 0 });

            if (detectedGesture === 'GRAB' && prevHandPos.current) {
                const deltaX = indexTip.x - prevHandPos.current.x;
                const deltaY = indexTip.y - prevHandPos.current.y;
                updateRotation(deltaX * 500, deltaY * 500);
            }

            if (detectedGesture === 'PINCH') {
                const pinchDistance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

                if (prevPinchDistance.current !== null && prevPinchDistance.current > 0) {
                    updateScale(pinchDistance / prevPinchDistance.current);
                }

                prevPinchDistance.current = pinchDistance;
            } else {
                prevPinchDistance.current = null;
            }

            prevHandPos.current = { x: indexTip.x, y: indexTip.y };
        } else {
            setHandDetected(false);
            setGesture('IDLE');
            prevHandPos.current = null;
            prevPinchDistance.current = null;
        }

        ctx.restore();
        requestRef.current = requestAnimationFrame(() => predictWebcamRef.current());
        };
    }, [setGesture, setHandDetected, setHandPosition, updateRotation, updateScale]);

    useEffect(() => {
        isActiveRef.current = true;
        let stream: MediaStream | null = null;
        const videoElement = videoRef.current;

        const init = async () => {
            try {
                const landmarker = await HandLandmarkerService.getInstance();
                if (!isActiveRef.current) {
                    return;
                }
                landmarkerRef.current = landmarker;

                // Start Webcam
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user'
                    }
                });

                if (videoElement) {
                    const startPredictionLoop = () => predictWebcamRef.current();
                    videoElement.srcObject = stream;
                    videoElement.addEventListener("loadeddata", startPredictionLoop);
                    (videoElement as HTMLVideoElement & { __flowxListener?: () => void }).__flowxListener = startPredictionLoop;
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Camera access denied or not available");
                setLoading(false);
            }
        };

        init();

        return () => {
            isActiveRef.current = false;
            cancelAnimationFrame(requestRef.current);

            if (videoElement) {
                const listener = (videoElement as HTMLVideoElement & { __flowxListener?: () => void }).__flowxListener;
                if (listener) {
                    videoElement.removeEventListener("loadeddata", listener);
                }
            }

            const activeStream = stream ?? (videoElement?.srcObject as MediaStream | null);
            if (activeStream) {
                const tracks = activeStream.getTracks();
                tracks.forEach(track => track.stop());
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, []);

    return (
        <div className="relative w-48 h-36 rounded-xl overflow-hidden border-2 border-brand-cyan/50 bg-black/50 backdrop-blur-sm shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            {loading && <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-cyan animate-pulse">Initializing AI...</div>}
            {error && <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 p-2 text-center">{error}</div>}

            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-50 -scale-x-100"
                autoPlay
                playsInline
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full -scale-x-100"
            />

            {/* Status Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <div className={`w-2 h-2 rounded-full ${!error && !loading ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] uppercase font-mono text-white/80 bg-black/50 px-2 rounded">
                    {gesture}
                </span>
            </div>
        </div>
    );
}
