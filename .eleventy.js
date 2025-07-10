const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");

module.exports = function(eleventyConfig) {
    // Add a collection for blog posts
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/**/*.md");
    });

    // Fix the date filter
    eleventyConfig.addFilter("dateFilter", function(date) {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL);
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