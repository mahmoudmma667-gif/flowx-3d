# Flowx 3D

Flowx 3D is a Next.js application for 3D model viewing, dashboard management, and Air Sketch interactions.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Start the stable development server:

```bash
npm run dev
```

The default `dev` script uses webpack because Turbopack can crash when very large archive files exist inside the project folder. If you later move those large archives out of the app directory, you can try:

```bash
npm run dev:turbo
```

## Environment Variables

Use the values in `.env.example` as a starting point.

## GitHub Private Repository

Recommended flow:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flowx-3d.git
git push -u origin main
```

Important:

- Keep `.env` out of Git.
- Keep local databases and large archives out of Git.
- If this folder is currently inside another Git repository, create a separate repository for `flowx-3d` itself before pushing.

## Deployment

### Fastest public link

Use Vercel with a private GitHub repository.

1. Push the project to a private GitHub repo.
2. Import the repo into Vercel.
3. Add production environment variables.
4. Deploy and use the generated `*.vercel.app` link.

### Production note

The current project uses:

- SQLite for the database
- Local disk writes for uploads in `public/models` and `public/uploads`

This is fine for local development, but it is not ideal for serverless hosting if you need persistent uploads or long-term data storage.

For a proper public production setup, migrate to:

- Postgres or another managed database instead of SQLite
- Object storage such as S3, Cloudinary, or Vercel Blob instead of local file writes

If you only want a demo link for browsing the site, Vercel is still the easiest path.
