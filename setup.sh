# setup.ps1 - PowerShell setup script
Write-Host "🚀 Setting up Express TypeScript Backend with pnpm..." -ForegroundColor Green

# Clean up if exists
Write-Host "🧹 Cleaning up existing files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Initialize project
Write-Host "📦 Initializing pnpm project..." -ForegroundColor Cyan
pnpm init

# Install production dependencies
Write-Host "📥 Installing production dependencies..." -ForegroundColor Cyan
pnpm add express mongoose ioredis jsonwebtoken bcryptjs helmet cors express-rate-limit express-mongo-sanitize express-xss-sanitizer zod winston swagger-ui-express swagger-jsdoc compression dotenv express-async-errors http-status-codes uuid rate-limit-redis

# Install dev dependencies
Write-Host "📥 Installing dev dependencies..." -ForegroundColor Cyan
pnpm add -D @types/express @types/node @types/jsonwebtoken @types/cors @types/compression @types/swagger-ui-express @types/swagger-jsdoc typescript ts-node-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier jest @types/jest ts-jest nodemon

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path src/config
New-Item -ItemType Directory -Force -Path src/middleware
New-Item -ItemType Directory -Force -Path src/utils
New-Item -ItemType Directory -Force -Path src/core
New-Item -ItemType Directory -Force -Path src/common
New-Item -ItemType Directory -Force -Path src/modules/auth
New-Item -ItemType Directory -Force -Path src/modules/health
New-Item -ItemType Directory -Force -Path src/modules/user
New-Item -ItemType Directory -Force -Path src/modules/auth/types
New-Item -ItemType Directory -Force -Path src/modules/auth/utils
New-Item -ItemType Directory -Force -Path logs

# Create basic files
Write-Host "📄 Creating basic files..." -ForegroundColor Cyan
New-Item -ItemType File -Force -Path src/app.ts
New-Item -ItemType File -Force -Path src/config/index.ts
New-Item -ItemType File -Force -Path .env.example
New-Item -ItemType File -Force -Path tsconfig.json
New-Item -ItemType File -Force -Path .gitignore

Write-Host "✅ Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the configuration files from above" -ForegroundColor White
Write-Host "2. Create .env file from .env.example" -ForegroundColor White
Write-Host "3. Run 'pnpm run dev' to start development server" -ForegroundColor White
Write-Host "4. Visit http://localhost:3000/api-docs for API documentation" -ForegroundColor White
