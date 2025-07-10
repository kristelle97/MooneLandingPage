#!/bin/bash

echo "🚀 Starting blog post image optimization..."
echo "This will optimize all images in src/img/posts/"

# Create optimized directory if it doesn't exist
mkdir -p src/img/posts/optimized

# Counter for tracking progress
count=0
total=$(find src/img/posts -maxdepth 1 -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | wc -l)

echo "Found $total images to optimize"
echo ""

# Process all images in the posts directory
for file in src/img/posts/*.{png,jpg,jpeg}; do
    # Skip if file doesn't exist (handles glob expansion)
    [[ ! -f "$file" ]] && continue
    
    # Get filename without extension
    filename=$(basename "$file")
    name="${filename%.*}"
    
    # Output file
    output="src/img/posts/optimized/${name}.webp"
    
    # Skip if already optimized
    if [[ -f "$output" ]]; then
        echo "⏭️  Skipping $filename (already optimized)"
        continue
    fi
    
    # Get original size
    original_size=$(ls -lh "$file" | awk '{print $5}')
    
    # Optimize image
    echo "🔄 Processing: $filename ($original_size)"
    
    # For blog post images, resize to max 800px width and compress
    if cwebp -q 75 -resize 800 0 "$file" -o "$output" 2>/dev/null; then
        # Get optimized size
        optimized_size=$(ls -lh "$output" | awk '{print $5}')
        echo "✅ $filename: $original_size → $optimized_size"
        
        count=$((count + 1))
    else
        echo "❌ Failed to optimize $filename"
    fi
    
    echo ""
done

echo "🎉 Optimization complete!"
echo "📊 Successfully optimized $count out of $total images"
echo ""
echo "💡 Next steps:"
echo "1. Test your optimized images"
echo "2. Update your blog templates to use WebP with fallbacks"
echo "3. Consider keeping originals as backup"
echo ""
echo "🔥 Expected savings: 90-95% reduction in image sizes!" 