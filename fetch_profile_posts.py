#!/usr/bin/env python3

import csv
import time
import json
import re
import requests
from urllib.parse import quote

def fetch_instagram_post(username):
    """
    Fetch the first post/reel from an Instagram profile.
    This uses Instagram's public web interface.
    """
    try:
        # Clean username
        username = username.replace('https://www.instagram.com/', '').strip('/')
        
        # Try to fetch profile page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Instagram's web interface URL
        url = f'https://www.instagram.com/{username}/'
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Look for post URLs in the HTML
            # Instagram posts have pattern /p/XXXXX/ or /reel/XXXXX/
            post_pattern = r'"/p/([^"]+)/"'
            reel_pattern = r'"/reel/([^"]+)/"'
            
            # Find posts
            posts = re.findall(post_pattern, response.text)
            reels = re.findall(reel_pattern, response.text)
            
            # Return the first post or reel found
            if posts:
                return f'https://www.instagram.com/p/{posts[0]}/'
            elif reels:
                return f'https://www.instagram.com/reel/{reels[0]}/'
            else:
                # Try to find in script tags
                script_pattern = r'"shortcode":"([^"]+)"'
                shortcodes = re.findall(script_pattern, response.text)
                if shortcodes:
                    return f'https://www.instagram.com/p/{shortcodes[0]}/'
        
        return None
        
    except Exception as e:
        print(f"Error fetching {username}: {str(e)}")
        return None

def process_profiles(input_file='profile_link.txt', output_csv='profile_posts.csv'):
    """
    Process profile links and fetch one post for each profile.
    """
    # Read profile links
    profiles = []
    with open(input_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                profiles.append(url)
    
    print(f"Processing {len(profiles)} profiles...")
    print("Note: This will take some time to avoid rate limiting.")
    print("Press Ctrl+C to stop and save progress.\n")
    
    results = []
    processed = 0
    
    try:
        for profile_url in profiles:
            username = profile_url.replace('https://www.instagram.com/', '').strip('/')
            print(f"[{processed + 1}/{len(profiles)}] Processing @{username}...", end=' ')
            
            # Fetch a post from this profile
            post_url = fetch_instagram_post(username)
            
            if post_url:
                print(f"✓ Found post")
                results.append({
                    'profile_url': profile_url,
                    'username': username,
                    'post_url': post_url
                })
            else:
                print(f"✗ No posts found")
                results.append({
                    'profile_url': profile_url,
                    'username': username,
                    'post_url': 'No posts found'
                })
            
            processed += 1
            
            # Rate limiting - wait between requests
            if processed < len(profiles):
                time.sleep(2)  # Wait 2 seconds between requests
            
            # Save progress every 10 profiles
            if processed % 10 == 0:
                save_results(results, output_csv)
                print(f"Progress saved: {processed}/{len(profiles)}")
    
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Saving progress...")
    
    # Save final results
    save_results(results, output_csv)
    print(f"\nProcessed {processed} profiles")
    print(f"Results saved to: {output_csv}")
    
    return results

def save_results(results, output_csv):
    """
    Save results to CSV file.
    """
    with open(output_csv, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['profile_url', 'username', 'post_url'])
        writer.writeheader()
        writer.writerows(results)

def create_sample_data():
    """
    Create sample data for demonstration.
    Since we can't actually fetch from Instagram without authentication,
    we'll create a sample dataset.
    """
    print("Creating sample profile_posts.csv with demonstration data...")
    
    # Read profile links
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                profiles.append(url)
    
    # Create sample post URLs
    results = []
    post_types = ['p', 'reel']
    sample_ids = [
        'C1234567890A', 'C2345678901B', 'C3456789012C', 'C4567890123D',
        'C5678901234E', 'C6789012345F', 'C7890123456G', 'C8901234567H'
    ]
    
    for i, profile_url in enumerate(profiles[:50]):  # Process first 50 for demo
        username = profile_url.replace('https://www.instagram.com/', '').strip('/')
        post_type = post_types[i % 2]
        post_id = sample_ids[i % len(sample_ids)] + str(i)
        post_url = f'https://www.instagram.com/{post_type}/{post_id}/'
        
        results.append({
            'profile_url': profile_url,
            'username': username,
            'post_url': post_url
        })
    
    # Save to CSV
    with open('profile_posts.csv', 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['profile_url', 'username', 'post_url'])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"Created sample data with {len(results)} profile-post pairs")
    print("Saved to: profile_posts.csv")
    
    return results

if __name__ == "__main__":
    import sys
    
    if '--sample' in sys.argv:
        # Create sample data for demonstration
        create_sample_data()
    else:
        print("=" * 60)
        print("Instagram Profile Post Fetcher")
        print("=" * 60)
        print("\nNOTE: Due to Instagram's anti-scraping measures,")
        print("fetching posts requires authentication or may be blocked.")
        print("\nOptions:")
        print("1. Run with --sample to create demonstration data")
        print("2. Use Instagram's API with proper authentication")
        print("3. Manually collect post URLs")
        print("\nTo create sample data: python fetch_profile_posts.py --sample")
        print("\nTo attempt fetching (may be blocked):")
        print("python fetch_profile_posts.py --fetch")
        
        if '--fetch' in sys.argv:
            process_profiles()