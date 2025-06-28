# Backend for React + Vite Frontend

## 🐳 Docker Deployment (Node.js Backend)

This project includes a Dockerfile for building and running the backend as a Node.js server.

> **Important:** You must run the Docker build command from the project root (not from the server directory) so the build can access the shared `common` package.

### Build the Docker Image
```sh
docker build -f server/Dockerfile -t backend .
```

### Run the Container
```sh
docker run -p 5055:5055 backend
```

- The backend API will be available at [http://localhost:5055/api/*](http://localhost:5055/api/*) by default.

---

This Express.js server serves static files from the frontend (client) build and exposes API endpoints. It uses a shared `common` package for types and DTOs.

## Usage

1. Build the shared common package:

    cd ../common
    npm install
    npm run build

2. Build the frontend:

    cd ../client
    npm install
    npm run build

3. Install backend dependencies:

    cd ../server
    npm install

4. Start the backend server:

    npm start

The server will serve the frontend from `/client/dist` and expose API routes under `/api`.

---

- Make sure to build the `common` and `client` packages before starting the backend server.
- The backend will serve `index.html` for all non-API routes (for React Router support).
- For development, use `npm run dev` to enable watch mode for both common and backend code.
- Environment variables can be set in a `.env` file in the `server` directory.

---

## 🗄️ Database & Drizzle ORM Usage

This project uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database access and migrations.

### 1. Database Setup
- Make sure you have a running PostgreSQL instance.
- Set your database connection string in the `.env.development` file as `DATABASE_URL`.

### 2. Generating SQL Migration Scripts
After pulling the code or making schema changes, generate the SQL migration script from the Drizzle schema:

```sh
npx drizzle-kit generate --name=init
```
- This will create/update migration files in `server/drizzle/` (e.g., `0000_init.sql`).

### 3. Applying Migrations to Your Local Database
Apply the generated SQL script to your local database using the `psql` command:

```sh
 npx drizzle-kit push 
```

**Note:**
- The Drizzle ORM config uses `casing: 'snake_case'` for automatic mapping between camelCase in TypeScript and snake_case in the database.
- If you change the schema, always regenerate and re-apply the migration before running the backend.
- For more, see [Drizzle ORM docs](https://orm.drizzle.team/docs/overview).
