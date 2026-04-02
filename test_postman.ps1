$loginBody = @{ email = "admin@deployment.com"; password = "admin" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri http://localhost:31234/api/auth/login -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.data.token
$body = @{ name = "inventory-api-manual-test"; image = "node:18-alpine"; version = "2.4.0"; targetPort = 3000 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:31234/api/deployments -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
