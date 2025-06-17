#!/bin/sh
# Health check script for Docker container

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "nginx is not running"
    exit 1
fi

# Check if the application responds
if ! wget --no-verbose --tries=1 --spider http://localhost/health; then
    echo "Health check endpoint failed"
    exit 1
fi

echo "Health check passed"
exit 0