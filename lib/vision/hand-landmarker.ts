import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const MEDIAPIPE_VERSION = "0.10.32";
const HAND_LANDMARKER_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export class HandLandmarkerService {
    private static instance: HandLandmarker | null = null;
    private static loadingPromise: Promise<HandLandmarker> | null = null;

    static async getInstance(): Promise<HandLandmarker> {
        if (this.instance) return this.instance;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            const vision = await FilesetResolver.forVisionTasks(
                `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
            );

            const commonOptions = {
                baseOptions: {
                    modelAssetPath: HAND_LANDMARKER_MODEL_URL,
                },
                runningMode: "VIDEO" as const,
                numHands: 1,
            };

            try {
                this.instance = await HandLandmarker.createFromOptions(vision, {
                    ...commonOptions,
                    baseOptions: {
                        ...commonOptions.baseOptions,
                        delegate: "GPU",
                    },
                });
            } catch {
                this.instance = await HandLandmarker.createFromOptions(vision, {
                    ...commonOptions,
                    baseOptions: {
                        ...commonOptions.baseOptions,
                        delegate: "CPU",
                    },
                });
            }

            console.log("HandLandmarker loaded successfully");
            return this.instance;
        })().catch((error) => {
            console.error("Failed to load HandLandmarker:", error);
            this.instance = null;
            throw error;
        }).finally(() => {
            this.loadingPromise = null;
        });

        return this.loadingPromise;
    }
}
