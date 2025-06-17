# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please:

1. **Email us**: Send details to security@aito.ai
2. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)
3. **Response time**: We'll respond within 48 hours
4. **Resolution**: We aim to resolve critical issues within 7 days

### 📋 Vulnerability Report Template

```
Subject: [SECURITY] Vulnerability Report - [Brief Description]

**Vulnerability Details:**
- Component affected: 
- Vulnerability type: 
- Severity: [Critical/High/Medium/Low]

**Description:**
[Detailed description of the vulnerability]

**Steps to Reproduce:**
1. 
2. 
3. 

**Impact:**
[What could an attacker accomplish?]

**Suggested Fix:**
[If you have suggestions]

**Environment:**
- Version: 
- Browser: 
- OS: 

**Contact Information:**
- Name: 
- Email: 
- Preferred contact method: 
```

## 🛡️ Security Measures

### Current Security Implementations

#### 1. API Security
- Environment-based API key management
- Request timeout limits
- Rate limiting for API calls
- Input validation and sanitization

#### 2. Frontend Security
- Content Security Policy (CSP) headers
- XSS protection headers
- CSRF protection
- Secure cookie configuration

#### 3. Dependencies
- Regular dependency audits (`npm audit`)
- Automated security scanning with Snyk
- Dependabot security updates
- Pin specific dependency versions

#### 4. Infrastructure
- HTTPS enforcement
- Security headers via nginx/CDN
- Docker container security
- Non-root user in containers

### 🔍 Security Checklist for Contributors

Before submitting code, ensure:

- [ ] No hardcoded secrets or API keys
- [ ] Input validation for user data
- [ ] Proper error handling (no sensitive data leaks)
- [ ] Dependencies are up to date
- [ ] Security headers are preserved
- [ ] Authentication/authorization checks
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention measures

### 🚨 Common Security Issues to Avoid

#### 1. API Key Exposure
```javascript
// ❌ DON'T: Hardcode API keys
const API_KEY = 'sk-1234567890abcdef'

// ✅ DO: Use environment variables
const API_KEY = process.env.REACT_APP_AITO_API_KEY
```

#### 2. XSS Vulnerabilities
```javascript
// ❌ DON'T: Directly inject HTML
element.innerHTML = userInput

// ✅ DO: Use React's built-in escaping
return <div>{userInput}</div>
```

#### 3. Data Validation
```javascript
// ❌ DON'T: Trust user input
const processSearch = (query) => {
  // Direct use without validation
  return searchAPI(query)
}

// ✅ DO: Validate and sanitize
const processSearch = (query) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query')
  }
  
  const sanitizedQuery = sanitizeInput(query)
  return searchAPI(sanitizedQuery)
}
```

## 🔐 Secure Development Guidelines

### 1. Environment Configuration
```bash
# ✅ Use .env files for configuration
REACT_APP_AITO_URL=https://your-instance.aito.app
REACT_APP_AITO_API_KEY=your-secret-key

# ❌ Never commit .env files to git
# Add .env to .gitignore
```

### 2. API Communication
```javascript
// ✅ Implement proper error handling
const apiCall = async (data) => {
  try {
    const response = await axios.post(url, data, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.aito.apiKey
      }
    })
    return response.data
  } catch (error) {
    // Don't expose internal errors to users
    logger.error('API call failed:', error)
    throw new Error('Service temporarily unavailable')
  }
}
```

### 3. Input Sanitization
```javascript
import DOMPurify from 'dompurify'

// ✅ Sanitize user input
const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}
```

### 4. Rate Limiting
```javascript
// ✅ Implement client-side rate limiting
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }
  
  async throttle() {
    const now = Date.now()
    this.requests = this.requests.filter(req => now - req < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded')
    }
    
    this.requests.push(now)
  }
}
```

## 🚀 Deployment Security

### 1. Environment Variables
```yaml
# ✅ Use secrets in CI/CD
env:
  REACT_APP_AITO_URL: ${{ secrets.AITO_URL }}
  REACT_APP_AITO_API_KEY: ${{ secrets.AITO_API_KEY }}
```

### 2. Content Security Policy
```nginx
# ✅ Implement CSP headers
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.aito.app" always;
```

### 3. HTTPS Enforcement
```yaml
# ✅ Force HTTPS in production
netlify.toml:
  force_ssl = true
  
docker-compose.yml:
  labels:
    - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
```

## 🔧 Security Tools

### Automated Security Scanning

We use the following tools:

- **Snyk**: Dependency vulnerability scanning
- **npm audit**: Built-in dependency security check
- **ESLint Security Plugin**: Static code analysis
- **GitHub Security Advisories**: Automated vulnerability alerts

### Manual Security Testing

Regular security assessments include:

- **OWASP ZAP**: Web application security testing
- **Lighthouse**: Security best practices audit
- **Manual penetration testing**: Quarterly assessments

## 📊 Security Monitoring

### Metrics We Track

- Security vulnerability count
- Time to patch critical issues
- Dependency update frequency
- Security scan results

### Incident Response

In case of a security incident:

1. **Immediate**: Assess impact and contain threat
2. **24 hours**: Notify affected users
3. **48 hours**: Deploy security patch
4. **1 week**: Post-incident review and improvements

## 🏆 Security Bug Bounty

We appreciate security researchers who help improve our security:

### Scope
- This repository and live demo site
- Related infrastructure and dependencies
- User data protection

### Rewards
- Public recognition in our Hall of Fame
- Priority support for future contributions
- Potential monetary rewards for critical findings

### Out of Scope
- Third-party services (Aito.ai infrastructure)
- Social engineering attacks
- Physical attacks
- Denial of service attacks

## 📞 Contact

For security-related questions:

- **Security issues**: security@aito.ai
- **General questions**: opensource@aito.ai
- **Urgent matters**: Include "[URGENT]" in subject line

## 🔄 Updates

This security policy is reviewed quarterly and updated as needed. Last updated: 2024-01-15

---

Thank you for helping keep the Aito Grocery Store Demo secure! 🛡️