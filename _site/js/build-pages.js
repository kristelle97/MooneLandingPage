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
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_MEASUREMENT_ID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-2ZSVEQDDT1');
    </script>
    
    <!-- Cookie Banner Script -->
    <script type="text/javascript" charset="UTF-8" src="//cdn.cookie-script.com/s/bcb8f2d8f394d9e54bf16bef90ad28b4.js"></script>

    <!-- Crisp Chat Widget -->
    <script type="text/javascript">
        window.$crisp=[];
        window.CRISP_WEBSITE_ID="c638e7df-d51a-4454-8b59-69d62961774d";
        (function(){
            d=document;
            s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
        })();
    </script>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #ddd6fe 60%, #c4b5fd 100%);">
    <style>
        .glass-nav {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
    <!-- Navigation -->
    <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 ease-in-out glass-nav">
        <div class="container mx-auto px-6 flex justify-between items-center max-w-6xl">
            <div class="flex items-center gap-3">
                <picture>
                    <source srcset="/img/optimized/moon.webp" type="image/webp">
                    <img src="/img/moon/moon.png" alt="Moone Logo" class="h-10 w-10" width="40" height="40">
                </picture>
                <span class="text-xl font-semibold text-slate-800">Moone</span>
            </div>

            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/#features" class="text-slate-600 hover:text-purple-600 transition-colors font-medium">Fonctionnalités</a>
                <a href="/#pricing" class="text-slate-600 hover:text-purple-600 transition-colors font-medium">Tarifs</a>
                <a href="/blog/" class="text-slate-600 hover:text-purple-600 transition-colors font-medium">Blog</a>
                <!-- iOS Download Button -->
                <a href="https://apps.apple.com/en/app/moone-period-cycle-tracker/id6739633389" id="desktop-download-btn" class="ios-download-btn bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl">Télécharger</a>
                <!-- Android Download Button -->
                <button id="desktop-android-btn" class="android-download-btn bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl hidden">Télécharger</button>
            </div>

            <!-- Mobile Menu Button -->
            <div class="md:hidden">
                <button id="mobile-menu-button" class="text-slate-600 focus:outline-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-white/90 backdrop-blur-md border-t border-white/20">
            <div class="px-6 py-4 space-y-3">
                <a href="/#features" class="block text-slate-600 hover:text-purple-600 transition-colors font-medium">Fonctionnalités</a>
                <a href="/#pricing" class="block text-slate-600 hover:text-purple-600 transition-colors font-medium">Tarifs</a>
                <a href="/blog/" class="block text-slate-600 hover:text-purple-600 transition-colors font-medium">Blog</a>
                <a href="https://apps.apple.com/en/app/moone-period-cycle-tracker/id6739633389" id="mobile-download-btn" class="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg">Télécharger</a>
            </div>
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
    <footer class="bg-slate-50 border-t border-gray-200/50 py-16">
        <div class="container mx-auto px-6 max-w-6xl">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div class="flex items-center gap-3">
                    <picture>
                        <source srcset="/img/optimized/moon.webp" type="image/webp">
                        <img src="/img/moon/moon.png" alt="Moone Logo" class="h-10 w-10" width="40" height="40">
                    </picture>
                    <span class="text-xl font-semibold text-slate-800">Moone</span>
                </div>
                <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <a href="/PrivacyPolicy/" class="text-slate-600 hover:text-purple-600 transition-colors">Politique de confidentialité</a>
                    <a href="/TermsandConditions/" class="text-slate-600 hover:text-purple-600 transition-colors">Conditions générales</a>
                </div>
            </div>
            <div class="mt-12 pt-8 border-t border-gray-200/50 text-center space-y-2">
                <p class="text-slate-600">&copy; 2024 Moone. Tous droits réservés.</p>
                <p class="text-sm text-slate-500">Moone partage des informations éducatives et des outils de soutien. Ce n'est pas un dispositif médical et ne fournit pas de conseils médicaux.</p>
            </div>
        </div>
    </footer>

    <script>
        function detectMobileOS() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            
            // iOS detection
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                return 'iOS';
            }
            
            // Android detection
            if (/android/i.test(userAgent)) {
                return 'Android';
            }
            
            // Default to desktop
            return 'desktop';
        }

        // Call this function when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            setupDownloadButtons();
            setupMobileMenu();
        });

        function setupDownloadButtons() {
            const os = detectMobileOS();
            const iosButtons = document.querySelectorAll('.ios-download-btn');
            const androidButtons = document.querySelectorAll('.android-download-btn');
            
            if (os === 'Android') {
                // Show Android buttons, hide iOS buttons
                iosButtons.forEach(btn => btn.classList.add('hidden'));
                androidButtons.forEach(btn => {
                    btn.classList.remove('hidden');
                    btn.addEventListener('click', function() {
                        const modal = document.getElementById('google-play-modal');
                        if (modal) {
                            modal.classList.remove('hidden');
                            document.body.style.overflow = 'hidden';
                        }
                    });
                });
            } else {
                // For iOS and desktop, show iOS buttons, hide Android buttons
                androidButtons.forEach(btn => btn.classList.add('hidden'));
                iosButtons.forEach(btn => btn.classList.remove('hidden'));
            }
        }

        function setupMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuIcon = mobileMenuButton?.querySelector('svg');

            // Toggle Mobile Menu
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                    if (mobileMenuIcon) {
                        if (mobileMenu.classList.contains('hidden')) {
                            mobileMenuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                        } else {
                            mobileMenuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
                        }
                    }
                });
            }

            // Close mobile menu when a link is clicked
            if (mobileMenu) {
                mobileMenu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        mobileMenu.classList.add('hidden');
                        if (mobileMenuIcon) {
                            mobileMenuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                        }
                    });
                });
            }
        }
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
            case 'heading_2':
                if (inList) {
                    html += '</ul>\n';
                    inList = false;
                }
                const h2Text = block.heading_2.rich_text[0]?.text?.content || '';
                html += `<h3 class="text-xl font-semibold mt-8 mb-4">${h2Text}</h3>\n`;
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
            'Terms and Conditions': '27a27d4c19018063a627fb87e138e1b2'
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