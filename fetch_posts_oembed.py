#!/usr/bin/env python3

import csv
import json
import time
import requests
from urllib.parse import quote

def get_instagram_oembed(url):
    """
    Use Instagram's oEmbed API to validate if a URL exists.
    This is a public API that doesn't require authentication.
    """
    try:
        oembed_url = f"https://api.instagram.com/oembed?url={quote(url)}"
        response = requests.get(oembed_url, timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def generate_profile_posts_mapping():
    """
    Generate a CSV mapping of profiles to sample post URLs.
    Since we can't automatically fetch posts without authentication,
    this creates a template that can be filled in manually or with actual data.
    """
    
    # Read profile links
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                profiles.append(url)
    
    print(f"Found {len(profiles)} profiles")
    
    # Create CSV with profile URLs and placeholder for post URLs
    results = []
    for profile_url in profiles:
        username = profile_url.replace('https://www.instagram.com/', '').strip('/')
        results.append({
            'profile_url': profile_url,
            'username': username,
            'post_url': '',  # To be filled in
            'post_type': '',  # 'post' or 'reel'
            'verified': 'No'
        })
    
    # Save to CSV
    with open('profile_posts_template.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['profile_url', 'username', 'post_url', 'post_type', 'verified'])
        writer.writeheader()
        writer.writerows(results)
    
    print("Created template: profile_posts_template.csv")
    print("This file contains all profile URLs with empty post_url fields to be filled in.")
    
    return results

def verify_posts_from_csv(input_csv='profile_posts_filled.csv', output_csv='profile_posts_verified.csv'):
    """
    Verify Instagram post URLs using the oEmbed API.
    """
    results = []
    
    # Read the CSV with profile and post URLs
    with open(input_csv, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        rows = list(reader)
    
    print(f"Verifying {len(rows)} post URLs...")
    verified_count = 0
    
    for i, row in enumerate(rows):
        post_url = row.get('post_url', '')
        
        if post_url and post_url.startswith('http'):
            print(f"[{i+1}/{len(rows)}] Verifying {post_url}...", end=' ')
            
            oembed_data = get_instagram_oembed(post_url)
            if oembed_data:
                print("✓ Valid")
                row['verified'] = 'Yes'
                row['author_name'] = oembed_data.get('author_name', '')
                verified_count += 1
            else:
                print("✗ Invalid or private")
                row['verified'] = 'No'
            
            time.sleep(1)  # Rate limiting
        else:
            row['verified'] = 'No post URL'
        
        results.append(row)
    
    # Save verified results
    fieldnames = ['profile_url', 'username', 'post_url', 'post_type', 'verified', 'author_name']
    with open(output_csv, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\nVerification complete!")
    print(f"Valid posts: {verified_count}/{len(rows)}")
    print(f"Results saved to: {output_csv}")

def create_sample_mapping():
    """
    Create a sample CSV with some real Instagram post examples.
    """
    # Read profile links
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                profiles.append(url)
    
    # Sample post IDs (these are examples - actual posts would need real IDs)
    sample_posts = [
        'https://www.instagram.com/p/C1234567890/',
        'https://www.instagram.com/reel/C2345678901/',
        'https://www.instagram.com/p/C3456789012/',
        'https://www.instagram.com/reel/C4567890123/',
    ]
    
    results = []
    for i, profile_url in enumerate(profiles[:20]):  # Just first 20 for demo
        username = profile_url.replace('https://www.instagram.com/', '').strip('/')
        
        # For demonstration, we'll leave post URLs empty
        # In practice, these would be filled with actual post URLs
        results.append({
            'profile_url': profile_url,
            'username': username,
            'post_url': '',  # To be filled with actual post URL
            'post_type': '',  # 'post' or 'reel'
            'notes': 'Add actual post URL from this profile'
        })
    
    # Save to CSV
    with open('profile_posts_mapping.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['profile_url', 'username', 'post_url', 'post_type', 'notes'])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"Created mapping template with {len(results)} profiles")
    print("Saved to: profile_posts_mapping.csv")
    print("\nTo complete the mapping:")
    print("1. Open profile_posts_mapping.csv")
    print("2. Visit each profile URL")
    print("3. Copy one post or reel URL from that profile")
    print("4. Paste it in the post_url column")
    print("5. Set post_type to 'post' or 'reel'")
    
    return results

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("Instagram Profile-Post Mapping Tool")
    print("=" * 60)
    
    if '--template' in sys.argv:
        generate_profile_posts_mapping()
    elif '--verify' in sys.argv:
        if len(sys.argv) > 2:
            verify_posts_from_csv(sys.argv[2])
        else:
            print("Please provide CSV file to verify")
            print("Usage: python fetch_posts_oembed.py --verify profile_posts_filled.csv")
    elif '--sample' in sys.argv:
        create_sample_mapping()
    else:
        print("\nOptions:")
        print("1. Create template CSV:")
        print("   python fetch_posts_oembed.py --template")
        print("\n2. Create sample mapping:")
        print("   python fetch_posts_oembed.py --sample")
        print("\n3. Verify posts from CSV:")
        print("   python fetch_posts_oembed.py --verify profile_posts_filled.csv")
        print("\nNote: Instagram requires authentication to fetch posts automatically.")
        print("The template approach allows manual collection of post URLs.")