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
    <link href="/dist/output.css" rel="stylesheet">
    <link rel="preload" href="https://fonts.googleapis.com/css?family=Quicksand:300,400,500,600,700">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 py-4 transition-colors duration-300 ease-in-out bg-moone-purple">
        <div class="container mx-auto px-4 md:px-6 flex justify-between items-center">
            <div class="flex items-center">
                <img src="/img/moon/moon-eating.png" alt="Moone Logo" class="h-14">
                <span class="ml-2 text-xl font-semibold text-white">Moone</span>
            </div>

            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/#features" class="text-purple-100 hover:text-white">Features</a>
                <a href="/#how-it-works" class="text-purple-100 hover:text-white">How It Works</a>
                <a href="/#testimonials" class="text-purple-100 hover:text-white">Testimonials</a>
                <a href="/blog/" class="text-purple-100 hover:text-white">Blog</a>
                <a href="/#download" class="bg-white text-moone-purple px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition duration-300 ml-4">Download</a>
            </div>

            <!-- Mobile Menu Button -->
            <div class="md:hidden flex justify-center gap-4 items-center">
                <a href="/#download" class="bg-white text-moone-purple px-6 py-2 rounded-full font-medium hover:bg-gray-100">Download</a>
                <button id="mobile-menu-button" class="text-white focus:outline-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-moone-purple pb-4">
            <a href="/#features" class="block py-2 px-4 text-purple-100 hover:bg-purple-700 hover:text-white">Features</a>
            <a href="/#how-it-works" class="block py-2 px-4 text-purple-100 hover:bg-purple-700 hover:text-white">How It Works</a>
            <a href="/#testimonials" class="block py-2 px-4 text-purple-100 hover:bg-purple-700 hover:text-white">Testimonials</a>
            <a href="/blog/" class="block py-2 px-4 text-purple-100 hover:bg-purple-700 hover:text-white">Blog</a>
            <a href="/#download" class="block py-2 px-4 text-center bg-white text-moone-purple rounded-full font-medium hover:bg-gray-100 transition duration-300 mx-4 mt-2">Download</a>
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
                    <img src="/img/moon/moon-eating.png" alt="Moone Logo" class="h-14">
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
    <script>
        // Add the JavaScript for the mobile menu toggle and scroll behavior here
        // Note: You might need to adjust paths or logic if this script relies
        // on elements specific to index.html that aren't present on these generated pages.
        const navbar = document.getElementById('navbar');
        const logoText = navbar.querySelector('span');
        // Select desktop nav links only
        const desktopNavLinks = navbar.querySelectorAll('.hidden.md\\:flex > a:not(:last-child)');
        // Select desktop download button only
        const desktopDownloadButton = navbar.querySelector('.hidden.md\\:flex > a:last-child');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileNavLinks = mobileMenu.querySelectorAll('a:not(:last-child)');
        const mobileDownloadButton = mobileMenu.querySelector('a:last-child');
        const mobileMenuIcon = mobileMenuButton.querySelector('svg'); // Get the SVG icon

        // Define classes for different states (adjust if needed for non-index pages)
        const topClasses = {
            nav: ['bg-moone-purple'],
            logo: ['text-white'],
            links: ['text-purple-100', 'hover:text-white'],
            button: ['bg-white', 'text-moone-purple', 'hover:bg-gray-100'],
            mobileMenuBg: ['bg-moone-purple'],
            mobileLinks: ['text-purple-100', 'hover:bg-purple-700', 'hover:text-white'],
            mobileButton: ['bg-white', 'text-moone-purple', 'hover:bg-gray-100'],
            hamburgerIcon: ['text-white']
        };

        const scrolledClasses = {
            nav: ['bg-white', 'shadow-md'],
            logo: ['text-moone-purple'],
            links: ['text-gray-600', 'hover:text-moone-purple'],
            button: ['bg-moone-purple', 'text-white', 'hover:bg-purple-700'],
            mobileMenuBg: ['bg-white'],
            mobileLinks: ['text-gray-600', 'hover:bg-gray-100', 'hover:text-moone-purple'],
            mobileButton: ['bg-moone-purple', 'text-white', 'hover:bg-purple-700'],
            hamburgerIcon: ['text-moone-purple']
        };

        function updateNavClasses(isScrolled) {
            const add = isScrolled ? scrolledClasses : topClasses;
            const remove = isScrolled ? topClasses : scrolledClasses;

            navbar.classList.remove(...remove.nav);
            navbar.classList.add(...add.nav);

            logoText.classList.remove(...remove.logo);
            logoText.classList.add(...add.logo);

            desktopNavLinks.forEach(link => {
                link.classList.remove(...remove.links);
                link.classList.add(...add.links);
            });

            desktopDownloadButton.classList.remove(...remove.button);
            desktopDownloadButton.classList.add(...add.button);

            mobileMenu.classList.remove(...remove.mobileMenuBg);
            mobileMenu.classList.add(...add.mobileMenuBg);

            mobileNavLinks.forEach(link => {
                link.classList.remove(...remove.mobileLinks);
                link.classList.add(...add.mobileLinks);
            });

            mobileDownloadButton.classList.remove(...remove.mobileButton);
            mobileDownloadButton.classList.add(...add.mobileButton);

            mobileMenuIcon.classList.remove(...remove.hamburgerIcon);
            mobileMenuIcon.classList.add(...add.hamburgerIcon);
        }

        // Toggle Mobile Menu
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenuIcon.innerHTML = \`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>\`;
            } else {
                mobileMenuIcon.innerHTML = \`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>\`;
            }
        });

        // Close mobile menu when a link is clicked (optional, depends on desired behavior)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Check if the link is an internal page link (starts with #)
                // If not, don't automatically close the menu as it navigates away
                if (link.getAttribute('href').startsWith('#') || link.getAttribute('href').startsWith('/#')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuIcon.innerHTML = \`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>\`; // Reset icon
                }
            });
        });

        // Scroll behavior (optional for static pages like Privacy Policy)
        // You might want to remove or adjust this if the scroll effect isn't needed
        window.addEventListener('scroll', () => {
            const isScrolled = window.scrollY > 50;
            updateNavClasses(isScrolled);
        });

        // Initial check
        updateNavClasses(window.scrollY > 50);
    </script>
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
            'Privacy Policy': '1d827d4c1901801db3c5f13fd84b061e', // Replace with actual ID
            'Terms and Conditions': '1d827d4c1901801db3c5f13fd84b061e' // Replace with actual ID
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
            // Ensure filenames are suitable for URLs (e.g., no spaces)
            const fileName = title.replace(/\s+/g, '') + '.html';
            // Output to the root directory relative to the script's location
            await fs.writeFile(path.join(__dirname, '..', fileName), htmlContent);

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