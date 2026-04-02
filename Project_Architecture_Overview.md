# Container Deployment Manager: Architecture & Mechanics

This document serves as the master guide to understanding exactly how your **Container Deployment Manager** operates under the hood. It breaks down the architecture, the Docker integrations, the Blue-Green deployment strategy, and how all the moving pieces communicate with each other.

---

## 1. Project Summary & Functionality

The Container Deployment Manager is a **Full-Stack Orchestration Engine**. Its primary purpose is to act as a bridge between a user-friendly web interface and your computer's low-level Docker engine. 

Instead of typing complex CLI commands to pull images, map ports, configure networking, and manage container lifecycles, a user simply clicks a button on the React dashboard. The backend Node.js server receives this request, speaks directly to Docker, provisions the environment using a Zero-Downtime deployment strategy, and saves the system state to a MongoDB database.

---

## 2. Blue-Green Deployment & Ports Explained

The project uses a sophisticated deployment strategy known as **Blue-Green Deployment**. This is designed to achieve **Zero-Downtime** updates.

### What are Blue and Green Ports?
Whenever you create a new deployment, the system needs to assign it a physical port on your computer (e.g., `8080`). To do zero-downtime updates, the system assigns **two** distinct ports to every application simultaneously:
*   **A Blue Port** (e.g., `8145`)
*   **A Green Port** (e.g., `9231`)

### What does "Active" mean?
*   **Blue Active**: This means your application is currently running inside Docker on the physical Blue Port (`8145`). The frontend proxy intercepts user traffic and secretly routes it to `8145`.
*   **Green Active**: When you decide to push an *update* (a new version) to your app, the Orchestrator boots up the new version on the Green Port (`9231`) *while the old version is still running on the Blue Port*.

**The Mechanics of a Seamless Update:**
1. The old version handles live traffic on the Blue Port.
2. The orchestrator downloads the new version and starts it on the Green Port.
3. The orchestrator pings the Green Port constantly until it confirms the new version is healthy and ready.
4. **The Switch**: The backend instantly tells the proxy router to stop pointing to Blue and start pointing to the Green Port. 
5. The frontend users experience the new update instantly without a single second of downtime.
6. The Orchestrator safely deletes the old container sitting on the Blue Port to save memory. 

---

## 3. The Role of Docker Desktop

**Docker Desktop** is the core infrastructure provider for this project. Without it, the Container Deployment Manager is just a UI.

1.  **Isolation**: When you ask the system to run an application (like `nginx:alpine` or `golang`), Docker spins up an isolated mini-computer (container) on your machine.
2.  **Port Mapping**: Docker natively bridges the container's internal network to your Windows localhost network.
3.  **Command Execution (Exec)**: When you provide a `postStartScript`, our Node.js backend literally uses Docker CLI commands (`docker exec container_id sh -c "echo Hello"`) to reach inside the running container and configure it.

---

## 4. How the Frontend and Backend Connect

The architecture is split cleanly into two halves:
1.  **Backend (`/src`)**: A Node.js Express API running on Port `31234`.
2.  **Frontend (`/frontend`)**: A React SPA (Single Page Application) built with Vite running on Port `5173`.

### The Connection Bridge
Because they run on different ports, the Frontend communicates with the Backend using standard HTTP REST API calls (like `GET /api/deployments`).

**Where is the connection file?**
The glue that binds them together during development is located in your frontend's Vite configuration file:
*   **File Path**: `frontend/vite.config.js`
*   **The Logic**: Inside this file, there is a `proxy` object. It tells the React server: *"If a React component tries to fetch data from `/api/...`, automatically forward that request to `http://localhost:31234`."*

When you eventually build for production, the Vite Proxy goes away, and the final connection happens completely inside the backend catch-all route inside:
*   **File Path**: `src/app.js` (Lines 72-76)

---

## 5. Live Terminal & React-Analytics Mechanics

The live terminal and the real-time resource dials on your React dashboard do not use REST APIs. HTTP requests are too slow for real-time telemetry.

Instead, they use **Server-Sent Events (SSE)**.
1.  **Backend Streaming Setup**: Inside `src/controllers/adminController.js`, there is a route that opens a persistent connection pipeline with your browser. Instead of sending one response and closing the connection, the backend keeps the connection open.
2.  **Polling Docker**: Every few seconds, the backend runs `docker stats` and pushes that new payload through the open connection.
3.  **Frontend Reception**: In the React code (like the Dashboard components), the UI establishes an `EventSource`. Whenever the backend pushes new data into the pipeline, the React state automatically updates, causing the charts and terminal logs to visually "tick" forward in real-time.

By using this architecture, the dashboard achieves near-instant responsiveness while maintaining a very low memory footprint!
