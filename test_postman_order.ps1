$loginBody = @{ email = "admin@deployment.com"; password = "admin" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri http://localhost:31234/api/auth/login -Method Post -Body $loginBody -ContentType "application/json"

# Fixed token path
$token = $response.data.token

$body = @{ 
    name = "order-processor"; 
    image = "golang:1.19-alpine"; 
    version = "3.3.3"; 
    targetPort = 8080;
    repoUrl = "https://github.com/corp/order-processor.git";
    postStartScript = "echo 'Order processor starting...'";
    envVars = @{ 
        KAFKA_BROKER = "kafka:9092";
        REGION = "us-east-1" 
    } 
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
