require('dotenv').config();
const fs = require('fs/promises');
const { Client } = require('@notionhq/client');
const path = require('path');

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_KEY
});

// Template for pages
const pageTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Moone</title>
    <link href="./dist/output.css" rel="stylesheet">
    <link rel="preload" href="https://fonts.googleapis.com/css?family=Quicksand:300,400,500,600,700">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 py-4 bg-moone-purple">
        <div class="container mx-auto px-4 md:px-6 flex justify-between items-center">
            <a href="index.html" class="flex items-center">
                <img src="img/moon/moon-eating.png" alt="Moone Logo" class="h-14">
                <span class="ml-2 text-xl font-semibold text-white">Moone</span>
            </a>
        </div>
    </nav>

    <!-- Content Section -->
    <section class="pt-32 pb-20">
        <div class="container mx-auto px-4 md:px-6">
            <h1 class="text-3xl font-bold mb-8 text-gray-800">${title}</h1>
            <div class="prose max-w-none">
                ${content}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-moone-purple text-white py-8">
        <div class="container mx-auto px-4 md:px-6">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="img/moon/moon-eating.png" alt="Moone Logo" class="h-14">
                    <span class="ml-2 text-lg font-semibold">Moone</span>
                </div>
                <div class="flex gap-4">
                    <a href="PrivacyPolicy.html" class="text-purple-200 hover:text-white">Privacy Policy</a>
                    <a href="TermsAndConditions.html" class="text-purple-200 hover:text-white">Terms & Conditions</a>
                </div>
            </div>
            <div class="mt-8 text-purple-200 text-sm">
                <p>&copy; 2024 Moone. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
`;

// Convert Notion blocks to HTML
function convertNotionToHtml(blocks) {
    let html = '';
    let inList = false;

    for (const block of blocks) {
        switch (block.type) {
            case 'paragraph':
                if (inList) {
                    html += '</ul>\n';
                    inList = false;
                }
                const text = block.paragraph.rich_text[0]?.text?.content || '';
                html += `<p class="mb-4">${text}</p>\n`;
                break;
            case 'heading_1':
                if (inList) {
                    html += '</ul>\n';
                    inList = false;
                }
                const h1Text = block.heading_1.rich_text[0]?.text?.content || '';
                html += `<h2 class="text-2xl font-semibold mt-8 mb-4">${h1Text}</h2>\n`;
                break;
            case 'bulleted_list_item':
                if (!inList) {
                    html += '<ul class="list-disc ml-6 mb-6">\n';
                    inList = true;
                }
                const listText = block.bulleted_list_item.rich_text[0]?.text?.content || '';
                html += `  <li>${listText}</li>\n`;
                break;
        }
    }

    if (inList) {
        html += '</ul>\n';
    }

    return html;
}

// Main build function
async function buildPages() {
    try {
        // Define your Notion page IDs
        const pages = {
            'Privacy Policy': '1d827d4c1901801db3c5f13fd84b061e',
            'Terms and Conditions': '1d827d4c1901801db3c5f13fd84b061e'
        };

        for (const [title, pageId] of Object.entries(pages)) {
            // Fetch content from Notion
            const response = await notion.blocks.children.list({
                block_id: pageId
            });

            // Convert blocks to HTML
            const content = convertNotionToHtml(response.results);

            // Generate full HTML page
            const htmlContent = pageTemplate(title, content);

            // Write to file
            const fileName = title.replace(/\s+/g, '') + '.html';
            await fs.writeFile(path.join(__dirname, '..', '..', fileName), htmlContent);
            
            console.log(`Generated ${fileName}`);
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Run the build
buildPages();