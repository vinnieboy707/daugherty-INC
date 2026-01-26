# 🚀 Quick Deployment Reference

This is a quick reference guide for deploying the Daugherty Inc application.

## Fastest Way to Get Started

```bash
npm run deploy:interactive
```

Then select option **1** (Quick Start) for first-time setup.

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run deploy:interactive` | Launch interactive deployment menu |
| `npm run dev` | Start development servers (frontend + backend) |
| `npm run build:frontend` | Build frontend for production |
| `npm run deploy` | Automated deployment pipeline |

## Deployment Modes Quick Reference

### 🆕 First Time Setup
```bash
npm run deploy:interactive → Option 1 (Quick Start)
```

### 💻 Local Development
```bash
npm run deploy:interactive → Option 2 (Development)
# Then: npm run dev
```

### 🏗️ Production Build
```bash
npm run deploy:interactive → Option 3 (Production Build)
```

### 🐳 Docker Deployment
```bash
npm run deploy:interactive → Option 4 (Docker Deployment)
```

### 🔄 Update/Refresh
```bash
npm run deploy:interactive → Option 5 (Update Only)
```

### 🧹 Fix Build Issues
```bash
npm run deploy:interactive → Option 6 (Clean & Rebuild)
```

## Prerequisites

- Node.js 18+ ✅
- npm ✅
- MongoDB (for backend) ⚙️
- Docker (optional, for containerized deployment) 🐳

## Need Help?

1. Check status: `npm run deploy:interactive → Option 8`
2. See full docs: [INTERACTIVE_DEPLOYMENT.md](INTERACTIVE_DEPLOYMENT.md)
3. Traditional deployment: [DEPLOYMENT.md](DEPLOYMENT.md)

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Clean & Rebuild (Option 6) |
| Dependencies issues | Clean & Rebuild (Option 6) |
| MongoDB errors | Ensure MongoDB is running |
| Port in use | Stop conflicting services |
| Environment errors | Configure backend/.env file |

## Development Workflow

```bash
# 1. First time
npm run deploy:interactive → Option 1

# 2. Daily development
npm run dev

# 3. After git pull
npm run deploy:interactive → Option 5

# 4. Before committing
npm run deploy:interactive → Option 7 (Test Build)
```

## Production Deployment Workflow

```bash
# 1. Build for production
npm run deploy:interactive → Option 3

# 2. Deploy (choose one):
#    - Docker: Option 4
#    - Manual: Follow DEPLOYMENT.md
#    - Hosting: Upload frontend/dist/
```

---

**For complete documentation, see:** [INTERACTIVE_DEPLOYMENT.md](INTERACTIVE_DEPLOYMENT.md)
