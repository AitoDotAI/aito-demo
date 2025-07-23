# Chat Assistant Migration Guide

This guide explains the migration from client-side OpenAI calls to secure server-side assistant endpoints.

## Summary of Changes

### Before (Insecure)
- Frontend made direct OpenAI API calls via backend proxy
- Tools executed in browser with frontend state
- OpenAI API key exposed through generic proxy endpoint

### After (Secure)
- Frontend sends messages to specific assistant endpoints
- Server executes tools and manages OpenAI calls
- No OpenAI API exposure to public

## Architecture Changes

### Old Flow
```
Frontend → /api/chat/completions (generic proxy) → OpenAI
Frontend → Execute tools locally → Display results
```

### New Flow
```
Frontend → /api/assistant/customer or /api/assistant/admin → Server
Server → Execute tools → OpenAI → Return complete response
```

## File Changes

### New Files
- `shared/tools/customerTools.js` - Customer tools (moved from src/services/chatTools/)
- `shared/tools/adminTools.js` - Admin tools (moved from src/services/chatTools/)
- `src/services/assistantClient.js` - Simple client for new endpoints

### Modified Files
- `server.js` - Added secure assistant endpoints
- Chat components will be updated to use assistantClient

### Unchanged Files (Demo Clarity)
- `src/01-recommend.js` through `src/09-product.js` - Core Aito.ai examples remain untouched
- All numbered demo files stay simple and readable for HN audience

## Migration Steps for Components

### 1. Replace OpenAI Client Usage

**Before:**
```javascript
import { callOpenAI } from '../services/openai';

const result = await callOpenAI(messages, tools);
```

**After:**
```javascript
import assistantClient from '../services/assistantClient';

const result = await assistantClient.sendCustomerMessage(message, context);
```

### 2. Update Context Passing

**Before:**
```javascript
// Context managed in component state
const [userId, setUserId] = useState('larry');
const [cart, setCart] = useState([]);
```

**After:**
```javascript
// Context passed to backend
const context = {
  userId: selectedUser,
  cartItems: cart.map(item => ({ id: item.id, name: item.name })),
  currentPage: window.location.pathname
};

const result = await assistantClient.sendCustomerMessage(message, context);
```

### 3. Simplify Tool Execution

**Before:**
```javascript
// Complex tool execution logic in frontend
if (toolCalls) {
  for (const toolCall of toolCalls) {
    const result = await executeCustomerTool(toolCall.function.name, params, userId, cart);
    // Handle result...
  }
}
```

**After:**
```javascript
// Server handles all tool execution
const result = await assistantClient.sendCustomerMessage(message, context);
// result.response contains the final assistant response
```

## Component Migration Examples

### ChatWidget Component

**Before:**
```javascript
const handleSubmit = async (input) => {
  const messages = buildMessages(input);
  const tools = CUSTOMER_TOOLS;
  
  const result = await callOpenAI(messages, tools);
  
  if (result.tool_calls) {
    // Execute tools locally
    for (const toolCall of result.tool_calls) {
      const toolResult = await executeCustomerTool(...);
      // Process result
    }
  }
};
```

**After:**
```javascript
const handleSubmit = async (input) => {
  const context = {
    userId: props.userId,
    cartItems: props.cart,
    currentPage: window.location.pathname
  };
  
  const result = await assistantClient.sendCustomerMessage(input, context);
  
  if (result.success) {
    setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
  } else {
    // Handle error
  }
};
```

## Benefits of New Architecture

### Security
- ✅ No OpenAI API key exposure
- ✅ Server-side validation and rate limiting
- ✅ Controlled access to tools and data

### Performance
- ✅ Reduced client-side complexity
- ✅ Server-side tool execution
- ✅ Centralized error handling

### Maintainability
- ✅ Single source of truth for tools
- ✅ Easier debugging and monitoring
- ✅ Simplified frontend logic

### Demo Clarity (Key for HN)
- ✅ Numbered files (01-09) remain unchanged
- ✅ Core Aito.ai examples stay simple
- ✅ Clean separation between demo and chat features

## Testing the Migration

### 1. Test New Endpoints
```bash
# Test customer assistant
curl -X POST http://localhost:3001/api/assistant/customer \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "context": {"userId": "larry"}}'

# Test admin assistant  
curl -X POST http://localhost:3001/api/assistant/admin \
  -H "Content-Type: application/json" \
  -d '{"message": "Show user analytics", "context": {}}'
```

### 2. Verify Frontend Integration
- Check that chat components load without errors
- Verify messages are sent and responses received
- Test with different user contexts

### 3. Monitor Logs
- Server logs show incoming requests
- No OpenAI errors in browser console
- Clean error handling for failed requests

## Rollback Plan

If issues arise:
1. Keep the old `/api/chat/completions` endpoint temporarily
2. Add feature flag to switch between old/new systems
3. Gradually migrate components one by one
4. Remove old endpoint only after full migration

## Future Enhancements

### Phase 2: Full Tool Integration
- Import shared tools into server.js
- Execute actual Aito.ai queries server-side
- Return rich tool results to frontend

### Phase 3: Advanced Features
- Streaming responses with Server-Sent Events
- Session management and conversation history
- Advanced rate limiting with Redis
- Comprehensive logging and analytics