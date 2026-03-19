'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import { analyzeGesture, type GestureType } from '@/lib/gestures/recognizer';
import { HandLandmarkerService } from '@/lib/vision/hand-landmarker';
import { cn } from '@/lib/utils';

export interface AirSketchCameraFrame {
    handDetected: boolean;
    gesture: GestureType;
    pinchStrength: number;
    pinchDistance: number;
    point: { x: number; y: number; z: number } | null;
}

interface AirSketchCameraProps {
    className?: string;
    overlayPoints?: Array<{ x: number; y: number }>;
    recording?: boolean;
    strokeColor?: string;
    onTracking?: (frame: AirSketchCameraFrame) => void;
}

export function AirSketchCamera({
    className,
    overlayPoints = [],
    recording = false,
    strokeColor = '#00f0ff',
    onTracking,
}: AirSketchCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [telemetry, setTelemetry] = useState<AirSketchCameraFrame>({
        handDetected: false,
        gesture: 'IDLE',
        pinchStrength: 0,
        pinchDistance: 1,
        point: null,
    });
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>(0);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const lastInferenceTimeRef = useRef(0);
    const isActiveRef = useRef(true);
    const onTrackingRef = useRef(onTracking);
    const overlayPointsRef = useRef(overlayPoints);
    const recordingRef = useRef(recording);
    const strokeColorRef = useRef(strokeColor);

    useEffect(() => {
        onTrackingRef.current = onTracking;
        overlayPointsRef.current = overlayPoints;
        recordingRef.current = recording;
        strokeColorRef.current = strokeColor;
    }, [onTracking, overlayPoints, recording, strokeColor]);

    useEffect(() => {
        const drawOverlay = (
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,
        ) => {
            const points = overlayPointsRef.current;

            if (points.length > 1) {
                ctx.save();
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.strokeStyle = recordingRef.current ? strokeColorRef.current : '#bd7bff';
                ctx.shadowBlur = 0;
                ctx.lineWidth = recordingRef.current ? 5 : 3;
                ctx.beginPath();

                points.forEach((point, index) => {
                    const x = point.x * width;
                    const y = point.y * height;

                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });

                ctx.stroke();
                ctx.restore();
            }
        };

        const renderFrame = () => {
            if (!isActiveRef.current || !landmarkerRef.current || !videoRef.current || !canvasRef.current) {
                return;
            }

            const video = videoRef.current;

            if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
                requestRef.current = requestAnimationFrame(renderFrame);
                return;
            }

            if (video.currentTime === lastVideoTimeRef.current) {
                requestRef.current = requestAnimationFrame(renderFrame);
                return;
            }

            lastVideoTimeRef.current = video.currentTime;
            const now = performance.now();

            if (now - lastInferenceTimeRef.current < 16) {
                requestRef.current = requestAnimationFrame(renderFrame);
                return;
            }

            lastInferenceTimeRef.current = now;

            const canvas = canvasRef.current;
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

            if (!ctx) {
                requestRef.current = requestAnimationFrame(renderFrame);
                return;
            }

            if (!drawingUtilsRef.current) {
                drawingUtilsRef.current = new DrawingUtils(ctx);
            }

            const results = landmarkerRef.current.detectForVideo(video, now);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                const drawingUtils = drawingUtilsRef.current;
                const analysis = analyzeGesture(landmarks);
                const point = landmarks[8];

                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: recordingRef.current ? strokeColorRef.current : "#88A7C7",
                    lineWidth: recordingRef.current ? 3.5 : 2.5,
                });
                drawingUtils.drawLandmarks(landmarks, {
                    color: "#FFFFFF",
                    lineWidth: 1,
                    radius: 3,
                });

                drawOverlay(ctx, canvas.width, canvas.height);

                ctx.fillStyle = recordingRef.current ? strokeColorRef.current : '#bd7bff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, point.y * canvas.height, recordingRef.current ? 7 : 5, 0, Math.PI * 2);
                ctx.fill();

                const nextTelemetry: AirSketchCameraFrame = {
                    handDetected: true,
                    gesture: analysis.gesture,
                    pinchStrength: analysis.pinchStrength,
                    pinchDistance: analysis.pinchDistance,
                    point: {
                        x: point.x,
                        y: point.y,
                        z: point.z ?? 0,
                    },
                };

                setTelemetry((previous) => {
                    const unchanged =
                        previous.handDetected === nextTelemetry.handDetected &&
                        previous.gesture === nextTelemetry.gesture &&
                        Math.abs(previous.pinchStrength - nextTelemetry.pinchStrength) < 0.02 &&
                        Math.abs(previous.pinchDistance - nextTelemetry.pinchDistance) < 0.02 &&
                        previous.point !== null &&
                        Math.abs(previous.point.x - nextTelemetry.point!.x) < 0.01 &&
                        Math.abs(previous.point.y - nextTelemetry.point!.y) < 0.01 &&
                        Math.abs(previous.point.z - nextTelemetry.point!.z) < 0.01;

                    return unchanged ? previous : nextTelemetry;
                });

                onTrackingRef.current?.(nextTelemetry);
            } else {
                drawOverlay(ctx, canvas.width, canvas.height);

                const nextTelemetry: AirSketchCameraFrame = {
                    handDetected: false,
                    gesture: 'IDLE',
                    pinchStrength: 0,
                    pinchDistance: 1,
                    point: null,
                };

                setTelemetry((previous) => (
                    previous.handDetected || previous.gesture !== 'IDLE' ? nextTelemetry : previous
                ));

                onTrackingRef.current?.(nextTelemetry);
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(renderFrame);
        };

        isActiveRef.current = true;
        let stream: MediaStream | null = null;
        const videoElement = videoRef.current;
        let reconnectTimeout: number | null = null;

        const scheduleReconnect = () => {
            if (!isActiveRef.current || reconnectTimeout !== null) {
                return;
            }

            setError('Camera stream paused. Reconnecting...');
            reconnectTimeout = window.setTimeout(() => {
                reconnectTimeout = null;
                if (isActiveRef.current) {
                    void init();
                }
            }, 900);
        };

        const detachTrackListeners = (mediaStream: MediaStream | null) => {
            if (!mediaStream) {
                return;
            }

            mediaStream.getTracks().forEach((track) => {
                track.removeEventListener('ended', scheduleReconnect);
                track.removeEventListener('mute', scheduleReconnect);
            });
        };

        const init = async () => {
            try {
                const landmarker = await HandLandmarkerService.getInstance();
                if (!isActiveRef.current) return;
                landmarkerRef.current = landmarker;

                if (!stream || !stream.active) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: 640,
                            height: 480,
                            frameRate: { ideal: 24, max: 30 },
                            facingMode: 'user',
                        },
                    });

                    stream.getTracks().forEach((track) => {
                        track.addEventListener('ended', scheduleReconnect);
                        track.addEventListener('mute', scheduleReconnect);
                    });
                }

                if (videoElement) {
                    const previousListener = (videoElement as HTMLVideoElement & { __flowxListener?: () => void }).__flowxListener;
                    if (previousListener) {
                        videoElement.removeEventListener("loadeddata", previousListener);
                    }

                    const startLoop = () => renderFrame();
                    videoElement.srcObject = stream;
                    videoElement.addEventListener("loadeddata", startLoop);
                    (videoElement as HTMLVideoElement & { __flowxListener?: () => void }).__flowxListener = startLoop;
                    await videoElement.play().catch(() => undefined);
                }

                setError(null);
                setLoading(false);
            } catch (caughtError) {
                console.error(caughtError);
                setError("Camera access is unavailable. You can still use Sketch Pad mode.");
                setLoading(false);
            }
        };

        void init();

        return () => {
            isActiveRef.current = false;
            cancelAnimationFrame(requestRef.current);
            if (reconnectTimeout !== null) {
                window.clearTimeout(reconnectTimeout);
            }
            detachTrackListeners(stream);

            if (videoElement) {
                const listener = (videoElement as HTMLVideoElement & { __flowxListener?: () => void }).__flowxListener;
                if (listener) {
                    videoElement.removeEventListener("loadeddata", listener);
                }
                videoElement.srcObject = null;
            }

            // DO NOT stop the tracks immediately if we expect to reopen the camera soon.
            // React strict mode / remounting often kills the stream otherwise.
            // We just let the stream garbage collect eventually or persist.
        };
    }, []);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/50 shadow-[0_0_40px_rgba(0,240,255,0.08)]",
            className,
        )}>
            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-sm text-brand-cyan">
                    Initializing hand tracking...
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-red-300">
                    {error}
                </div>
            )}

            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover opacity-65 -scale-x-100"
                autoPlay
                playsInline
                muted
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 h-full w-full -scale-x-100"
            />

            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80">
                    {recording ? 'Recording stroke' : 'Air capture live'}
                </div>
                <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80">
                    Gesture {telemetry.gesture}
                </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Tracking</p>
                    <p className={cn("mt-1 text-sm font-bold", telemetry.handDetected ? "text-green-400" : "text-white/60")}>
                        {telemetry.handDetected ? 'Hand detected' : 'Searching'}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Pinch Strength</p>
                    <p className="mt-1 text-sm font-bold text-brand-cyan">{Math.round(telemetry.pinchStrength * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Input</p>
                    <p className="mt-1 text-sm font-bold text-white/80">Air Camera</p>
                </div>
            </div>
        </div>
    );
}
