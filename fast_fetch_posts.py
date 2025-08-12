#!/usr/bin/env python3

import csv
import time
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import random

def fetch_instagram_post(username):
    """
    Fetch one post from an Instagram profile using GraphQL API
    """
    try:
        # Instagram's public GraphQL endpoint
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
        
        headers = {
            'User-Agent': f'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/{random.randint(500,540)}.36',
            'X-IG-App-ID': '936619743392459',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': '*/*',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get('data', {}).get('user', {})
            media = user_data.get('edge_owner_to_timeline_media', {})
            edges = media.get('edges', [])
            
            if edges:
                first_post = edges[0].get('node', {})
                shortcode = first_post.get('shortcode')
                is_video = first_post.get('is_video', False)
                
                if shortcode:
                    post_type = 'reel' if is_video else 'p'
                    return {
                        'url': f'https://www.instagram.com/{post_type}/{shortcode}/',
                        'type': 'reel' if is_video else 'post',
                        'status': 'found'
                    }
        
        return {'url': '', 'type': '', 'status': 'not_found'}
        
    except Exception as e:
        return {'url': '', 'type': '', 'status': 'error'}

def process_profile(profile_data):
    """
    Process a single profile
    """
    username = profile_data['username']
    profile_url = profile_data['url']
    
    # Add small random delay
    time.sleep(random.uniform(0.5, 2))
    
    result = fetch_instagram_post(username)
    
    return {
        'profile_url': profile_url,
        'username': username,
        'post_url': result['url'],
        'post_type': result['type'],
        'status': result['status']
    }

def process_all_profiles():
    """
    Process all profiles with parallel execution
    """
    # Read profile links
    profiles = []
    with open('profile_link.txt', 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines[1:]:  # Skip header
            url = line.strip()
            if url and url.startswith('http'):
                username = url.replace('https://www.instagram.com/', '').strip('/')
                profiles.append({
                    'url': url,
                    'username': username
                })
    
    print(f"Processing {len(profiles)} profiles...")
    print("Using parallel processing for faster execution.\n")
    
    results = []
    successful = 0
    failed = 0
    
    # Process in batches with thread pool
    batch_size = 5
    max_workers = 3  # Limit concurrent requests
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for i in range(0, len(profiles), batch_size):
            batch = profiles[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(profiles) + batch_size - 1)//batch_size}...")
            
            # Submit batch for processing
            futures = {executor.submit(process_profile, p): p for p in batch}
            
            for future in as_completed(futures):
                profile = futures[future]
                try:
                    result = future.result(timeout=15)
                    results.append(result)
                    
                    if result['status'] == 'found':
                        successful += 1
                        print(f"  ✓ @{result['username']}: {result['post_type']}")
                    else:
                        failed += 1
                        print(f"  ✗ @{result['username']}: no posts")
                        
                except Exception as e:
                    failed += 1
                    results.append({
                        'profile_url': profile['url'],
                        'username': profile['username'],
                        'post_url': '',
                        'post_type': '',
                        'status': 'error'
                    })
                    print(f"  ✗ @{profile['username']}: error")
            
            # Save progress
            if (i + batch_size) % 20 == 0 or i + batch_size >= len(profiles):
                save_results(results, 'profile_posts_real.csv')
                print(f"  [Saved: {len(results)} profiles processed]")
            
            # Small delay between batches
            if i + batch_size < len(profiles):
                time.sleep(2)
    
    # Final save
    save_results(results, 'profile_posts_real.csv')
    
    print("\n" + "=" * 50)
    print(f"Completed!")
    print(f"✓ Successful: {successful}")
    print(f"✗ Failed: {failed}")
    print(f"Total: {len(profiles)}")
    print(f"Results saved to: profile_posts_real.csv")
    
    return results

def save_results(results, filename):
    """
    Save results to CSV
    """
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['profile_url', 'username', 'post_url', 'post_type', 'status']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        # Test mode - process first 10 profiles
        print("Test mode: Processing first 10 profiles only\n")
        import shutil
        
        # Backup and create temp file
        with open('profile_link.txt', 'r') as f:
            lines = f.readlines()
        
        with open('profile_link_temp.txt', 'w') as f:
            f.writelines(lines[:11])  # Header + 10 profiles
        
        # Temporarily swap files
        shutil.move('profile_link.txt', 'profile_link_full.txt')
        shutil.move('profile_link_temp.txt', 'profile_link.txt')
        
        try:
            process_all_profiles()
        finally:
            # Restore original file
            shutil.move('profile_link_full.txt', 'profile_link.txt')
    else:
        # Full mode - process all profiles
        process_all_profiles()