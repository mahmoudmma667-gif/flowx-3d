import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureType = 'IDLE' | 'GRAB' | 'PINCH' | 'OPEN';
export interface GestureAnalysis {
    gesture: GestureType;
    pinchDistance: number;
    pinchStrength: number;
    palmSize: number;
    extendedFingers: {
        thumb: boolean;
        index: boolean;
        middle: boolean;
        ring: boolean;
        pinky: boolean;
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function distance2D(p1: NormalizedLandmark, p2: NormalizedLandmark) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function average(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isFingerExtended(
    landmarks: NormalizedLandmark[],
    tipIndex: number,
    pipIndex: number,
    mcpIndex: number
) {
    const wrist = landmarks[0];
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];
    const mcp = landmarks[mcpIndex];

    return (
        distance2D(tip, wrist) > distance2D(pip, wrist) * 1.08 &&
        distance2D(tip, mcp) > distance2D(pip, mcp)
    );
}

export function analyzeGesture(landmarks: NormalizedLandmark[]): GestureAnalysis {
    if (!landmarks || landmarks.length < 21) {
        return {
            gesture: 'IDLE',
            pinchDistance: 1,
            pinchStrength: 0,
            palmSize: 0,
            extendedFingers: {
                thumb: false,
                index: false,
                middle: false,
                ring: false,
                pinky: false,
            },
        };
    }

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];
    const middleTip = landmarks[12];
    const pinkyBase = landmarks[17];

    const palmSize = average([
        distance2D(wrist, indexBase),
        distance2D(wrist, pinkyBase),
        distance2D(indexBase, pinkyBase),
    ]);

    if (palmSize < 0.0001) {
        return {
            gesture: 'IDLE',
            pinchDistance: 1,
            pinchStrength: 0,
            palmSize,
            extendedFingers: {
                thumb: false,
                index: false,
                middle: false,
                ring: false,
                pinky: false,
            },
        };
    }

    const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
    const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
    const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
    const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);
    const thumbExtended = distance2D(thumbTip, pinkyBase) > distance2D(thumbIp, pinkyBase) * 1.04;

    const pinchDistance = distance2D(thumbTip, indexTip) / palmSize;
    const thumbToMiddleDistance = distance2D(thumbTip, middleTip) / palmSize;
    const thumbSupportDistance = distance2D(thumbIp, indexBase) / palmSize;
    const pinchStrength = clamp(1 - pinchDistance / 0.68, 0, 1);
    const likelyPinch =
        pinchDistance < 0.34 ||
        (pinchDistance < 0.46 && (indexExtended || middleExtended || !ringExtended || !pinkyExtended)) ||
        (pinchDistance < 0.52 && thumbToMiddleDistance < 0.9 && thumbSupportDistance < 0.92);

    const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended];
    const curledCount = extendedFingers.filter((isExtended) => !isExtended).length;

    let gesture: GestureType = 'IDLE';

    if (likelyPinch) {
        gesture = 'PINCH';
    } else if (curledCount >= 3 && thumbExtended) {
        gesture = 'GRAB';
    } else if (extendedFingers.every(Boolean) && thumbExtended) {
        gesture = 'OPEN';
    }

    return {
        gesture,
        pinchDistance,
        pinchStrength,
        palmSize,
        extendedFingers: {
            thumb: thumbExtended,
            index: indexExtended,
            middle: middleExtended,
            ring: ringExtended,
            pinky: pinkyExtended,
        },
    };
}

export function recognizeGesture(landmarks: NormalizedLandmark[]): GestureType {
    return analyzeGesture(landmarks).gesture;
}
