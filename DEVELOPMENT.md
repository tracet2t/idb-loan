# Development Setup

This project runs entirely inside a VS Code Dev Container backed by Docker Compose.
You do **not** need Node.js, npm, or MongoDB installed on your host machine.

## Prerequisites

| Tool                                                                                                                                                      | Notes                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)                                                            | Must be running before you open the container |
| [VS Code](https://code.visualstudio.com/)                                                                                                                 | Any recent stable build                       |
| [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (`ms-vscode-remote.remote-containers`) | Install once from the Extensions panel        |

---

## Opening the Dev Container

1. Clone the repository and open the folder in VS Code:

   ```
   git clone <repo-url>
   code idb-loan
   ```

2. VS Code will detect `.devcontainer/devcontainer.json` and show a notification:
   **"Reopen in Container"** — click it.

   Alternatively, open the Command Palette (`Ctrl+Shift+P`) and run:

   ```
   Dev Containers: Reopen in Container
   ```

3. VS Code will build/pull two Docker images (`app` and `mongo`) and start the containers.
   This takes a minute on the first run; subsequent opens are fast.

4. Once the container is ready, a `postCreateCommand` runs automatically:
   ```
   cd /workspace/server && npm install
   cd /workspace/Client && npm install
   ```
   Both dependency trees are installed — nothing extra needed.

---

## Environment Variables

The server reads configuration from `server/.env` (not committed to version control).
Create it before starting the backend:

```bash
# server/.env
MONGO_URI=mongodb://mongo:27017/idb_loan
JWT_SECRET=<replace-with-a-long-random-string>
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> **Tip:** Generate a strong `JWT_SECRET` with:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Running the Project

Open two integrated terminals inside VS Code (`Ctrl+`` ` ``).

### Backend (Express API — port 5000)

```bash
cd server
npm start
```

The API is available at `http://localhost:5000`.

### Frontend (Vite dev server — port 5173)

```bash
cd Client
npm run dev
```

The UI is available at `http://localhost:5173`.

> Both ports are automatically forwarded to your host by the dev container.

---

## Seeding the Database

Run the seed script once to create the initial `SUPER_ADMIN` role and user:

```bash
cd server
node seed.js
```

> Only run this on a fresh database. Re-running it will overwrite existing data.

---

## Connecting with MongoDB Compass (Optional)

Port `27017` is forwarded to the host. Connect Compass to:

```
mongodb://localhost:27017
```

---

## Useful VS Code Shortcuts inside the Container

| Action                                   | Shortcut                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| Open integrated terminal                 | `Ctrl+`` ` ``                                         |
| Command Palette                          | `Ctrl+Shift+P`                                        |
| Rebuild container (after config changes) | Command Palette → `Dev Containers: Rebuild Container` |

---

## Port Reference

| Port    | Service                            |
| ------- | ---------------------------------- |
| `5000`  | Express API                        |
| `5173`  | Vite dev server                    |
| `27017` | MongoDB (Compass / external tools) |
