# Install required dependencies
pnpm add ioredis diskusage
pnpm add -D @types/ioredis @types/diskusage

# Start the server
pnpm dev

# Test health endpoints
curl http://localhost:3000/ping
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
curl http://localhost:3000/health/metrics
curl http://localhost:3000/health/version
curl http://localhost:3000/health/database
