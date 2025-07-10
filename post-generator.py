import os
import requests
from datetime import datetime
import json
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client with timeout
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=60.0  # 60 seconds timeout
)

# Base directory for posts
BASE_DIR = "src/blog/posts"

# Path to the topics JSON file
TOPICS_JSON = "topics.json"

def load_topics(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)
    topics = []
    for folder, titles in data.items():
        for title in titles:
            topics.append({"folder": folder, "title": title})
    return topics

def generate_article(title):
    prompt = (
        f"Write a detailed, well-structured markdown article for a blog titled '{title}'. "
        "Include an introduction, main sections, and a conclusion. Use headings and bullet points where appropriate. The article must be 2000-2500 words long."
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7,
            timeout=120.0  # 2 minutes for longer articles
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating article for '{title}': {e}")
        return None

def generate_seo_keywords(title):
    prompt = (
        f"Generate 3-5 SEO keywords for a blog post titled '{title}'. "
        "Return only the keywords as a comma-separated list, no additional text."
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.5,
            timeout=30.0  # 30 seconds for keywords
        )
        keywords = response.choices[0].message.content.strip()
        return [keyword.strip() for keyword in keywords.split(',')]
    except Exception as e:
        print(f"Error generating keywords for '{title}': {e}")
        return ["menstrual health", "women's health"]  # fallback keywords

def generate_image(title, save_path, style, alt):
    prompt = (
        f"Cartoon-style digital illustration, soft pastel colors, friendly and modern. "
        f"Cover image for a blog post titled '{title}'. {alt}"
        f"Do not add text on the image."
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

def kebab_case(s):
    return s.lower().replace(' ', '-').replace('&', 'and').replace('--', '-')

def save_article(folder, title, content, description, tags, thumbnail, alt, date_str, permalink):
    os.makedirs(folder, exist_ok=True)
    filename = f"{folder}/{kebab_case(title)}.md"
    front_matter = (
        f"---\n"
        f"title: \"{title}\"\n"
        f"description: \"{description}\"\n"
        f"tags: {json.dumps(tags)}\n"
        f"thumbnail: {thumbnail}\n"
        f"alt: \"{alt}\"\n"
        f"layout: post.njk\n"
        f"date: {date_str}\n"
        f"permalink: \"{permalink}\"\n"
        f"---\n\n"
    )
    with open(filename, "w") as f:
        f.write(front_matter + content)
    return filename

def main():
    topics = load_topics(TOPICS_JSON)
    style = "cartoon-style digital illustration, soft pastel colors, friendly and modern"
    
    failed_articles = []
    
    for topic in topics:
        folder_path = os.path.join(BASE_DIR, topic["folder"])
        article_title = topic["title"]
        print(f"Generating article for: {article_title}")

        try:
            # Generate article
            article_content = generate_article(article_title)
            if not article_content:
                failed_articles.append(article_title)
                continue

            # Generate SEO keywords for tags
            print(f"Generating SEO keywords for: {article_title}")
            tags = generate_seo_keywords(article_title)
            
            # Generate description and other metadata
            description = f"A detailed article about {article_title}."
            date_str = datetime.now().strftime("%Y-%m-%d")
            permalink = f"/{kebab_case(article_title)}/"
            image_filename = f"{kebab_case(article_title)}.png"
            thumbnail = f"/img/posts/{kebab_case(article_title)}.png"
            alt = f"Cartoon-style illustration for {article_title}"

            # Generate image - save to src/img/posts folder
            image_path = os.path.join("src/img/posts", image_filename)
            print(f"Generating image for: {article_title}")
            
            # Ensure the directory exists
            os.makedirs(os.path.dirname(image_path), exist_ok=True)
            
            image_success = generate_image(article_title, image_path, style, alt)
            if not image_success:
                print(f"Warning: Failed to generate image for {article_title}")

            # Save article with new front matter
            article_path = save_article(
                folder_path, article_title, article_content, description, tags, thumbnail, alt, date_str, permalink
            )

            print(f"Article and image saved in {folder_path}")
            
            # Add a small delay between requests to be nice to the API
            time.sleep(1)
            
        except Exception as e:
            print(f"Failed to process article '{article_title}': {e}")
            failed_articles.append(article_title)
    
    if failed_articles:
        print(f"\nFailed to generate {len(failed_articles)} articles:")
        for title in failed_articles:
            print(f"  - {title}")

if __name__ == "__main__":
    main()