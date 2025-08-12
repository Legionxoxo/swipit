#!/usr/bin/env python3

import csv
import re
import requests
import time
from urllib.parse import quote
import sys

def validate_instagram_url(url):
    """
    Validate if a URL is a valid Instagram post or reel URL
    """
    post_pattern = r'https?://(?:www\.)?instagram\.com/p/([A-Za-z0-9_-]+)/?'
    reel_pattern = r'https?://(?:www\.)?instagram\.com/reel/([A-Za-z0-9_-]+)/?'
    
    if re.match(post_pattern, url):
        return 'post', True
    elif re.match(reel_pattern, url):
        return 'reel', True
    else:
        return None, False

def check_url_exists(url):
    """
    Check if Instagram URL exists using oEmbed API
    """
    try:
        oembed_url = f"https://api.instagram.com/oembed?url={quote(url)}"
        response = requests.get(oembed_url, timeout=5)
        return response.status_code == 200
    except:
        return False

def create_full_template():
    """
    Create a complete template CSV with all profiles
    """
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                username = url.replace('https://www.instagram.com/', '').strip('/')
                profiles.append({
                    'profile_url': url,
                    'username': username,
                    'post_url': '',
                    'post_type': '',
                    'status': 'pending'
                })
    
    # Save template
    with open('profile_posts_collection.csv', 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['profile_url', 'username', 'post_url', 'post_type', 'status']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(profiles)
    
    print(f"✓ Created template with {len(profiles)} profiles")
    print("  Saved to: profile_posts_collection.csv")
    return len(profiles)

def validate_collected_urls(input_file='profile_posts_collection.csv'):
    """
    Validate URLs that have been manually added to the CSV
    """
    validated = []
    valid_count = 0
    invalid_count = 0
    pending_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        rows = list(reader)
    
    print(f"\nValidating {len(rows)} entries...")
    print("-" * 50)
    
    for i, row in enumerate(rows):
        post_url = row.get('post_url', '').strip()
        username = row.get('username', '')
        
        if not post_url:
            row['status'] = 'pending'
            row['post_type'] = ''
            pending_count += 1
            print(f"[{i+1:3}] {username:30} - No URL provided")
        else:
            post_type, is_valid = validate_instagram_url(post_url)
            
            if is_valid:
                # Check if URL actually exists
                print(f"[{i+1:3}] {username:30} - Checking {post_type}...", end=' ')
                exists = check_url_exists(post_url)
                
                if exists:
                    row['status'] = 'valid'
                    row['post_type'] = post_type
                    valid_count += 1
                    print("✓ Valid")
                else:
                    row['status'] = 'not_found'
                    row['post_type'] = post_type
                    invalid_count += 1
                    print("✗ Not found/Private")
                
                time.sleep(0.5)  # Rate limiting
            else:
                row['status'] = 'invalid_format'
                row['post_type'] = ''
                invalid_count += 1
                print(f"[{i+1:3}] {username:30} - Invalid URL format")
        
        validated.append(row)
    
    # Save validated results
    output_file = 'profile_posts_validated.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['profile_url', 'username', 'post_url', 'post_type', 'status']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(validated)
    
    print("\n" + "=" * 50)
    print("Validation Summary:")
    print(f"  ✓ Valid URLs:    {valid_count}")
    print(f"  ✗ Invalid/404:   {invalid_count}")
    print(f"  ⏳ Pending:       {pending_count}")
    print(f"  Total:           {len(rows)}")
    print(f"\nResults saved to: {output_file}")
    
    return validated

def show_instructions():
    """
    Show instructions for manual collection
    """
    print("\n" + "=" * 60)
    print("Instagram Post Collection Instructions")
    print("=" * 60)
    print("\n1. SETUP:")
    print("   python collect_real_posts.py --template")
    print("   This creates 'profile_posts_collection.csv'")
    
    print("\n2. COLLECT POSTS (Manual):")
    print("   a) Open profile_posts_collection.csv in Excel/Google Sheets")
    print("   b) For each row:")
    print("      - Click the profile_url to open in browser")
    print("      - Find any post or reel on their profile")
    print("      - Click on the post/reel")
    print("      - Copy the URL from browser address bar")
    print("      - Paste into the post_url column")
    print("   c) Save the CSV file")
    
    print("\n3. VALIDATE:")
    print("   python collect_real_posts.py --validate")
    print("   This checks if all URLs are valid")
    
    print("\n4. USE CHROME EXTENSION (Alternative):")
    print("   - Install your Chrome extension")
    print("   - Visit each profile")
    print("   - The extension can capture post URLs automatically")
    
    print("\nTIP: You can use Instagram's web version:")
    print("     Just open profiles in your browser and copy URLs")
    print("\nNOTE: Some profiles may be private or have no posts")

def process_in_batches(batch_size=10):
    """
    Process profiles in smaller batches
    """
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                profiles.append(url)
    
    total_batches = (len(profiles) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(profiles))
        batch = profiles[start_idx:end_idx]
        
        filename = f'batch_{batch_num + 1}_profiles.txt'
        with open(filename, 'w') as file:
            for profile in batch:
                file.write(profile + '\n')
        
        print(f"Batch {batch_num + 1}: {len(batch)} profiles saved to {filename}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == '--template':
            create_full_template()
            print("\nNext step: Open profile_posts_collection.csv and add post URLs")
        elif sys.argv[1] == '--validate':
            validate_collected_urls()
        elif sys.argv[1] == '--batch':
            batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            process_in_batches(batch_size)
        elif sys.argv[1] == '--help':
            show_instructions()
    else:
        show_instructions()