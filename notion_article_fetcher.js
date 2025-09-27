#!/usr/bin/env node
/**
 * Notion Article Fetcher
 * Fetches articles from Notion database and generates HTML files for new articles only.
 */

require('dotenv').config();
const fs = require('fs/promises');
const { Client } = require('@notionhq/client');
const path = require('path');

// Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_BLOGPOST_DATABASE_ID;
const TRACKING_FILE = 'article_tracking.json';
const OUTPUT_DIR = 'src/blog/posts';

// Initialize Notion client (same as build-pages.js)
const notion = new Client({
    auth: NOTION_API_KEY
});


class NotionArticleFetcher {
    constructor() {
        if (!NOTION_API_KEY) {
            throw new Error("NOTION_API_KEY environment variable is required");
        }
        if (!NOTION_DATABASE_ID) {
            throw new Error("NOTION_BLOGPOST_DATABASE_ID environment variable is required");
        }
    }

    async loadTrackingData() {
        try {
            const data = await fs.readFile(TRACKING_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return default structure
            return { last_sync: null, articles: {} };
        }
    }

    async saveTrackingData(data) {
        await fs.writeFile(TRACKING_FILE, JSON.stringify(data, null, 2));
    }

    getLastPublicationDate(trackingData) {
        if (!trackingData.articles || Object.keys(trackingData.articles).length === 0) {
            return null;
        }

        const dates = Object.values(trackingData.articles)
            .map(article => article.publish_date)
            .filter(date => date)
            .map(date => new Date(date))
            .filter(date => !isNaN(date));

        return dates.length > 0 ? new Date(Math.max(...dates)) : null;
    }

    async fetchArticlesFromNotion(afterDate = null) {
        const payload = {
            page_size: 100,
            sorts: [
                {
                    property: "Publish date",
                    direction: "descending"
                }
            ]
        };

        // Add filter for articles newer than last publication date
        if (afterDate) {
            payload.filter = {
                property: "Publish date",
                date: {
                    after: afterDate.toISOString()
                }
            };
        }

        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            ...payload
        });

        return response.results;
    }

    async extractArticleData(page) {
        const properties = page.properties;

        // Extract title - try different possible property names
        let title = '';
        
        if (properties.Title?.title?.[0]?.text?.content) {
            title = properties.Title.title[0].text.content;
        } else if (properties.title?.title?.[0]?.text?.content) {
            title = properties.title.title[0].text.content;
        } else if (properties.Name?.title?.[0]?.text?.content) {
            title = properties.Name.title[0].text.content;
        } else {
            // Try to find any title property
            for (const [key, value] of Object.entries(properties)) {
                if (value?.title?.[0]?.text?.content) {
                    title = value.title[0].text.content;
                    break;
                }
            }
        }

        // Extract meta description (convert rich text to plain text for meta tag)
        const metaDescRichText = properties['Meta description']?.rich_text || [];
        const metaDescription = metaDescRichText.map(textObj => textObj.text?.content || '').join('');

        // Extract slug (convert rich text to plain text)
        const slugRichText = properties.Slug?.rich_text || [];
        const slug = slugRichText.map(textObj => textObj.text?.content || '').join('');

        // Extract publish date
        const publishDate = properties['Publish date']?.date?.start || null;

        // Extract cover image from page cover property
        let coverImage = null;
        if (page.cover) {
            if (page.cover.type === 'external') {
                coverImage = page.cover.external?.url;
            } else if (page.cover.type === 'file') {
                coverImage = page.cover.file?.url;
            }
        }

        // Extract article content from page blocks (not from properties)
        let content = '';
        try {
            const response = await notion.blocks.children.list({
                block_id: page.id
            });
            content = await this.convertNotionBlocksToHtml(response.results);
        } catch (error) {
            console.log(`⚠️  Could not fetch content for page ${page.id}: ${error.message}`);
            content = '';
        }

        return {
            id: page.id,
            title,
            metaDescription,
            slug,
            publishDate,
            content,
            coverImage,
            url: page.url
        };
    }

    // Convert rich text array to formatted HTML
    convertRichTextToHtml(richTextArray) {
        if (!richTextArray || richTextArray.length === 0) {
            return '';
        }

        return richTextArray.map(textObj => {
            const { text, annotations, href } = textObj;
            let content = this.escapeHtml(text.content);
            
            // Apply formatting based on annotations
            if (annotations.bold) {
                content = `<strong>${content}</strong>`;
            }
            if (annotations.italic) {
                content = `<em>${content}</em>`;
            }
            if (annotations.strikethrough) {
                content = `<del>${content}</del>`;
            }
            if (annotations.underline) {
                content = `<u>${content}</u>`;
            }
            if (annotations.code) {
                content = `<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">${content}</code>`;
            }
            if (href) {
                content = `<a href="${href}" class="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">${content}</a>`;
            }
            
            return content;
        }).join('');
    }

    // Helper function to close any open list
    closeList(inList) {
        if (inList === 'bulleted') {
            return '</ul>\n';
        } else if (inList === 'numbered') {
            return '</ol>\n';
        }
        return '';
    }

    // Convert Notion blocks to HTML (adapted from build-pages.js)
    async convertNotionBlocksToHtml(blocks) {
        let html = '';
        let inList = false; // false, 'bulleted', or 'numbered'

        for (const block of blocks) {
            switch (block.type) {
                case 'paragraph':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    const text = this.convertRichTextToHtml(block.paragraph.rich_text);
                    if (text.trim()) {
                        html += `<p class="mb-4">${text}</p>\n`;
                    }
                    break;
                case 'heading_1':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    const h1Text = this.convertRichTextToHtml(block.heading_1.rich_text);
                    if (h1Text.trim()) {
                        html += `<h2 class="text-2xl font-semibold mt-8 mb-4">${h1Text}</h2>\n`;
                    }
                    break;
                case 'heading_2':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    const h2Text = this.convertRichTextToHtml(block.heading_2.rich_text);
                    if (h2Text.trim()) {
                        html += `<h3 class="text-xl font-semibold mt-8 mb-4">${h2Text}</h3>\n`;
                    }
                    break;
                case 'heading_3':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    const h3Text = this.convertRichTextToHtml(block.heading_3.rich_text);
                    if (h3Text.trim()) {
                        html += `<h4 class="text-lg font-semibold mt-6 mb-3">${h3Text}</h4>\n`;
                    }
                    break;
                case 'bulleted_list_item':
                    if (inList !== 'bulleted') {
                        if (inList) {
                            html += this.closeList(inList);
                        }
                        html += '<ul class="list-disc ml-6 mb-6">\n';
                        inList = 'bulleted';
                    }
                    const listText = this.convertRichTextToHtml(block.bulleted_list_item.rich_text);
                    if (listText.trim()) {
                        html += `  <li>${listText}</li>\n`;
                    }
                    break;
                case 'numbered_list_item':
                    if (inList !== 'numbered') {
                        if (inList) {
                            html += this.closeList(inList);
                        }
                        html += '<ol class="list-decimal ml-6 mb-6">\n';
                        inList = 'numbered';
                    }
                    const numberedText = this.convertRichTextToHtml(block.numbered_list_item.rich_text);
                    if (numberedText.trim()) {
                        html += `  <li>${numberedText}</li>\n`;
                    }
                    break;
                case 'quote':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    const quoteText = this.convertRichTextToHtml(block.quote.rich_text);
                    if (quoteText.trim()) {
                        html += `<blockquote class="border-l-4 border-purple-500 pl-6 py-4 my-6 bg-purple-50 italic text-gray-700">${quoteText}</blockquote>\n`;
                    }
                    break;
                case 'image':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    // Handle image blocks
                    const imageUrl = block.image.external?.url || block.image.file?.url || '';
                    const caption = block.image.caption?.[0]?.text?.content || '';
                    if (imageUrl) {
                        html += `<figure class="mb-6">\n`;
                        html += `  <img src="${imageUrl}" alt="${this.escapeHtml(caption)}" class="w-full rounded-lg shadow-md">\n`;
                        if (caption) {
                            html += `  <figcaption class="text-sm text-gray-600 mt-2 text-center">${this.escapeHtml(caption)}</figcaption>\n`;
                        }
                        html += `</figure>\n`;
                    }
                    break;
                case 'table':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    // Handle table blocks
                    try {
                        const tableHtml = await this.convertTableToHtml(block);
                        html += tableHtml;
                    } catch (error) {
                        console.log(`⚠️  Could not process table: ${error.message}`);
                        html += `<div class="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">Table content could not be displayed</div>\n`;
                    }
                    break;
                case 'embed':
                    if (inList) {
                        html += this.closeList(inList);
                        inList = false;
                    }
                    // Handle embed blocks
                    const embedUrl = block.embed?.url || '';
                    if (embedUrl) {
                        html += `<div class="mb-6">\n`;
                        html += `  <iframe src="${embedUrl}" class="w-full h-64 rounded-lg" frameborder="0"></iframe>\n`;
                        html += `</div>\n`;
                    }
                    break;
                default:
                    // Handle unknown block types gracefully
                    console.log(`⚠️  Unknown block type: ${block.type}`);
                    break;
            }
        }

        if (inList) {
            html += this.closeList(inList);
        }

        return html || "<p>No content available.</p>";
    }

    async convertTableToHtml(tableBlock) {
        try {
            // Fetch table rows from Notion
            const response = await notion.blocks.children.list({
                block_id: tableBlock.id
            });
            
            const rows = response.results;
            if (!rows || rows.length === 0) {
                return `<div class="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">Empty table</div>\n`;
            }

            let html = '<div class="overflow-x-auto mb-6">\n';
            html += '<table class="min-w-full border-collapse border border-gray-300">\n';

            const hasHeader = tableBlock.table?.has_column_header || false;
            const hasRowHeader = tableBlock.table?.has_row_header || false;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.type !== 'table_row') continue;

                const cells = row.table_row?.cells || [];
                const isHeaderRow = hasHeader && i === 0;

                html += '  <tr>\n';
                
                for (let j = 0; j < cells.length; j++) {
                    const cell = cells[j];
                    const isHeaderCell = (isHeaderRow) || (hasRowHeader && j === 0);
                    const tag = isHeaderCell ? 'th' : 'td';
                    const cellClass = isHeaderCell 
                        ? 'px-4 py-2 bg-gray-100 font-semibold border border-gray-300 text-left'
                        : 'px-4 py-2 border border-gray-300';
                    
                    const cellContent = this.convertRichTextToHtml(cell);
                    html += `    <${tag} class="${cellClass}">${cellContent || ''}</${tag}>\n`;
                }
                
                html += '  </tr>\n';
            }

            html += '</table>\n';
            html += '</div>\n';

            return html;
        } catch (error) {
            console.log(`⚠️  Error processing table: ${error.message}`);
            return `<div class="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">Table processing error</div>\n`;
        }
    }

    createSlugFromTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[-\s]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }


    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    async saveArticleMarkdown(article, slug) {
        // Ensure output directory exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Convert HTML content back to markdown-like format for Eleventy
        const markdownContent = this.convertHtmlToMarkdown(article.content || "No content available.");

        // Create frontmatter
        let frontmatter = `---
layout: post.njk
title: "${article.title}"
description: "${article.metaDescription || ''}"
date: ${article.publishDate}`;

        // Only add thumbnail if cover image exists
        if (article.coverImage) {
            frontmatter += `
thumbnail: "${article.coverImage}"
alt: "${article.title}"`;
        }

        frontmatter += `
---

${markdownContent}`;

        // Save markdown file
        const markdownFile = path.join(OUTPUT_DIR, `${slug}.md`);
        await fs.writeFile(markdownFile, frontmatter);

        console.log(`✅ Generated article: ${slug}.md`);
        return markdownFile;
    }

    // Convert HTML content to markdown-like format
    convertHtmlToMarkdown(html) {
        // First convert tables to markdown format
        html = this.convertHtmlTablesToMarkdown(html);
        
        return html
            // Convert headings
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
            // Convert paragraphs
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
            // Convert lists
            .replace(/<ul[^>]*>/gi, '\n')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
            // Convert formatting
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            // Convert links
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            // Convert blockquotes
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n')
            // Convert images
            .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '\n![alt]($1)\n')
            // Clean up extra whitespace
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }

    // Convert HTML tables to markdown format
    convertHtmlTablesToMarkdown(html) {
        return html.replace(/<div class="overflow-x-auto mb-6">\s*<table[^>]*>(.*?)<\/table>\s*<\/div>/gis, (match, tableContent) => {
            // Extract table rows
            const rows = [];
            const rowMatches = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gis);
            
            if (!rowMatches) return match;
            
            let isFirstRow = true;
            let hasHeaders = false;
            
            for (const rowMatch of rowMatches) {
                const cells = [];
                const cellMatches = rowMatch.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis);
                
                if (!cellMatches) continue;
                
                // Check if this row has header cells
                const hasHeaderCells = rowMatch.includes('<th');
                if (isFirstRow && hasHeaderCells) {
                    hasHeaders = true;
                }
                
                for (const cellMatch of cellMatches) {
                    // Extract cell content and clean up HTML
                    let cellContent = cellMatch.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/is, '$1');
                    // Remove HTML tags but keep basic formatting
                    cellContent = cellContent
                        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
                        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
                        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
                        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
                        .trim();
                    
                    cells.push(cellContent || ' ');
                }
                
                rows.push(cells);
                isFirstRow = false;
            }
            
            if (rows.length === 0) return match;
            
            // Build markdown table
            let markdownTable = '\n';
            
            // Add header row
            const firstRow = rows[0];
            markdownTable += '| ' + firstRow.join(' | ') + ' |\n';
            
            // Add separator row
            const separator = firstRow.map(() => '---').join(' | ');
            markdownTable += '| ' + separator + ' |\n';
            
            // Add data rows (skip first row if it was a header)
            const dataRows = hasHeaders ? rows.slice(1) : rows.slice(1);
            for (const row of dataRows) {
                // Ensure row has same number of cells as header
                while (row.length < firstRow.length) {
                    row.push(' ');
                }
                markdownTable += '| ' + row.join(' | ') + ' |\n';
            }
            
            markdownTable += '\n';
            return markdownTable;
        });
    }

    async updateSitemap(newArticles) {
        const sitemapPath = path.join('_site', 'sitemap.xml');

        try {
            const sitemapContent = await fs.readFile(sitemapPath, 'utf8');

            // Add new URLs to sitemap
            let newUrls = "";
            for (const article of newArticles) {
                const slug = article.slug || this.createSlugFromTitle(article.title);
                newUrls += `  <url>
    <loc>https://moone.app/blog/posts/${slug}/</loc>
    <lastmod>${article.publishDate}</lastmod>
  </url>
`;
            }

            // Insert new URLs before closing tag
            const updatedSitemap = sitemapContent.replace('</urlset>', newUrls + '</urlset>');
            await fs.writeFile(sitemapPath, updatedSitemap);

            console.log(`✅ Updated sitemap with ${newArticles.length} new articles`);
        } catch (error) {
            console.log(`⚠️  Could not update sitemap: ${error.message}`);
        }
    }

    async run() {
        console.log("🚀 Starting Notion Article Fetcher...");

        try {
            // Load tracking data
            const trackingData = await this.loadTrackingData();
            console.log(`📊 Loaded tracking data with ${Object.keys(trackingData.articles).length} existing articles`);

            // Get last publication date
            const lastDate = this.getLastPublicationDate(trackingData);
            console.log(`📅 Last publication date: ${lastDate}`);

            // Fetch new articles from Notion
            console.log("🔍 Fetching articles from Notion...");
            const notionPages = await this.fetchArticlesFromNotion(lastDate);
            console.log(`📄 Found ${notionPages.length} articles from Notion`);

            const newArticles = [];
            const updatedArticles = {};

            for (const page of notionPages) {
                const article = await this.extractArticleData(page);

                // Skip if no title or publish date
                if (!article.title || !article.publishDate) {
                    console.log(`⚠️  Skipping article with missing title or publish date`);
                    continue;
                }

                // Check if this is a new article
                const articleKey = `${article.title}_${article.publishDate}`;

                if (!trackingData.articles[articleKey]) {
                    // Use existing slug or create one from title
                    const slug = article.slug || this.createSlugFromTitle(article.title);

                    // Save markdown file
                    await this.saveArticleMarkdown(article, slug);

                    // Track this article
                    updatedArticles[articleKey] = {
                        title: article.title,
                        slug: slug,
                        publish_date: article.publishDate,
                        meta_description: article.metaDescription,
                        notion_id: article.id,
                        created_at: new Date().toISOString()
                    };

                    newArticles.push({ ...article, slug });
                } else {
                    console.log(`📋 Article already exists: ${article.title}`);
                }
            }

            if (newArticles.length > 0) {
                // Update tracking data
                trackingData.articles = { ...trackingData.articles, ...updatedArticles };
                trackingData.last_sync = new Date().toISOString();
                await this.saveTrackingData(trackingData);

                // Update sitemap
                await this.updateSitemap(newArticles);

                console.log(`🎉 Successfully processed ${newArticles.length} new articles!`);
            } else {
                console.log("✨ No new articles to process");
            }

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run the fetcher
async function main() {
    const fetcher = new NotionArticleFetcher();
    await fetcher.run();
}

if (require.main === module) {
    main();
}
