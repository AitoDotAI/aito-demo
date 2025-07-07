# Contributing to Aito Grocery Store Demo

Thank you for your interest in contributing to the Aito Grocery Store Demo! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/aito-demo.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

## 🎯 How to Contribute

### Reporting Bugs

Before submitting a bug report:
- Check if the issue already exists in [GitHub Issues](https://github.com/AitoDotAI/aito-demo/issues)
- Ensure you're using the latest version
- Test with different user personas (Larry, Veronica, Alice)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- User persona: [Larry/Veronica/Alice]
```

### Suggesting Features

We welcome feature suggestions! Please:
- Check existing issues and discussions first
- Explain the use case and business value
- Consider how it fits with Aito.ai's predictive database approach
- Provide mockups or examples if applicable

### Contributing Code

#### Development Setup

```bash
# Clone and setup
git clone https://github.com/AitoDotAI/aito-demo.git
cd aito-demo
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

#### Code Style

We use Prettier and ESLint for code formatting:

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new recommendation algorithm
fix: resolve search results duplication
docs: update API documentation
test: add tests for predictions module
refactor: reorganize API modules
chore: update dependencies
```

#### Testing

- Write tests for new features
- Maintain >80% test coverage
- Test with all user personas
- Include integration tests for API functions

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/api/search.test.js
```

## 📋 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run the full test suite**
6. **Submit a pull request**

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested with all user personas

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🏗️ Architecture Guidelines

### API Integration Patterns

When adding new Aito.ai integrations:

```javascript
// ✅ Good: Clear error handling and documentation
/**
 * Predict product tags based on name
 * @param {string} productName - Product name
 * @returns {Promise<Array>} Predicted tags with confidence scores
 */
export const predictTags = async (productName) => {
  try {
    const response = await axios.post(`${config.aito.url}/api/v1/_predict`, {
      from: 'products',
      where: { name: productName },
      predict: 'tags',
      limit: 10
    }, {
      headers: { 'x-api-key': config.aito.apiKey }
    })
    
    return response.data.hits.filter(tag => tag.$p > 0.5)
  } catch (error) {
    console.error('Tag prediction failed:', error)
    throw new Error('Failed to predict tags')
  }
}

// ❌ Avoid: No error handling, unclear purpose
const getTags = (name) => 
  axios.post(url, { from: 'products', where: { name }, predict: 'tags' })
```

### Component Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Add loading states for async operations
- Include accessibility attributes

```jsx
// ✅ Good: Complete component with error handling
const SearchComponent = ({ userId, onResults }) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleSearch = async (searchTerm) => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await getProductSearchResults(userId, searchTerm)
      onResults(results)
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="search-component">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
        aria-label="Search products"
        disabled={loading}
      />
      {loading && <div>Searching...</div>}
      {error && <div className="error" role="alert">{error}</div>}
    </div>
  )
}
```

## 📚 Documentation

### Code Comments

- Document complex algorithms
- Explain Aito.ai query logic
- Include examples for API functions
- Use JSDoc format for functions

### README Updates

When adding features:
- Update the features list
- Add usage examples
- Update screenshots if UI changes
- Document new environment variables

## 🧪 Testing Guidelines

### Unit Tests

```javascript
// Test API functions
describe('getProductSearchResults', () => {
  test('should return personalized results for user', async () => {
    const mockResponse = { data: { hits: [mockProduct] } }
    mockedAxios.post.mockResolvedValue(mockResponse)
    
    const results = await getProductSearchResults('larry', 'milk')
    
    expect(results).toEqual([mockProduct])
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/_query'),
      expect.objectContaining({
        where: expect.objectContaining({
          'context.user': 'larry'
        })
      }),
      expect.any(Object)
    )
  })
})
```

### Integration Tests

```javascript
// Test user workflows
describe('User Shopping Journey', () => {
  test('should complete personalized shopping flow', async () => {
    render(<App />)
    
    // Select user persona
    await userEvent.selectOptions(screen.getByLabelText(/user/i), 'larry')
    
    // Search for products
    await userEvent.type(screen.getByLabelText(/search/i), 'milk')
    
    // Verify personalized results
    expect(screen.getByText(/lactose-free/i)).toBeInTheDocument()
  })
})
```

## 🔒 Security

- Never commit API keys or secrets
- Validate all user inputs
- Use environment variables for configuration
- Follow OWASP security guidelines
- Report security issues privately

## 🌍 Internationalization

When adding text:
- Use translation keys instead of hardcoded strings
- Consider RTL language support
- Test with different locales
- Update translation files

## 📱 Accessibility

- Use semantic HTML elements
- Include ARIA labels and roles
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

## ⚡ Performance

- Optimize bundle size
- Implement lazy loading
- Use React.memo for expensive components
- Cache API responses appropriately
- Monitor Core Web Vitals

## 🤝 Code Review

Reviewers should check:
- Code follows style guidelines
- Tests are comprehensive
- Documentation is updated
- No security vulnerabilities
- Performance impact is considered
- Accessibility requirements are met

## 🎉 Recognition

Contributors will be:
- Added to the contributors list
- Mentioned in release notes
- Invited to the contributors Discord channel

## 📞 Getting Help

- **Questions**: Use [GitHub Discussions](https://github.com/AitoDotAI/aito-demo/discussions)
- **Bugs**: Create [GitHub Issues](https://github.com/AitoDotAI/aito-demo/issues)
- **Chat**: Join our [Discord community](https://discord.gg/aito-ai)
- **Email**: Contact us at opensource@aito.ai

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for helping make the Aito Grocery Store Demo better! 🚀