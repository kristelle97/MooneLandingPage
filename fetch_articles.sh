#!/bin/bash

# Notion Article Fetcher - Cron Job Script
# This script fetches new articles from Notion and generates HTML files

# Set the working directory to the script's location
cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the article fetcher using Node.js
echo "$(date): Starting article fetch from Notion..." >> fetch_articles.log
node notion_article_fetcher.js >> fetch_articles.log 2>&1

# Check if the script was successful
if [ $? -eq 0 ]; then
    echo "$(date): Article fetch completed successfully" >> fetch_articles.log
    
    # Rebuild the site if using Eleventy
    if command -v npx &> /dev/null; then
        echo "$(date): Rebuilding site..." >> fetch_articles.log
        npm run build >> fetch_articles.log 2>&1
    fi
else
    echo "$(date): Article fetch failed" >> fetch_articles.log
fi

echo "$(date): Cron job completed" >> fetch_articles.log
