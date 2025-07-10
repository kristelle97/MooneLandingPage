import os
import requests
import json
import yaml
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import time
import re

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client with timeout
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=60.0  # 60 seconds timeout
)

# Base directory for posts
BASE_DIR = "src/blog/posts"
IMAGES_DIR = "src/img/posts"

def scan_posts_for_missing_thumbnails():
    """
    Scan all markdown files in the posts directory to find articles without thumbnails
    """
    articles_needing_images = []
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Parse YAML front matter
                    if content.startswith('---'):
                        # Extract front matter
                        parts = content.split('---', 2)
                        if len(parts) >= 2:
                            front_matter = parts[1].strip()
                            try:
                                metadata = yaml.safe_load(front_matter)
                                
                                # Check if thumbnail field exists
                                if not metadata.get('thumbnail'):
                                    # Get relative path from base directory
                                    rel_path = os.path.relpath(file_path, BASE_DIR)
                                    folder_name = os.path.dirname(rel_path)
                                    
                                    article_info = {
                                        'file_path': file_path,
                                        'relative_path': rel_path,
                                        'folder': folder_name,
                                        'title': metadata.get('title', 'Untitled'),
                                        'description': metadata.get('description', ''),
                                        'category': metadata.get('category', folder_name)
                                    }
                                    articles_needing_images.append(article_info)
                                    print(f"Found article without thumbnail: {article_info['title']}")
                            except yaml.YAMLError as e:
                                print(f"Error parsing YAML in {file_path}: {e}")
                
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
    
    return articles_needing_images

def save_articles_list(articles, json_path):
    """
    Save the list of articles needing images to a JSON file
    """
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(articles)} articles to {json_path}")

def kebab_case(s):
    """Convert string to kebab-case"""
    return s.lower().replace(' ', '-').replace('&', 'and').replace('--', '-')

def generate_image(title, save_path, alt_text):
    """
    Generate an image using DALL-E 3 based on the post title
    """
    prompt = (
        f"Cartoon-style digital illustration, soft pastel colors, friendly and modern. "
        f"Cover image for a blog post titled '{title}'. {alt_text} "
        f"Do not add text on the image. Health and wellness theme, women-focused."
    )
    
    try:
        response = client.images.generate(
            prompt=prompt,
            n=1,
            size="1024x1024",
            model="dall-e-3",
            timeout=180.0  # 3 minutes for image generation
        )
        image_url = response.data[0].url
        
        # Download image with timeout and retry
        max_retries = 3
        for attempt in range(max_retries):
            try:
                img_data = requests.get(image_url, timeout=30).content
                with open(save_path, 'wb') as handler:
                    handler.write(img_data)
                return True
            except requests.exceptions.Timeout:
                print(f"Timeout downloading image, attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Wait before retry
                else:
                    raise
            except requests.exceptions.RequestException as e:
                print(f"Error downloading image: {e}")
                return False
    except Exception as e:
        print(f"Error generating image for '{title}': {e}")
        return False

def update_article_with_thumbnail(file_path, thumbnail_path, alt_text):
    """
    Update the article's front matter to include the thumbnail and alt text
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse and update front matter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                front_matter = parts[1].strip()
                body = parts[2]
                
                # Parse existing metadata
                metadata = yaml.safe_load(front_matter)
                
                # Add thumbnail and alt text
                metadata['thumbnail'] = thumbnail_path
                metadata['alt'] = alt_text
                metadata['layout'] = 'post.njk'
                
                # Convert back to YAML
                updated_front_matter = yaml.dump(metadata, default_flow_style=False, sort_keys=False)
                
                # Reconstruct the file
                updated_content = f"---\n{updated_front_matter}---{body}"
                
                # Write back to file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                print(f"Updated {file_path} with thumbnail")
                return True
        
        return False
        
    except Exception as e:
        print(f"Error updating file {file_path}: {e}")
        return False

def generate_thumbnails_for_articles(articles):
    """
    Generate thumbnails for all articles in the list
    """
    # Ensure images directory exists
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    failed_articles = []
    
    for article in articles:
        title = article['title']
        print(f"Processing: {title}")
        
        try:
            # Create image filename
            image_filename = f"{kebab_case(title)}.png"
            image_path = os.path.join(IMAGES_DIR, image_filename)
            thumbnail_path = f"/img/posts/{image_filename}"
            alt_text = f"Illustration for {title}"
            
            # Generate image
            print(f"Generating image for: {title}")
            image_success = generate_image(title, image_path, alt_text)
            
            if image_success:
                # Update article with thumbnail
                update_success = update_article_with_thumbnail(
                    article['file_path'], 
                    thumbnail_path, 
                    alt_text
                )
                
                if update_success:
                    print(f"✅ Successfully processed: {title}")
                else:
                    print(f"❌ Failed to update article: {title}")
                    failed_articles.append(title)
            else:
                print(f"❌ Failed to generate image for: {title}")
                failed_articles.append(title)
            
            # Add delay between API calls
            time.sleep(2)
            
        except Exception as e:
            print(f"❌ Error processing {title}: {e}")
            failed_articles.append(title)
    
    return failed_articles

def main():
    """
    Main function to orchestrate the image generation process
    """
    print("🔍 Scanning for articles without thumbnails...")
    articles_needing_images = scan_posts_for_missing_thumbnails()
    
    if not articles_needing_images:
        print("✅ All articles already have thumbnails!")
        return
    
    print(f"📝 Found {len(articles_needing_images)} articles needing thumbnails")
    
    # Save list to JSON file
    json_path = "articles_needing_images.json"
    save_articles_list(articles_needing_images, json_path)
    
    # Ask user if they want to proceed with generation
    response = input(f"\n🎨 Generate thumbnails for {len(articles_needing_images)} articles? (y/n): ")
    if response.lower() != 'y':
        print("👋 Operation cancelled. Check articles_needing_images.json for the list.")
        return
    
    print("🎨 Starting thumbnail generation...")
    failed_articles = generate_thumbnails_for_articles(articles_needing_images)
    
    if failed_articles:
        print(f"\n❌ Failed to process {len(failed_articles)} articles:")
        for title in failed_articles:
            print(f"  - {title}")
    else:
        print("\n✅ All thumbnails generated successfully!")

if __name__ == "__main__":
    main()