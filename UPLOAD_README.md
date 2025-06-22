# Aito.ai Data Upload Guide

This guide explains how to upload the demo data to your own Aito.ai instance.

## Prerequisites

1. **Aito.ai Instance**: You need a running Aito.ai instance
2. **API Keys**: Read-write API key for your Aito instance
3. **Dependencies**: Run `npm install` to ensure all dependencies are available

## Quick Start

### 1. Configure Your Aito Instance

Set your Aito instance URL and API key:

```bash
# Option 1: Environment variables
export AITO_URL="https://your-instance.aito.app"
export AITO_API_KEY="your-read-write-api-key"

# Option 2: Update src/config.js (not recommended for production)
```

### 2. Test the Upload (Dry Run)

Before uploading real data, test the process:

```bash
npm run upload-data:dry-run
```

This will:
- ✅ Check API connectivity
- ✅ Validate all data files
- ✅ Show what would be uploaded
- ✅ Estimate upload sizes and methods

### 3. Upload All Data

```bash
npm run upload-data
```

This will upload:
1. **Schema** (table definitions and relationships)
2. **Reference Data** (users, products, employees, etc.)
3. **Transactional Data** (visits, contexts, impressions)
4. **ML Training Data** (prompts, questions, answers, invoices)

## Advanced Usage

### Upload Specific Tables

```bash
# Upload only the products table
node upload-data.js --only-table=products

# Upload only the schema
node upload-data.js --skip-schema --only-table=users
```

### Skip Schema Upload

If your schema is already configured:

```bash
node upload-data.js --skip-schema
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AITO_URL` | Your Aito instance URL | Uses `src/config.js` |
| `AITO_API_KEY` | Your API key | Uses `src/config.js` |
| `AITO_READ_WRITE_KEY` | Read-write key (if different) | Uses `AITO_API_KEY` |

## Data Upload Details

### Schema Structure

The schema defines 11 tables with the following relationships:

```
Core E-commerce Flow:
users → visits → contexts → impressions → products

Enterprise Workflow:
employees ← invoices → glCodes

Support System:
prompts/questions → answers → employees
```

### Upload Methods

| Table | Records | Size | Method | Notes |
|-------|---------|------|--------|-------|
| impressions | 90,087 | ~15MB | File Upload | NDJSON format for efficiency |
| contexts | 5,290 | ~2MB | Batch API | JSON array |
| visits | 736 | ~200KB | Batch API | JSON array |
| prompts | 350 | ~150KB | Batch API | JSON array |
| questions | 150 | ~50KB | Batch API | JSON array |
| invoices | 100 | ~80KB | Batch API | JSON array |
| users | 67 | ~10KB | Batch API | JSON array |
| answers | 50 | ~15KB | Batch API | JSON array |
| products | 42 | ~15KB | Batch API | JSON array |
| employees | 10 | ~2KB | Batch API | JSON array |
| glCodes | 10 | ~1KB | Batch API | JSON array |

### File Upload vs Batch API

- **File Upload**: Used for large datasets (>8MB). Supports NDJSON format.
- **Batch API**: Used for smaller datasets. Requires JSON arrays.

The script automatically chooses the appropriate method based on file size.

## Troubleshooting

### Common Issues

**1. API Key Authentication**
```
Error: 401 Unauthorized
```
- Verify your API key has read-write permissions
- Check that `AITO_API_KEY` is set correctly

**2. Schema Conflicts**
```
Error: Schema validation failed
```
- Ensure your Aito instance is empty or compatible
- Use `--skip-schema` if schema is already configured

**3. File Not Found**
```
Error: Data file not found
```
- Verify all data files exist in `src/data/`
- Check file permissions

**4. Network Timeouts**
```
Error: Request timeout
```
- Large file uploads may take time (up to 5 minutes)
- Check your network connection
- Verify Aito instance is responsive

### Debugging

Enable verbose logging:

```bash
# Add debug logging
DEBUG=* node upload-data.js --dry-run
```

Check specific table:

```bash
# Test single table upload
node upload-data.js --only-table=users --dry-run
```

## Data Validation

After upload, verify your data:

```bash
# Check table counts (you can run this in your Aito console)
{
  "from": "impressions",
  "select": ["$count"]
}

# Verify relationships
{
  "from": "impressions", 
  "where": {"context.user": "larry"},
  "limit": 5
}
```

Expected counts:
- impressions: 90,087
- contexts: 5,290  
- visits: 736
- prompts: 350
- questions: 150
- invoices: 100
- users: 67
- answers: 50
- products: 42
- employees: 10
- glCodes: 10

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Verify your Aito instance URL is correct
- Monitor API usage and costs

## Performance Tips

- Upload reference data (users, products) first
- Large files (impressions) are uploaded last
- Use `--dry-run` to test before real uploads
- Monitor upload progress in the console

## Next Steps

After successful upload:

1. **Verify Data**: Check record counts and relationships
2. **Test Queries**: Run sample queries to verify functionality  
3. **Update Config**: Point your application to the new instance
4. **Monitor Usage**: Track API usage and performance

The demo application should now work with your Aito instance!