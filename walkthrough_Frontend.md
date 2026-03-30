# 🖤 React Frontend UI - Deployment Manager Walkthrough

This document serves as your complete guide to running and interacting with the custom React Frontend built for your Container Deployment Manager.

## 1. Prerequisites
Before running the frontend, ensure that:
- You have **Node.js** installed.
- Your **Deployment Manager Backend** is actively running on `http://localhost:3000`. 
  *(To start it, open a terminal in the main `container-deployment-manager` folder and run `npm start`)*

---

## 2. Starting the Frontend Application
The React application was built using **Vite**, which makes it incredibly fast.

1. Open a new terminal instance.
2. Navigate to the frontend directory:
   ```powershell
   cd C:\Users\AONAK YADAV\.gemini\antigravity\scratch\container-deployment-manager\frontend
   ```
3. Start the development server:
   ```powershell
   npm run dev
   ```
4. You should see an output indicating the server is running, usually on:
   `http://localhost:5173`

> [!TIP]
> Keep both the backend terminal and frontend terminal open simultaneously so they can communicate seamlessly!

---

## 3. Navigating the UI

Open your browser to the URL provided by Vite (e.g., `http://localhost:5173`). You will be presented with a beautifully designed, dark-mode glassmorphic interface.

### The Dashboard (`/dashboard`)
This is your command center. Instead of manually querying MongoDB or using Postman, the Dashboard auto-fetches all your configurations and **silently auto-polls your backend every 3 seconds** to keep statuses natively in sync without you ever hitting refresh.
- **Visual Overview:** Every deployment configuration appears as a sleek card showing the application name, image tag, and active ports (Blue & Green).
- **Status Indicators:** You can instantly see if a deployment is **Pending** or **Running** (and whether Blue or Green is currently routing traffic).
- **One-Click Deploys:** To trigger a zero-downtime swap, simply click the purple **"Deploy"** button (play icon) on any card. Beautiful Toast notifications will slide in to keep you updated.
- **Emergency Stop:** Click the red **"Stop"** button (square icon) to force-terminate and securely destroy the active Docker containers for that deployment to instantly kill traffic.
- **The Nuke Button:** Click the extremely subtle **Trash** icon embedded at the top right of any deployment card to trigger the deployment self-destruct mechanism. A warning will prompt you. If accepted, the deployment is permanently cascade-deleted from MongoDB and Docker.
- **Live Logs Modal:** Click the **Terminal** icon on any card to slide open a matrix-style matrix modal that streams the active container logs natively.
- **History Timeline:** Click the **Settings** icon to open a sleek visual timeline mapping every historical deployment event and swap for that container.

### Launching Configurations (`/create`)
Click **"New Deployment"** in the top navigation bar to access the Creation Form.
- Here, you fill out simple, clean fields for your App Name, Docker Image, Tag, and Container Port.
- **Dynamic Variables:** If you need to inject custom environment secrets (like `DATABASE_URL` or `API_KEY`), simply click **"Add Var"** to dynamically add key-value pairs. 
- When you submit, the React app converts your inputs into the exact JSON format your Express API requires and securely posts it to `POST /api/deployments`.

---

## 4. How the Frontend Connects to the Backend
If you ever want to see exactly how the UI communicates with your server, look at `/frontend/src/api/client.js`. 

It uses **Axios** to create a centralized client locked to `http://localhost:3000/api`. Whenever you take an action on the UI, this client cleanly triggers your backend controllers without you ever having to write a PowerShell script again.

Enjoy your new empire. 👑
