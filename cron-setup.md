# Cron Job Setup for Notion Article Fetcher

This guide explains how to set up a cron job to automatically fetch new articles from your Notion database.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in your project root with:
   ```bash
   NOTION_API_KEY=your_notion_integration_token_here
   NOTION_DATABASE_ID=your_notion_database_id_here
   ```

2. **Notion Integration Setup**:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Copy the "Internal Integration Token" to your `.env` file as `NOTION_API_KEY`
   - Share your database with the integration (click "Share" on your database page)

3. **Database ID**: 
   - Open your Notion database in a browser
   - The URL will look like: `https://www.notion.so/your-workspace/DATABASE_ID?v=...`
   - Copy the `DATABASE_ID` part to your `.env` file

## Installation

1. **Install Python dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Test the script manually**:
   ```bash
   python3 notion_article_fetcher.py
   ```

## Cron Job Setup

### Option 1: Run every hour
```bash
# Edit your crontab
crontab -e

# Add this line to run every hour
0 * * * * /path/to/your/project/fetch_articles.sh
```

### Option 2: Run every 30 minutes
```bash
# Add this line to run every 30 minutes
*/30 * * * * /path/to/your/project/fetch_articles.sh
```

### Option 3: Run every 6 hours
```bash
# Add this line to run every 6 hours
0 */6 * * * /path/to/your/project/fetch_articles.sh
```

### Option 4: Run daily at 9 AM
```bash
# Add this line to run daily at 9 AM
0 9 * * * /path/to/your/project/fetch_articles.sh
```

## Important Notes

1. **Full Paths**: Always use full paths in cron jobs. Replace `/path/to/your/project/` with the actual path to your project directory.

2. **Environment Variables**: The `fetch_articles.sh` script will load your `.env` file automatically.

3. **Logging**: Check the `fetch_articles.log` file for execution logs and any errors.

4. **Permissions**: Make sure the script is executable:
   ```bash
   chmod +x fetch_articles.sh
   ```

## Troubleshooting

### Check if cron is running:
```bash
# View current cron jobs
crontab -l

# Check cron logs (on macOS)
tail -f /var/log/system.log | grep cron

# Check cron logs (on Linux)
tail -f /var/log/cron
```

### Test the script manually:
```bash
# Run the shell script directly
./fetch_articles.sh

# Check the log file
tail -f fetch_articles.log
```

### Common Issues:

1. **Permission Denied**: Make sure the script is executable (`chmod +x fetch_articles.sh`)
2. **Python not found**: The script uses `python3` - make sure it's installed and in PATH
3. **Missing .env file**: Create the `.env` file with your Notion credentials
4. **Database not shared**: Make sure your Notion database is shared with your integration

## File Structure

After setup, your project should have:
```
your-project/
├── notion_article_fetcher.py    # Main Python script
├── fetch_articles.sh            # Shell script for cron
├── requirements.txt             # Python dependencies
├── article_tracking.json        # Tracks processed articles
├── fetch_articles.log          # Execution logs
├── .env                        # Your environment variables (create this)
└── _site/                      # Generated HTML articles
    └── [article-slug]/
        └── index.html
```

## Manual Execution

You can also run the fetcher manually:

```bash
# Activate virtual environment
source venv/bin/activate

# Run the fetcher
python3 notion_article_fetcher.py

# Or use the shell script
./fetch_articles.sh
```
