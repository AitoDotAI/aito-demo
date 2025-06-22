#!/usr/bin/env node

/**
 * Aito.ai Data Upload Script
 * 
 * This script uploads the schema and data files to an Aito.ai instance.
 * It handles both JSON and NDJSON formats, with special handling for large files.
 * 
 * Usage:
 *   node upload-data.js [--dry-run] [--skip-schema] [--only-table=tablename]
 * 
 * Environment Variables:
 *   AITO_URL - Aito instance URL (default: uses config.js)
 *   AITO_API_KEY - Aito API key (default: uses config.js)
 *   AITO_READ_WRITE_KEY - Read-write API key if different from API key
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Import configuration
const config = require('./src/config.js');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipSchema = args.includes('--skip-schema');
const onlyTable = args.find(arg => arg.startsWith('--only-table='))?.split('=')[1];

// Configuration
const AITO_URL = process.env.AITO_URL || config.aito.url;
const AITO_API_KEY = process.env.AITO_READ_WRITE_KEY || process.env.AITO_API_KEY || config.aito.apiKey;
const DATA_DIR = path.join(__dirname, 'src/data');
const MAX_BATCH_SIZE = 8 * 1024 * 1024; // 8MB limit for batch uploads

// API endpoints
const ENDPOINTS = {
  schema: '/api/v1/schema',
  batch: (table) => `/api/v1/data/${table}/batch`,
  upload: (table) => `/api/v1/data/${table}/file`,
  health: '/api/v1/health'
};

// HTTP client with proper configuration
const apiClient = axios.create({
  timeout: 120000, // 2 minutes timeout
  headers: {
    'x-api-key': AITO_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Table upload configuration
const TABLE_CONFIG = {
  users: { file: 'users.json', method: 'batch' },
  products: { file: 'products.json', method: 'batch' },
  visits: { file: 'visits.json', method: 'batch' },
  contexts: { file: 'contexts.json', method: 'batch' },
  impressions: { file: 'impressions.ndjson', method: 'file' }, // Use NDJSON for large dataset
  prompts: { file: 'prompts.json', method: 'batch' },
  questions: { file: 'questions.json', method: 'batch' },
  answers: { file: 'answers.json', method: 'batch' },
  employees: { file: 'employees.json', method: 'batch' },
  glCodes: { file: 'glCodes.json', method: 'batch' },
  invoices: { file: 'invoices.json', method: 'batch' }
};

/**
 * Utility functions
 */
function log(message, ...args) {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

function error(message, ...args) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check API health and connectivity
 */
async function checkHealth() {
  try {
    log('Checking API connectivity...');
    const response = await apiClient.get(`${AITO_URL}${ENDPOINTS.health}`);
    log('✓ API is healthy:', response.data);
    return true;
  } catch (err) {
    error('✗ API health check failed:', err.message);
    if (err.response) {
      error('Response status:', err.response.status);
      error('Response data:', err.response.data);
    }
    return false;
  }
}

/**
 * Upload schema to Aito
 */
async function uploadSchema() {
  if (skipSchema) {
    log('Skipping schema upload (--skip-schema)');
    return true;
  }

  try {
    const schemaPath = path.join(DATA_DIR, 'schema.json');
    
    if (!fs.existsSync(schemaPath)) {
      error('Schema file not found:', schemaPath);
      return false;
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    if (isDryRun) {
      log('DRY RUN: Would upload schema with tables:', Object.keys(schema.schema || {}));
      return true;
    }

    log('Uploading schema...');
    const response = await apiClient.put(`${AITO_URL}${ENDPOINTS.schema}`, schema);
    log('✓ Schema uploaded successfully');
    
    return true;
  } catch (err) {
    error('✗ Schema upload failed:', err.message);
    if (err.response) {
      error('Response status:', err.response.status);
      error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Upload data using batch API (for smaller datasets)
 */
async function uploadBatch(tableName, data) {
  try {
    const endpoint = `${AITO_URL}${ENDPOINTS.batch(tableName)}`;
    
    if (isDryRun) {
      log(`DRY RUN: Would upload ${data.length} records to ${tableName} via batch API`);
      return true;
    }

    log(`Uploading ${data.length} records to ${tableName} via batch API...`);
    
    const response = await apiClient.post(endpoint, data);
    log(`✓ Successfully uploaded ${data.length} records to ${tableName}`);
    
    return true;
  } catch (err) {
    error(`✗ Batch upload failed for ${tableName}:`, err.message);
    if (err.response) {
      error('Response status:', err.response.status);
      error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Upload data using file API (for larger datasets like NDJSON)
 */
async function uploadFile(tableName, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      error(`File not found: ${filePath}`);
      return false;
    }

    const stats = fs.statSync(filePath);
    const fileSize = formatBytes(stats.size);
    
    if (isDryRun) {
      log(`DRY RUN: Would upload file ${filePath} (${fileSize}) to ${tableName} via file API`);
      return true;
    }

    log(`Uploading file ${filePath} (${fileSize}) to ${tableName} via file API...`);
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(`${AITO_URL}${ENDPOINTS.upload(tableName)}`, formData, {
      headers: {
        'x-api-key': AITO_API_KEY,
        ...formData.getHeaders()
      },
      timeout: 300000, // 5 minutes for large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    log(`✓ Successfully uploaded file to ${tableName}`);
    return true;
    
  } catch (err) {
    error(`✗ File upload failed for ${tableName}:`, err.message);
    if (err.response) {
      error('Response status:', err.response.status);
      error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Upload data for a specific table
 */
async function uploadTable(tableName) {
  const tableConfig = TABLE_CONFIG[tableName];
  
  if (!tableConfig) {
    error(`Unknown table: ${tableName}`);
    return false;
  }

  const filePath = path.join(DATA_DIR, tableConfig.file);
  
  if (!fs.existsSync(filePath)) {
    error(`Data file not found: ${filePath}`);
    return false;
  }

  const stats = fs.statSync(filePath);
  log(`Processing ${tableName} (${formatBytes(stats.size)})...`);

  if (tableConfig.method === 'file') {
    // Use file upload API for large files (like NDJSON)
    return await uploadFile(tableName, filePath);
  } else {
    // Use batch API for smaller JSON files
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      if (!Array.isArray(data)) {
        error(`Data file ${filePath} must contain a JSON array`);
        return false;
      }

      // Check if data is too large for batch API
      const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      if (dataSize > MAX_BATCH_SIZE) {
        log(`Data size (${formatBytes(dataSize)}) exceeds batch limit, switching to file upload...`);
        return await uploadFile(tableName, filePath);
      }

      return await uploadBatch(tableName, data);
      
    } catch (parseErr) {
      error(`Failed to parse JSON file ${filePath}:`, parseErr.message);
      return false;
    }
  }
}

/**
 * Main upload process
 */
async function main() {
  log('Starting Aito.ai data upload process...');
  
  if (isDryRun) {
    log('DRY RUN MODE - No actual uploads will be performed');
  }

  // Check configuration
  log('Configuration:');
  log('  Aito URL:', AITO_URL);
  log('  API Key:', AITO_API_KEY ? '***configured***' : 'NOT SET');
  log('  Data Directory:', DATA_DIR);

  if (!AITO_API_KEY) {
    error('API key not configured. Set AITO_API_KEY environment variable or check config.js');
    process.exit(1);
  }

  // Check API connectivity
  if (!isDryRun && !(await checkHealth())) {
    error('Cannot connect to Aito API, aborting upload');
    process.exit(1);
  }

  // Upload schema first
  if (!(await uploadSchema())) {
    error('Schema upload failed, aborting data upload');
    process.exit(1);
  }

  // Determine which tables to upload
  const tablesToUpload = onlyTable 
    ? [onlyTable] 
    : Object.keys(TABLE_CONFIG);

  log(`Uploading ${tablesToUpload.length} tables: ${tablesToUpload.join(', ')}`);

  // Upload tables in dependency order (users and products first)
  const uploadOrder = [
    'users', 'products', 'employees', 'glCodes', 'answers',
    'visits', 'contexts', 'impressions', 'prompts', 'questions', 'invoices'
  ].filter(table => tablesToUpload.includes(table));

  let successCount = 0;
  let failureCount = 0;

  for (const tableName of uploadOrder) {
    try {
      if (await uploadTable(tableName)) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (err) {
      error(`Unexpected error uploading ${tableName}:`, err.message);
      failureCount++;
    }
    
    // Small delay between uploads
    if (!isDryRun) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  log('\n=== Upload Summary ===');
  log(`Successful uploads: ${successCount}`);
  log(`Failed uploads: ${failureCount}`);
  log(`Total tables processed: ${successCount + failureCount}`);

  if (failureCount > 0) {
    error('Some uploads failed. Check the logs above for details.');
    process.exit(1);
  } else {
    log('✓ All uploads completed successfully!');
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(err => {
    error('Unexpected error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = {
  uploadSchema,
  uploadTable,
  checkHealth
};