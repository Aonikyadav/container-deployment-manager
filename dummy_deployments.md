Use these JSON payloads and PowerShell commands to test the `/api/deployments` endpoint. 

> [!IMPORTANT]
> **Authentication is REQUIRED.** You must first log in using the command in "Section 0" to get your authorization token.

---

## 🔐 SECTION 0: AUTHENTICATION (DO THIS FIRST)

Before you can create any deployments via PowerShell, you must authenticate to get a token.

### 0. Register a New Admin User (Optional)
If you don't have an account yet, you can register and receive a token immediately.
```powershell
$registerBody = @{
    username = "tommy"   
    email = "tommy@gmail.com"        
    password = "123456789"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:31234/api/auth/register -Method Post -Body $registerBody -ContentType "application/json"
# NOW we extract the token from the response
$token = $response.data.token
Write-Output "✅ Success! Registered and token is saved in memory."
```

### 1. Login to get a Session Token
```powershell
$loginBody = @{
    email = "admin@deployment.com"
    password = "admin"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:31234/api/auth/login -Method Post -Body $loginBody -ContentType "application/json"
# NOW we extract the token from the response
$token = $response.data.token
Write-Output "✅ Success! Token is saved in memory."

### 2. Verify Current User
Test your token to see exactly who is logged in!
```powershell
Invoke-RestMethod -Uri http://localhost:31234/api/auth/me -Method Get -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```

### 3. Logout (Destroy Token)
When you are done testing, run this to securely clear your token from memory.
```powershell
Remove-Variable token -ErrorAction SilentlyContinue
Write-Output "🔒 Successfully logged out."
```

---

## 🎨 FRONTEND DEPLOYMENTS (UI)

### 1. React Analytics Dashboard
```json
{
  "name": "react-analytics",
  "image": "nginx",
  "version": "alpine",
  "targetPort": 80,
  "envVars": {
    "VITE_API_URL": "http://localhost:31234/proxy/inventory-api",
    "THEME": "dark"
  }
}
```

### 2. Vue Storefront Shop
```json
{
  "name": "vue-store",
  "image": "nginx",
  "version": "alpine",
  "targetPort": 80,
  "envVars": {
    "VITE_STORE_ID": "shop_99",
    "STRIPE_KEY": "pk_test_123"
  }
}
```

### 3. Angular Corporate Admin
```json
{
  "name": "angular-admin",
  "image": "nginx",
  "version": "alpine",
  "targetPort": 80,
  "repoUrl": "https://github.com/angular/admin-portal.git",
  "postStartScript": "npm run start:prod",
  "envVars": {
    "BACKEND_SERVER": "http://localhost:31234/proxy/billing-service",
    "AUTH_REDIRECT": "http://localhost:31234/proxy/angular-admin/auth"
  }
}
```

### 4. Svelte SaaS Landing
```json
{
  "name": "svelte-landing",
  "image": "nginx",
  "version": "alpine",
  "targetPort": 80,
  "envVars": {
    "GA_TRACKING_ID": "UA-998877-1",
    "PRICING_TABLE": "active"
  }
}
```

---

## ⚙️ BACKEND DEPLOYMENTS (POWERSHELL SCRIPTS)

Copy and paste these directly into your PowerShell terminal to initialize the backend services.

### 1. Express Inventory API (Node.js)
```powershell
$body = @{ 
    name = "inventory-api"; 
    image = "nginx"; 
    version = "alpine"; 
    targetPort = 80;
    envVars = @{ 
        DB_NAME = "inventory_db";
        MAX_RETRIES = "5" 
    } 
} | ConvertTo-Json


# Note: Using the $token from Section 0
Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```

### 2. Python Flask Billing Service
```powershell
$body = @{ 
    name = "billing3-service"; 
    image = "caddy"; 
    version = "alpine"; 
    targetPort = 80;
    envVars = @{ 
        CURRENCY = "USD";
        PAYPAL_SANDBOX = "true" 
    } 
} | ConvertTo-Json

# Note: Using the $token from Section 0
Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```

### 3. Go Order Processor
```powershell
$body = @{ 
    name = "order-processor"; 
    image = "nginx"; 
    version = "alpine"; 
    targetPort = 80;
    repoUrl = "https://github.com/corp/order-processor.git";
    postStartScript = "echo 'Order processor starting...'";
    envVars = @{ 
        KAFKA_BROKER = "kafka:9092";
        REGION = "us-east-1" 
    } 
} | ConvertTo-Json

# Note: Using the $token from Section 0
Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```

### 4. Java Spring Boot Auth
```powershell
$body = @{ 
    name = "auth00-microservice"; 
    image = "nginx"; 
    version = "alpine"; 
    targetPort = 80;
    postStartScript = "rm -rf /tmp/*";
    envVars = @{ 
        JWT_SECRET = "TOP_SECRET_SECURITY_KEY";
        TOKEN_EXPIRY = "3600" 
    } 
} | ConvertTo-Json

# Note: Using the $token from Section 0
Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```




Yes! Since the Container Deployment Manager uses standard Docker commands under the hood, you are not restricted to just nginx and alpine.

You can use any public Docker image and tag available on Docker Hub. The system simply takes your image name and your version (which acts as the Docker tag) and combines them (e.g., image:version) to pull and run the container.

Here are some popular options you can use instead of nginx:alpine:

Web Servers

Apache (HTTPD)
"image": "httpd", "version": "alpine"

Caddy (Modern web server with auto HTTPS capabilities)
"image": "caddy", "version": "alpine"

Node.js (For running custom built Node apps)
Node 18 Alpine
"image": "node", "version": "18-alpine"

You would use this with a repoUrl and a postStartScript (like npm install && npm start)

Python (For Flask / Django / FastAPI apps)
Python 3.10 Slim
"image": "python", "version": "3.10-slim"

Typically runs an installed script via postStartScript
Databases/Caches (If you ever update the manager to support non-HTTP apps)

Redis
"image": "redis", "version": "alpine"
PostgreSQL
"image": "postgres", "version": "15-alpine"
Why does it default to nginx:alpine in the dummy deployment script?