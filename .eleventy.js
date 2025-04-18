const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
    // Add a collection for blog posts
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/*.md");
    });

    // Fix the date filter
    eleventyConfig.addFilter("dateFilter", function(date) {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL);
    });

    // Add proper passthrough copies
    eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("dist");

    // Watch CSS files for changes
    eleventyConfig.addWatchTarget("./dist/output.css");

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