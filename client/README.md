# React + Vite Frontend

This is the frontend for the React Fullstack App, built with Vite and React.

## Pages & Routing

- All routeable pages are in `src/pages`.
- The file path relative to `src/pages` determines the URL path. For example, `src/pages/user/ProfilePage.tsx` maps to `/user/profile`.
- `HomePage.tsx` is a special case and maps to both `/` and `/home`.
- **Route Grouping**: Folders with names in parentheses, like `(login)`, are for organization only and do not affect the URL. For example, `src/pages/(login)/LoginPage.tsx` maps to `/login`.
- **Nested Routes**: Directory structure determines nested routes. For example, `src/pages/tasks/SubTaskPage.tsx` maps to `/tasks/subtask`.
- **Authentication**: All routes are wrapped with `ProtectedRoute` for authentication. Unauthenticated users are redirected to `/login`.
- **Not Found Handling**: A wildcard route (`*`) displays `NotFoundPage` for unmatched paths.
- The core logic for dynamic routing is in `src/routes/pageRouteGenerator.ts` and used in `src/App.tsx`.

## Project Structure

- `src/` – Main source code (pages, services, assets)
- `public/` – Static public assets
- `dist/` – Production build output

## Scripts

- `npm run dev` – Start the frontend in development mode with hot reload. Proxies API requests to the backend.
- `npm run build` – Build the production-ready static files to `dist/`.
- `npm run preview` – Preview the production build locally.

## Configuration

The frontend uses standard Vite environment variables:

- **`.env`** - Development configuration (loaded by `npm run dev`)
- **`.env.production`** - Production configuration (loaded by `npm run build`)

### Environment Variables

- **`VITE_API_BASE_URL`** - API base URL
  - **Development**: Usually empty string (same origin)
  - **Production**: Your API domain (e.g., `https://api.yourapp.com`)

Vite automatically loads the correct environment file based on the build mode.

## Logging

Simple browser-compatible logging with `src/utils/logger.ts`:

```typescript
import logger from './utils/logger.js';
logger.info('Message'); 
```

## Development

- The frontend uses TypeScript and React Router.
- API requests to `/api` are proxied to the backend server (see `vite.config.js`).
- Shared types are imported from the `common` package.

## 🐳 Docker Deployment (Nginx)

This project includes a Dockerfile for building and serving the frontend as a static SPA using Nginx.

> **Important:** You must run the Docker build command from the project root (not from the client directory) so the build can access the shared `common` package.

### Build the Docker Image
```sh
docker build -f client/Dockerfile -t frontend-nginx .
```

### Run the Container
```sh
docker run -p 8080:80 frontend-nginx
```

- The app will be available at [http://localhost:8080](http://localhost:8080)
- Nginx serves the static files from the build output (`dist/`)
- The config supports client-side routing (SPA fallback to `index.html`)

## Notes

- Ensure the `common` package is built before starting the frontend in development or production.
- For fullstack development, use the root `npm run dev` script to run both client and server with hot reload.
