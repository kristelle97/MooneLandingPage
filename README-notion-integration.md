# Notion Article Integration

This system automatically fetches articles from your Notion database and generates HTML files for your website.

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Notion credentials
   ```

2. **Install Node.js dependencies** (already done if you ran npm install):
   ```bash
   npm install
   ```

3. **Test the fetcher**:
   ```bash
   npm run fetch-articles
   # or directly:
   # npm run fetch-articles-direct
   # or manually:
   # node notion_article_fetcher.js
   ```

4. **Set up automated fetching**:
   - Follow the instructions in `cron-setup.md`
   - Use the examples in `example.crontab`

## How It Works

### Article Tracking
- `article_tracking.json` stores processed articles and their publication dates
- Only articles with newer publication dates are fetched and processed
- Prevents duplicate processing on each run

### Article Processing
1. **Fetch**: Gets articles from Notion database via API
2. **Filter**: Only processes articles newer than the last processed date
3. **Generate**: Creates HTML files using your site's template
4. **Track**: Updates the tracking file with new articles
5. **Sitemap**: Automatically updates sitemap.xml with new articles

### File Structure
```
Generated articles are saved as:
_site/[article-slug]/index.html
```

The slug is either:
- The "Slug" field from your Notion database, or  
- Auto-generated from the article title (lowercase, hyphenated)

## Notion Database Schema

Your Notion database should have these columns:

| Column Name | Type | Description |
|-------------|------|-------------|
| Title | Text | Article title |
| Article | Rich Text | Full article content |
| Meta description | Text | SEO meta description |
| Slug | Text | URL slug (optional - auto-generated if empty) |
| Publish date | Date | Publication date |

## Environment Variables

Create a `.env` file with:

```bash
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

### Getting Your Notion Credentials

1. **Integration Token**:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Copy the "Internal Integration Token"

2. **Database ID**:
   - Open your database in Notion
   - Copy the ID from the URL: `notion.so/workspace/DATABASE_ID?v=...`

3. **Share Database**:
   - In your Notion database, click "Share"
   - Invite your integration by name

## Automation Options

### Cron Job (Recommended)
```bash
# Run every hour
0 * * * * /path/to/your/project/fetch_articles.sh

# Run every 30 minutes  
*/30 * * * * /path/to/your/project/fetch_articles.sh
```

### GitHub Actions
You could also set this up to run via GitHub Actions on a schedule.

### Manual Execution
```bash
# Run the fetcher
npm run fetch-articles

# Check logs
tail -f fetch_articles.log
```

## Troubleshooting

### Common Issues

1. **"No new articles"**: Check that:
   - Articles have publication dates
   - Publication dates are newer than the last sync
   - Database is shared with your integration

2. **"Permission denied"**: 
   - Check your Notion integration has access
   - Verify the database is shared with the integration

3. **"Missing environment variables"**:
   - Ensure `.env` file exists with correct credentials
   - Check the variable names match exactly

### Debugging

1. **Check tracking file**:
   ```bash
   cat article_tracking.json
   ```

2. **View logs**:
   ```bash
   tail -f fetch_articles.log
   ```

3. **Test manually**:
   ```bash
   source venv/bin/activate
   python3 notion_article_fetcher.py
   ```

## Advanced Configuration

### Custom Content Formatting
Edit the `format_article_content()` method in `notion_article_fetcher.py` to customize how your Notion content is converted to HTML.

### Template Customization  
The HTML template is embedded in the `generate_html_content()` method. You can modify it to match your site's design.

### Different Output Directory
Change the `OUTPUT_DIR` variable in the Python script to save articles elsewhere.

## Integration with Your Build Process

The `fetch_articles.sh` script automatically runs `npm run build` after fetching new articles, so your site is rebuilt with the new content.

You can customize this behavior by editing the shell script.
