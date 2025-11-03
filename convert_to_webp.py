#!/usr/bin/env python3
"""
Image to WebP Converter
Converts GIF, PNG, JPG, and JPEG images to WebP format for better compression and faster loading.
"""

import os
import sys
from PIL import Image, ImageSequence
import argparse
from pathlib import Path

def get_file_size(file_path):
    """Get file size in bytes."""
    return os.path.getsize(file_path)

def format_size(size_bytes):
    """Format size in human readable format."""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.2f}{size_names[i]}"

def convert_animated_gif_to_webp(gif_path, webp_path, quality=80):
    """Convert animated GIF to animated WebP."""
    try:
        with Image.open(gif_path) as img:
            frames = []
            durations = []
            
            # Check if the GIF has transparency
            has_transparency = 'transparency' in img.info
            
            for frame in ImageSequence.Iterator(img):
                # Handle transparency properly
                if has_transparency or frame.mode in ('RGBA', 'LA', 'P'):
                    # Convert to RGBA to preserve transparency
                    if frame.mode != 'RGBA':
                        frame = frame.convert('RGBA')
                else:
                    # Convert to RGB if no transparency
                    if frame.mode != 'RGB':
                        frame = frame.convert('RGB')
                frames.append(frame.copy())
                durations.append(frame.info.get('duration', 100))
            
            # Save as animated WebP with better compression
            frames[0].save(
                webp_path,
                'WEBP',
                save_all=True,
                append_images=frames[1:],
                duration=durations,
                loop=0,
                quality=quality,
                method=6,  # Best compression
                optimize=True,  # Additional optimization
                alpha_quality=quality,  # Compress alpha channel if present
                minimize_size=True  # Prioritize smaller file size
            )
            return True
    except Exception as e:
        print(f"Error converting {gif_path}: {e}")
        return False

def convert_static_image_to_webp(image_path, webp_path, quality=80, lossless=False):
    """Convert static image (PNG, JPG, JPEG) to WebP."""
    try:
        with Image.open(image_path) as img:
            # Convert to appropriate mode for WebP
            if img.mode in ('RGBA', 'LA'):
                # Keep RGBA for transparency - WebP supports lossy compression with alpha!
                if img.mode == 'LA':
                    img = img.convert('RGBA')
                # Don't force lossless=True here - let it use the passed parameter
            elif img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            
            # Save as WebP with transparency support
            img.save(
                webp_path,
                'WEBP',
                quality=quality if not lossless else 100,
                lossless=lossless,
                method=6,  # Best compression
                # Add these for better alpha handling
                alpha_quality=quality if not lossless else 100,  # Compress alpha channel too
                optimize=True  # Additional optimization
            )
            return True
    except Exception as e:
        print(f"Error converting {image_path}: {e}")
        return False

def convert_images_to_webp(directory, backup=True, quality=80, lossless_png=True):
    """Convert all supported images in directory to WebP."""
    directory = Path(directory)
    supported_extensions = {'.gif', '.png', '.jpg', '.jpeg'}
    
    if not directory.exists():
        print(f"Directory {directory} does not exist!")
        return
    
    # Create backup directory if needed
    backup_dir = directory / 'backup_originals'
    if backup:
        backup_dir.mkdir(exist_ok=True)
    
    total_original_size = 0
    total_webp_size = 0
    converted_count = 0
    
    print(f"Converting images in: {directory}")
    print(f"Quality setting: {quality}")
    print(f"Lossless PNG conversion: {lossless_png}")
    print("-" * 60)
    
    for file_path in directory.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            original_size = get_file_size(file_path)
            webp_path = file_path.with_suffix('.webp')
            
            print(f"Converting: {file_path.name}")
            
            # Skip if WebP already exists (optional safety check)
            if webp_path.exists():
                print(f"  WebP already exists, skipping...")
                continue
            
            success = False
            
            if file_path.suffix.lower() == '.gif':
                # Check if it's animated
                try:
                    with Image.open(file_path) as img:
                        if getattr(img, 'is_animated', False):
                            success = convert_animated_gif_to_webp(file_path, webp_path, quality)
                        else:
                            success = convert_static_image_to_webp(file_path, webp_path, quality, False)
                except:
                    success = convert_static_image_to_webp(file_path, webp_path, quality, False)
            else:
                # PNG, JPG, JPEG
                use_lossless = lossless_png and file_path.suffix.lower() == '.png'
                success = convert_static_image_to_webp(file_path, webp_path, quality, use_lossless)
            
            if success:
                webp_size = get_file_size(webp_path)
                compression_ratio = (1 - webp_size / original_size) * 100
                
                print(f"  Original: {format_size(original_size)}")
                print(f"  WebP: {format_size(webp_size)}")
                print(f"  Compression: {compression_ratio:.1f}%")
                
                total_original_size += original_size
                total_webp_size += webp_size
                converted_count += 1
                
                # Backup original if requested
                if backup:
                    backup_path = backup_dir / file_path.name
                    try:
                        file_path.replace(backup_path)
                        print(f"  Backed up to: {backup_path}")
                    except Exception as e:
                        print(f"  Backup failed: {e}")
                else:
                    # Remove original if no backup requested
                    try:
                        file_path.unlink()
                        print(f"  Removed original")
                    except Exception as e:
                        print(f"  Failed to remove original: {e}")
            else:
                print(f"  Conversion failed!")
            
            print()
    
    # Summary
    print("-" * 60)
    print(f"Conversion complete!")
    print(f"Files converted: {converted_count}")
    
    if total_original_size > 0:
        total_compression = (1 - total_webp_size / total_original_size) * 100
        print(f"Total original size: {format_size(total_original_size)}")
        print(f"Total WebP size: {format_size(total_webp_size)}")
        print(f"Total space saved: {format_size(total_original_size - total_webp_size)}")
        print(f"Overall compression: {total_compression:.1f}%")

def main():
    parser = argparse.ArgumentParser(description='Convert images to WebP format')
    parser.add_argument('directory', help='Directory containing images to convert')
    parser.add_argument('--quality', type=int, default=80, help='Quality for lossy compression (1-100, default: 80)')
    parser.add_argument('--no-backup', action='store_true', help='Don\'t create backup of original files')
    parser.add_argument('--lossy-png', action='store_true', help='Use lossy compression for PNG files')
    
    args = parser.parse_args()
    
    # Validate quality
    if not 1 <= args.quality <= 100:
        print("Quality must be between 1 and 100")
        sys.exit(1)
    
    convert_images_to_webp(
        args.directory,
        backup=not args.no_backup,
        quality=args.quality,
        lossless_png=not args.lossy_png
    )

if __name__ == '__main__':
    main()