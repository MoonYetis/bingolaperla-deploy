# Port Management & Configuration

## 🎯 Port Resolution Summary

**Status**: ✅ **RESOLVED** - Server running successfully on port 3001

## 📋 Current Configuration

- **Backend Server**: `http://localhost:3001`
- **Frontend URL**: `http://localhost:5173` (configured in CORS)
- **Environment**: Development
- **Status**: ✅ Running and healthy

## 🔍 Port Conflict Investigation Results

### What We Found:
1. ✅ Port 3001 is **available** and working correctly
2. ✅ Server starts successfully without conflicts
3. ✅ Health endpoint responds: `http://localhost:3001/health`
4. ✅ Openpay mock configuration working perfectly
5. ⚠️ Redis connection unavailable (expected in development)

### Available Ports Checked:
- `3001`: ✅ Available (currently used)
- `3002`: ✅ Available
- `3003`: ✅ Available
- `3004`: ✅ Available
- `3005`: ✅ Available
- `8000`: ✅ Available
- `8001`: ✅ Available
- `8080`: ✅ Available

## 🔧 How to Change Port (If Needed)

### Method 1: Environment Variable
```bash
# Temporary change
PORT=3002 npm run dev

# Or set in .env file
PORT=3002
```

### Method 2: Update .env File
```env
# Change this line in .env
PORT=3002
NODE_ENV=development

# Update CORS if frontend needs to connect
FRONTEND_URL="http://localhost:5173"
```

### Method 3: Command Line Override
```bash
# Start on specific port
PORT=8000 npm run dev

# Or use different environment
NODE_ENV=test PORT=3003 npm run dev
```

## 📡 Port Verification Commands

### Check Port Availability
```bash
# Method 1: Using netstat
netstat -an | grep :3001

# Method 2: Using lsof (if available)
lsof -i :3001

# Method 3: Using Node.js check
node -e "const net = require('net'); const server = net.createServer(); server.listen(3001, () => { console.log('Port 3001 available'); server.close(); }).on('error', () => console.log('Port 3001 in use'));"
```

### Test Server Health
```bash
# Quick health check
curl http://localhost:3001/health

# Pretty JSON output
curl -s http://localhost:3001/health | jq .

# Test Openpay endpoint (should require auth)
curl http://localhost:3001/api/openpay/health
```

## 🚀 Current Server Status

```
✅ Server started successfully
Port: 3001
Environment: development
Frontend URL: http://localhost:5173
Features: [HTTP, Socket.IO, CORS, Analytics, Reports, Scheduler]

✅ Openpay Mock Mode Active
Merchant ID: mock_merchant_12345
Production: false
Mock Delay: 1000ms
Mock Success Rate: 95%

✅ Database Connections
PostgreSQL: ✅ Connected
Redis: ⚠️ Unavailable (development mode)
```

## 🛠 Troubleshooting Port Issues

### Common Issues & Solutions

1. **"Port already in use" Error**
   ```bash
   # Find what's using the port
   lsof -i :3001
   
   # Kill the process (replace PID)
   kill -9 <PID>
   
   # Or use a different port
   PORT=3002 npm run dev
   ```

2. **Permission Denied (Port < 1024)**
   ```bash
   # Use ports above 1024
   PORT=3001 npm run dev  # ✅ Good
   PORT=80 npm run dev    # ❌ Requires sudo
   ```

3. **Frontend Can't Connect**
   ```bash
   # Update CORS in .env
   FRONTEND_URL="http://localhost:5173"
   
   # Or check frontend configuration
   # Make sure it's pointing to correct backend port
   ```

4. **Multiple Development Servers**
   ```bash
   # Backend
   PORT=3001 npm run dev
   
   # Additional service
   PORT=3002 npm run dev:service
   
   # Testing server
   PORT=3003 NODE_ENV=test npm run dev
   ```

## 📊 Port Usage Recommendations

### Development Ports
- `3000-3009`: Node.js/Express servers
- `5000-5009`: Frontend development servers
- `8000-8009`: Alternative development servers

### Specific Recommendations
- **Backend API**: `3001` (current)
- **Frontend Dev**: `5173` (Vite default)
- **Testing Server**: `3002`
- **Mock Services**: `3003`
- **Documentation**: `8080`

## 🔧 Configuration Files

### .env File Locations
- Main: `/backend/.env`
- Test: `/backend/.env.test`
- Production: `/backend/.env.production`

### Port Configuration Priority
1. Command line: `PORT=3002 npm run dev`
2. Environment file: `.env` → `PORT=3001`
3. Default in code: `process.env.PORT || 3001`

## 📚 Additional Resources

### Useful Commands
```bash
# Verify current configuration
npm run openpay:verify

# Check environment setup
node scripts/verify-openpay-env.js

# View usage examples
npm run openpay:examples

# Health check with monitoring
watch curl -s http://localhost:3001/health
```

### Documentation
- [Openpay Development Setup](./OPENPAY_DEVELOPMENT_SETUP.md)
- [Environment Configuration](../src/config/environment.ts)
- [Development Profiles](../src/config/development.ts)

---

**Current Status**: ✅ **All systems operational on port 3001**

**Next Steps**: Continue development - no port changes needed!