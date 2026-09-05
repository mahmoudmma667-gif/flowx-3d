# Contributing to Flowx 3D

First off, thank you for considering contributing to **Flowx 3D**! It's people like you that make open-source spatial computing exciting and accessible to everyone.

---

## 🛠️ Development Setup

1. **Fork the repo** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/flowx-3d.git
   cd flowx-3d
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure environment**:
   ```bash
   copy .env.example .env
   ```
5. **Generate Prisma models**:
   ```bash
   npx prisma generate
   ```
6. **Start dev server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Guidelines

Before opening a pull request, run the test suites:

```bash
npm run test:run
npm run lint
```

Ensure that:
- No new console warnings or errors are introduced.
- MediaPipe HandLandmarker lifecycle disposals are properly handled on unmount.
- CSG boolean operations return watertight geometries.

---

## 📐 Code Style & Conventions

- **Framework**: Next.js 16 (App Router) + React 19.
- **Language**: TypeScript (strict mode enabled).
- **Styling**: Tailwind CSS v4.0 with semantic color tokens (`brand-cyan`, `brand-purple`, `brand-dark`).
- **3D Standards**: Three.js conventions using `@react-three/fiber` and `@react-three/drei`. Always dispose geometries and materials on unmount.

---

## 📬 Submitting a Pull Request

1. Create a descriptive branch:
   ```bash
   git checkout -b feat/new-csg-primitive
   ```
2. Commit your changes with a clear commit message:
   ```bash
   git commit -m "feat(air-sketch): add procedural spiral extrusion primitive"
   ```
3. Push to your fork:
   ```bash
   git push origin feat/new-csg-primitive
   ```
4. Open a Pull Request against `main` on the primary repository.

---

## 📄 Code of Conduct

Please be respectful, constructive, and collaborative. We are committed to providing a welcoming community for all developers.

Thank you for building the future of spatial computing with us!
