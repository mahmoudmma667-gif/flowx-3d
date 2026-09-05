# 📐 Flowx 3D — Core Architectural Whitepaper & Engine Specifications

This document outlines the underlying mathematics, computer vision pipelines, geometry evaluation pipelines, and WebGL rendering architectures powering **Flowx 3D**.

---

## 1. Computer Vision & Hand Landmark Perception

Flowx 3D leverages **Google MediaPipe Vision** (`@mediapipe/tasks-vision` v0.10.32) compiled to WebAssembly (WASM) with hardware-accelerated WebGL/GPU delegation.

### 1.1 Landmark Representation & Normalization
The input stream captures standard RGB frames from `navigator.mediaDevices.getUserMedia`. Each frame undergoes inferencing to yield **21 3D landmarks** per hand:

$$\mathbf{P}_i = (x_i, y_i, z_i) \quad \text{for } i \in [0, 20]$$

- $x_i, y_i \in [0, 1]$: Normalized screen coordinates relative to image width and height.
- $z_i$: Normalized relative depth where the wrist ($\mathbf{P}_0$) serves as the origin plane ($z_0 = 0$).

### 1.2 Palm Scale Invariant Metric
To ensure gesture detection is invariant to hand distance from the webcam, a dynamic **Palm Size Reference** ($\mathcal{S}_{\text{palm}}$) is calculated as the average Euclidean distance between key structural bases:

$$\mathcal{S}_{\text{palm}} = \frac{1}{3} \Big( \|\mathbf{P}_0 - \mathbf{P}_5\| + \|\mathbf{P}_0 - \mathbf{P}_{17}\| + \|\mathbf{P}_5 - \mathbf{P}_{17}\| \Big)$$

Where:
- $\mathbf{P}_0$ = Wrist
- $\mathbf{P}_5$ = Index Finger Metacarpophalangeal (MCP) Joint
- $\mathbf{P}_{17}$ = Pinky Finger Metacarpophalangeal (MCP) Joint

### 1.3 Gesture Classification Heuristics
The normalized pinch distance $D_{\text{pinch}}$ is evaluated as:

$$D_{\text{pinch}} = \frac{\|\mathbf{P}_4 - \mathbf{P}_8\|}{\mathcal{S}_{\text{palm}}}$$

- $\mathbf{P}_4$: Thumb tip
- $\mathbf{P}_8$: Index tip

Pinch activation triggers when $D_{\text{pinch}} < 0.34$, with continuous pinch strength formulated as:

$$\sigma_{\text{pinch}} = \text{clamp}\left(1 - \frac{D_{\text{pinch}}}{0.68}, 0, 1\right)$$

---

## 2. Trajectory Smoothing & Curve Synthesis

Raw webcam landmarks exhibit physiological tremor and camera sensor noise. Flowx 3D utilizes a multi-pass **Catmull-Rom Spline Relaxation**:

### 2.1 Centripetal Catmull-Rom Formulation
For any 4 consecutive spatial points $\mathbf{p}_0, \mathbf{p}_1, \mathbf{p}_2, \mathbf{p}_3$, the interpolated point $\mathbf{C}(t)$ for $t \in [0, 1]$ is:

$$\mathbf{C}(t) = \frac{1}{2} \begin{bmatrix} 1 & t & t^2 & t^3 \end{bmatrix} \begin{bmatrix} 0 & 2 & 0 & 0 \\ -1 & 0 & 1 & 0 \\ 2 & -5 & 4 & -1 \\ -1 & 3 & -3 & 1 \end{bmatrix} \begin{bmatrix} \mathbf{p}_0 \\ \mathbf{p}_1 \\ \mathbf{p}_2 \\ \mathbf{p}_3 \end{bmatrix}$$

This guarantees $C^1$ continuity, ensuring curvature smoothness without unnatural geometric sharp corners during mid-air drawing.

---

## 3. Constructive Solid Geometry (CSG) Engine

Flowx 3D implements client-side CSG through `three-bvh-csg` (Bounding Volume Hierarchy accelerated):

```text
       Brush A (Target Mesh)           Brush B (Tool / Slicing Mesh)
                 \                               /
                  \                             /
                   BVH Spatial Tree Decomposition
                                 ↓
               Polygon Split & Coplanar Clipping
                                 ↓
            [ Union / Subtraction / Intersection ]
                                 ↓
               Re-indexed Manifold BufferGeometry
```

### 3.1 Octant Sectional Slicing
To inspect interior geometry or partition models for compact 3D printing beds, any arbitrary mesh bounding box $[(x_{\min}, y_{\min}, z_{\min}), (x_{\max}, y_{\max}, z_{\max})]$ is divided into 8 volumetric octants:

$$\text{Octant Index } k = (\delta_x) \lor (\delta_y \ll 1) \lor (\delta_z \ll 2) \quad \text{where } \delta_i \in \{0, 1\}$$

A clipping box brush is synthesized for the chosen octant and intersected with the target geometry using accelerated BVH tree traversals.

---

## 4. Multi-Format Exporter Pipeline

All exports run entirely on the client device inside the Web Worker / main thread without invoking backend rendering servers:

1. **STL Export (`exportToSTL`)**: Serializes the `BufferGeometry` triangle attributes into a compact 80-byte header binary format containing face normal vectors and 32-bit floating-point vertex triples:
   - 80-byte Header: File description
   - 4-byte unsigned integer: Number of triangles ($N$)
   - $N \times 50$-byte records: Normal vector ($3 \times \text{float32}$), 3 Vertices ($3 \times 3 \times \text{float32}$), and 2-byte attribute byte count.
2. **GLB Export (`exportToGLB`)**: Converts the Three.js scene graph into a packed binary GLTF container (`model/gltf-binary`) with JSON chunk and binary buffer chunk containing interleaved vertex, normal, and UV data.
3. **OBJ Export (`exportToOBJ`)**: Generates ASCII Wavefront format with indexed `v`, `vn`, and `f` face descriptors.

---

## 5. Persistence & State Architecture

```text
[ Client Zustand Store ]
        ├── Interaction State: Tool, Wireframe, Lighting, Animation Speed
        └── Model State: Active Geometry, Undo/Redo Stacks
                 ↓ (Next.js Server Actions)
[ Prisma 7 Client ]
        └── SQLite Database Engine (Better-SQLite3)
                 ├── Model3D Records & Attachments
                 ├── User Preferences
                 └── Realtime Latency & Telemetry Events
```
