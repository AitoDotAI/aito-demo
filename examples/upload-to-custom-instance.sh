#!/bin/bash

# Example: Upload data to your custom Aito.ai instance
# 
# Usage:
#   chmod +x examples/upload-to-custom-instance.sh
#   ./examples/upload-to-custom-instance.sh

set -e  # Exit on any error

echo "🚀 Uploading Aito Grocery Store Demo Data to Custom Instance"
echo "============================================================"

# Check if environment variables are set
if [ -z "$AITO_URL" ]; then
    echo "❌ AITO_URL environment variable is not set"
    echo "   Example: export AITO_URL='https://your-instance.aito.app'"
    exit 1
fi

if [ -z "$AITO_API_KEY" ]; then
    echo "❌ AITO_API_KEY environment variable is not set"
    echo "   Example: export AITO_API_KEY='your-read-write-api-key'"
    exit 1
fi

echo "✅ Configuration:"
echo "   Aito URL: $AITO_URL"
echo "   API Key: ${AITO_API_KEY:0:10}..."
echo ""

# Step 1: Test connectivity with dry run
echo "🧪 Step 1: Testing upload process (dry run)..."
npm run upload-data:dry-run

if [ $? -ne 0 ]; then
    echo "❌ Dry run failed. Please check your configuration."
    exit 1
fi

echo ""
echo "✅ Dry run successful!"
echo ""

# Step 2: Confirm upload
read -p "🔄 Proceed with actual data upload? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Upload cancelled by user."
    exit 0
fi

# Step 3: Upload data
echo "📤 Step 2: Uploading data to Aito instance..."
npm run upload-data

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Success! Data uploaded successfully to your Aito instance."
    echo ""
    echo "Next steps:"
    echo "1. Update your application configuration to use: $AITO_URL"
    echo "2. Test the application with your new data"
    echo "3. Verify data integrity with sample queries"
    echo ""
    echo "Your Aito Grocery Store demo is ready! 🛒"
else
    echo "❌ Upload failed. Check the logs above for details."
    exit 1
fi