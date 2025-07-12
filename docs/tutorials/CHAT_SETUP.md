# Chat System Setup Guide

## Overview

The chat system uses a microbackend architecture to keep OpenAI API keys secure. The frontend communicates with a Node.js/Express backend that handles all OpenAI API calls.

## Architecture

```
Frontend (React) ──HTTP──> Backend (Express) ──API──> Azure OpenAI
```

- **Frontend**: React components that send chat requests to backend
- **Backend**: Express.js server that securely handles OpenAI API calls
- **Azure OpenAI**: GPT-4.1 model for chat completion with function calling

## Quick Start

### Option 1: Run Both Services Together (Recommended)
```bash
npm run start:dev
```
This starts both the backend (port 3001) and frontend (port 3000) concurrently.

### Option 2: Run Services Separately
```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start frontend
npm start
```

## Environment Configuration

Ensure your `.env` file contains the Azure OpenAI configuration:

```env
REACT_APP_OPENAI_MODEL_API_KEY=your_azure_openai_api_key
REACT_APP_OPENAI_MODEL_URL=https://your-resource.openai.azure.com
REACT_APP_OPENAI_MODEL_API_VERSION=2024-02-15-preview
REACT_APP_OPENAI_MODEL_DEPLOYMENT=your_gpt4_deployment_name
REACT_APP_OPENAI_MODEL_NAME=gpt-4

# Optional: Custom backend URL (defaults to http://localhost:3001)
REACT_APP_CHAT_BACKEND_URL=http://localhost:3001
```

## API Endpoints

### Backend Server (Port 3001)

- `GET /health` - Health check endpoint
- `POST /api/chat/completions` - Chat completion endpoint
- `GET /api/models` - List available models (debugging)

### Frontend Usage

The frontend automatically routes chat requests through the backend. No additional configuration needed.

## Security Features

- ✅ API keys stored server-side only
- ✅ CORS protection
- ✅ Request timeout handling
- ✅ Error boundary protection
- ✅ Input validation

## Chat Features

### Customer Chat Tools
- Product search with personalization
- Smart recommendations based on user preferences
- Search suggestions and autocomplete
- Shopping list assistance
- General grocery store help

### Admin Chat Tools
- User analytics and behavior insights
- Product performance metrics
- Inventory management insights
- Customer support analytics
- Business intelligence reports

## Troubleshooting

### Backend Not Starting
1. Check if port 3001 is available
2. Verify environment variables are set
3. Ensure OpenAI package is installed: `npm install`

### Frontend Can't Connect to Backend
1. Verify backend is running on port 3001
2. Check `REACT_APP_CHAT_BACKEND_URL` environment variable
3. Look for CORS errors in browser console

### Azure OpenAI 404 Error (Most Common Issue)

**Error**: `404 Resource not found`

This usually means incorrect Azure OpenAI endpoint configuration. Follow these steps:

#### Step 1: Verify Your Azure OpenAI Resource
1. Go to Azure Portal → Your OpenAI resource
2. Note down:
   - **Resource name** (e.g., `my-openai-resource`)
   - **Endpoint URL** (e.g., `https://my-openai-resource.openai.azure.com`)
   - **API key** (from Keys section)
   - **Deployment name** (from Model deployments section)

#### Step 2: Configure Environment Variables

**Option A: Using Full URL**
```env
REACT_APP_OPENAI_MODEL_URL="https://your-resource-name.openai.azure.com"
REACT_APP_OPENAI_MODEL_API_KEY="your-32-character-api-key"
REACT_APP_OPENAI_MODEL_DEPLOYMENT="your-deployment-name"
REACT_APP_OPENAI_MODEL_API_VERSION="2024-02-15-preview"
```

**Option B: Using Resource Name**
```env
REACT_APP_OPENAI_RESOURCE_NAME="your-resource-name"
REACT_APP_OPENAI_MODEL_API_KEY="your-32-character-api-key"
REACT_APP_OPENAI_MODEL_DEPLOYMENT="your-deployment-name"
REACT_APP_OPENAI_MODEL_API_VERSION="2024-02-15-preview"
```

#### Step 3: Common Configuration Mistakes

❌ **Wrong deployment name**
- Don't use model name like "gpt-4"
- Use your actual deployment name from Azure (e.g., "my-gpt4-deployment")

❌ **Wrong URL format**
```env
# WRONG - missing https:// or wrong domain
REACT_APP_OPENAI_MODEL_URL="my-resource.openai.azure.com"
REACT_APP_OPENAI_MODEL_URL="https://my-resource.azure.com"

# CORRECT
REACT_APP_OPENAI_MODEL_URL="https://my-resource.openai.azure.com"
```

❌ **Old API version**
- Use `2024-02-15-preview` or newer
- Check Azure docs for latest version

#### Step 4: Test Configuration
```bash
# Restart backend to reload environment variables
npm run start:backend

# Check logs for "✅ Azure OpenAI client initialized successfully"
# If you see "❌ Failed to initialize", check the error message
```

### Other OpenAI API Errors
1. **Authentication failed (401)** - Invalid API key
2. **Rate limit exceeded (429)** - Too many requests, wait and retry
3. **Quota exceeded (429)** - Check your Azure billing/quota
4. **Model not found (404)** - Wrong deployment name

### Common Error Messages

- `"Chat backend is not available"` - Backend server not running
- `"Azure OpenAI client not properly configured"` - Check environment variables
- `"Authentication failed"` - Invalid API key
- `"Model deployment not found"` - Wrong deployment name
- `"Rate limit exceeded"` - Too many requests, wait and retry

## Development Notes

### Adding New Tools
1. Add tool definition to `customerTools.js` or `adminTools.js`
2. Implement tool execution function
3. Update system prompts if needed
4. No backend changes required

### Modifying Chat Behavior
- Edit system prompts in tool files
- Adjust temperature/max_tokens in backend
- Modify tool calling logic in chat components

### Testing
```bash
# Test backend health
curl http://localhost:3001/health

# Test chat completion
curl -X POST http://localhost:3001/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use environment variables for configuration
3. Set up proper logging and monitoring
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL/TLS certificates
6. Use process manager (PM2, systemd)

Example production start:
```bash
NODE_ENV=production PORT=3001 node server.js
```