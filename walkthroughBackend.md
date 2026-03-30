 ***CONTAINER DEPLOYMENT MANAGER GUIDE** 

This document explains how the project works, what inputs to provide, and what outputs to expect.

# 1. PREREQUISITES
Before checking the project, you must have the following running on your Windows machine:
- Node.js installed (v16+)
- MongoDB running locally on default port 27017
- Docker Desktop installed and running (The manager uses Docker CLI behind the scenes)

# 2. STARTING THE MANAGER
1. Open a terminal in the `container-deployment-manager` folder.
2. Run `npm install` (already done by the AI).
3. Run `npm run start` or `node src/app.js`.
4. You should see:
   "Server is running on port 3000"
   "Connected to MongoDB successfully"

# 3. HOW IT WORKS & HOW TO TEST IT

The project acts like a mini-Kubernetes. You use REST APIs (like Postman or curl/Invoke-RestMethod) to tell it what Docker container to run.

---
# STEP A: Check the Health of the API
Action: Send a GET request to see if it's alive.
Command (PowerShell):
Invoke-RestMethod -Uri http://localhost:3000/health

Expected Output:
{
  "status": "ok",
  "message": "Container Deployment Manager API is running."
}

---
# STEP B: Create a New Deployment Configuration
Action: Tell the system you WANT to deploy an application (e.g., an Nginx web server). This only saves the configuration in MongoDB, it does NOT start the container yet.
Command (PowerShell):
$body = @{
    name = "my-web-app"
    image = "nginx:latest"
    version = "1.0.0"
    targetPort = 80
} | ConvertTo-Json

After running that , run this code :

Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json


Expected Output:

It will return a JSON object containing the Deployment ID, showing it is in "pending" status, and has assigned internal "bluePort" and "greenPort".




# Step C: Triggering the Blue-Green Deployment

When you trigger Step C, the **Node.js Orchestration Engine** executes a precise series of steps to ensure zero-downtime (Blue-Green) deployment. 

Here is the "slow-motion" breakdown of exactly how the project reacts under the hood when you call the `/deploy` endpoint:

### 1. Environment Selection
The [DeploymentService](file:///c:/Users/AONAK%20YADAV/.gemini/antigravity/scratch/container-deployment-manager/src/services/deploymentService.js#8-141) checks the current active environment. If `blue` is active, the target becomes `green` (and vice versa). For a brand new deployment, it defaults to `blue`. It grabs the pre-assigned `hostPort` for that environment.

### 2. Status Update
The MongoDB [Deployment](file:///c:/Users/AONAK%20YADAV/.gemini/antigravity/scratch/container-deployment-manager/src/controllers/deploymentController.js#29-37) document's status is immediately changed to `deploying`. 

### 3. Container Launch 🐳
The `dockerService` is invoked to run the new container:
- It generates a unique name (e.g., `my-web-app-blue-17124991234`).
- It executes the equivalent of `docker run -d -p <hostPort>:<targetPort> --name <unique-name> nginx:latest`.
- A new `Container` tracking record is saved to MongoDB with status `running`.

### 4. Healthcheck Simulation (The "Slow" Step) ⏱️
The system actively halts for **5 seconds**:
```javascript
// Healthcheck Simulation
console.log(`Waiting for ${containerName} to become healthy...`);
await new Promise(resolve => setTimeout(resolve, 5000));
```
*In a real production environment, this step would repeatedly ping the container's `/health` endpoint until it gets a 200 OK response.*

### 5. Traffic Switch (The Zero-Downtime Magic) 🔀
Once healthy, the system updates its internal in-memory Proxy `routingTable`. 
- Traffic from `http://localhost:3000/proxy/my-web-app` is instantly redirected to the new `hostPort`.
- The Database record is updated to `status: 'running'`, and `currentEnvironment` is locked in.

### 6. Cleanup of Old Environment 🧹
If there was a previous version running (e.g., you just deployed `green` and `blue` was running), the system finds the old Docker container and gracefully terminates it:
- Runs `docker stop <old-container>`
- Runs `docker rm <old-container>`
- Marks the old container as `stopped` in MongoDB.

---

## *** Action: Execute Step C ***

Since you have the Manager API running, please run the following commands in your PowerShell terminal to trigger the deployment. *(Replace `<DEPLOYMENT_ID>` with the actual ID returned from Step B)*:

```powershell
# 1. First, create the deployment configuration (Step B - If not done yet)
$body = @{ name = "my-web-app"; image = "nginx:latest"; version = "1.0.0"; targetPort = 80 } | ConvertTo-Json
$response = Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Post -Body $body -ContentType "application/json"
$deploymentId = $response.data._id
Write-Output "Got Deployment ID: $deploymentId"

# 2. Trigger the Blue-Green Deployment (Step C)
Invoke-RestMethod -Uri "http://localhost:3000/api/deployments/$deploymentId/deploy" -Method Post | ConvertTo-Json

# 3. Verify it works!
# Open your browser to: http://localhost:3000/proxy/my-web-app
```




Here is a complete walkthrough of **Step D** and **Step E**, explaining exactly what to do and how it works behind the scenes.


### **Step D: Access Your Application via the Reverse Proxy**

Now that your deployment is running (which happened in Step C), the goal of Step D is to actually view the application you just deployed.

**What you need to do:**
1. Open your web browser (Chrome, Edge, Firefox, etc.) or Postman.
2. Go to this exact URL:
   `http://localhost:3000/proxy/my-web-app`

**How it works (Behind the Scenes):**
* **The Request:** When you hit that URL, you aren't directly talking to the Docker container. Instead, you are talking to the **Node.js server** running the Deployment Manager on port `3000`.
* **The Magic Routing:** The server acts as a **Reverse Proxy**. It checks its internal records, sees that `my-web-app` is currently running on the "blue" environment on port `8006`, and seamlessly forwards your request there.
* **The Result:** The proxy passes the container's response back to you. Since you deployed an `nginx` image, you will see the default **"Welcome to nginx!"** HTML page in your browser. 

---


# Step E: Updating to a New Version (Simulating Zero Downtime)

This step demonstrates how the Container Deployment Manager handles rolling out a new version of your application without any downtime. It uses a **Blue-Green Deployment** strategy.

### **1. The Goal**
You have an application running in the "blue" environment (e.g., version 1.0.0 on port 8006). You want to upgrade it to version 1.1.0, but you don't want anyone visiting your website to see an error page while the new version starts up.

### **2. The Command**

To guarantee zero-downtime works perfectly now that we fixed the code bug, the easiest solution is to wipe away the stuck containers and create a brand new deployment.

Here is how to quickly reset and see it in action:

1. Clean up the stuck Docker containers: Copy and paste these two lines into your PowerShell prompt to forcefully stop and delete any corrupted my-web-app containers so the ports are freed up:

 $containers = docker ps -aq --filter "name=my-web-app"
if ($containers) { docker rm -f $containers }

2. Create a fresh Deployment (Step B again): Let's name this one my-web-app-v2 to avoid any MongoDB conflicts with the old corrupted record.

powershell:

$body = @{ name = "my-web-app-v2"; image = "nginx:latest"; version = "1.0.0"; targetPort = 80 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Post -Body $body -ContentType "application/json"

3. 

How to get the correct ID: You can easily fetch the real MongoDB _id for your new deployment by running this command in your PowerShell terminal to show a list of all deployments:

$deployments = Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Get
$deployments.data | Format-Table _id, name, status

This will print out a neat table that looks something like this:

text
_id                        name             status
---                        ----             ------
69c54... (24 chars long)   my-web-app-v2    pending


Here is the exact command you should copy and paste for Step C:

powershell:

Invoke-RestMethod -Uri http://localhost:3000/api/deployments/69c5596dc2aa945b85f7ba72/deploy -Method Post -Body "{}" -ContentType "application/json"

Once you run that, it will start your fresh v1.0.0 container in the blue environment. After that, you can try running Step E again (the zero-downtime update to v1.1.0) with exactly the same URL:

powershell:

$body = @{ version = "1.1.0" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/deployments/69c5596dc2aa945b85f7ba72/deploy -Method Post -Body $body -ContentType "application/json"

### **3. How it Works (Behind the Scenes Working)**

When you run that command, the Orchestration Engine performs the following sequence automatically:

1. **State Detection**: The manager looks at the database and sees that the current active environment is **"blue"** (running `nginx:1.0.0` on port 8006).
2. **Launch in Standby**: It does **not** stop the blue container. Instead, it spins up a brand new, separate container in the idle **"green"** environment (running the new `nginx:1.1.0` on port 9939).
3. **Health Check**: It waits (about 5 seconds) to ensure the new "green" container is fully booted up and healthy. During this time, all user traffic is STILL going to the old "blue" container.
4. **The Switch (Zero Downtime)**: The exact millisecond the green container is confirmed healthy, the Reverse Proxy instantly updates its internal routing table. Any *new* requests to `http://localhost:3000/proxy/my-web-app` are now routed to the **green** container.
5. **Clean Up**: Finally, since the old "blue" container is no longer receiving traffic, the system safely stops and deletes it to free up resources.

### **4. End Result**
* Your users experienced exactly zero milliseconds of downtime.
* Your proxy URL `http://localhost:3000/proxy/my-web-app` never changed.
* Your app is successfully upgraded to `v1.1.0`.




"How do I do the Advanced Environment Variable Setup (Section 5)?" since you already successfully ran the history and logs commands in your terminal!

Here is how you can use the Deployment Manager to inject custom Environment Variables into your containers as they boot up.

It is a two-part process:

1. The Developer Side (Passing the Variables)
When creating a new deployment config (Step B), you can pass a JSON object of envVars to the API. For example, let's create a new deployment called my-custom-env-app and pass it a database URL and an API key:

powershell:

# ***

$body = @{ 
    name = "my-custom-env-app"; 
    image = "nginx:latest"; 
    version = "1.0.0"; 
    targetPort = 80;
    envVars = @{ 
        DATABASE_URL = "mongodb://superuser:password@database:27017";
        API_KEY = "super-secret-12345" 
    } 
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Post -Body $body -ContentType "application/json"


# ***

Behind the scenes, the Orchestration Engine takes those variables and translates them into Docker arguments, so when it runs Step C, the actual command executed is: docker run -d -e DATABASE_URL="mongodb://..." -e API_KEY="super-secret-12345" ...

2. The Container Side (Using the Variables)
If you look inside 

scripts/setup-env.sh
, you will find an example entrypoint script.

When you build your own custom Docker images (instead of just using basic nginx), you would copy this 

setup-env.sh
 file into your Dockerfile.

When your container starts up, this script automatically executes. It can read $DATABASE_URL and $API_KEY to securely login to your production systems, set up config files, or connect to remote servers before it launches your main application code!

This is incredibly useful because it means your Docker image is fully independent—you can run the exact same Docker Image in a "staging" deployment (with test database credentials) and a "production" deployment (with real database credentials) without changing a single line of code!



$body = @{ 
    name = "my-custom-love-app"; 
    image = "nginx:latest"; 
    version = "1.0.0"; 
    targetPort = 80;
    envVars = @{ 
        DATABASE_URL = "mongodb://superuser:password@database:27055";
        API_KEY = "super-secret-123456" 
    } 
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/deployments -Method Post -Body $body -ContentType "application/json"

---

# Step F: The Custom React Frontend UI

To make managing your containers significantly easier (and visually stunning), an entire React Frontend UI has been added to this project. It connects directly to the Deployment Manager built in the previous steps.

### **1. Starting the Application**
You now have two pieces to run together:
- **The Backend**: Open a terminal in `container-deployment-manager` and run `npm start` (or `node src/app.js`).
- **The Frontend**: Open a second terminal, navigate to `container-deployment-manager/frontend`, and run `npm run dev`.

### **2. Using the Dashboard**
Once running, open your browser to `http://localhost:5173`. 
You will be greeted by a dark-mode, glassmorphic UI. 

From the Dashboard, you can:
- **View Statuses**: See all of your deployments at a glance, along with their active environment (Blue or Green) and assigned ports.
- **Trigger Deploys**: Hit the "Deploy" button on any configuration to instantly execute the Blue-Green swap. You don't need to use PowerShell `Invoke-RestMethod` anymore!
- **Launch Configurations**: Use the "New Deployment" button in the navigation bar to create and initialize new projects, complete with dynamic Environment Variable injection fields.
