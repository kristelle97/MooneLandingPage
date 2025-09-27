const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");

module.exports = function(eleventyConfig) {
    // Add a collection for blog posts (exclude OLD posts)
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/**/*.md")
            .filter(item => !item.inputPath.includes("OLD - posts"));
    });

    // Fix the date filter
    eleventyConfig.addFilter("dateFilter", function(date) {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL);
    });

    // Add date filter for sitemap
    eleventyConfig.addFilter("date", function(date, format) {
        if (date === "now") {
            date = new Date();
        }
        return DateTime.fromJSDate(date).toFormat(format);
    });

    // Add filter to extract first image from content
    eleventyConfig.addFilter("extractFirstImage", function(content) {
        if (!content) return null;
        
        // Try to match markdown image syntax first: ![alt](url)
        const markdownImageMatch = content.match(/!\[.*?\]\((.*?)\)/);
        if (markdownImageMatch) {
            return markdownImageMatch[1];
        }
        
        // Try to match HTML img tags: <img src="url" ...>
        const htmlImageMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (htmlImageMatch) {
            return htmlImageMatch[1];
        }
        
        return null;
    });

    // Add proper passthrough copies
    eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("./dist/output.css");
    
    // Copy service worker and manifest for PWA functionality
    eleventyConfig.addPassthroughCopy("src/sw.js");
    eleventyConfig.addPassthroughCopy("src/manifest.json");

    // Watch CSS files for changes
    eleventyConfig.addWatchTarget("./dist/output.css");
    
    // Ignore OLD posts directory completely
    eleventyConfig.ignores.add("src/blog/OLD - posts/**/*");

    // Configure Markdown-it
    let options = {
        html: true,
        breaks: true,
        linkify: true
    };

    eleventyConfig.setLibrary("md", markdownIt(options));

    return {
        pathPrefix: "/",
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_includes/layouts"
        },
        templateFormats: ["md", "njk", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        passthroughFileCopy: true
    };
};