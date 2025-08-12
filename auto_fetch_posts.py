#!/usr/bin/env python3

import csv
import time
import json
import re
from bs4 import BeautifulSoup
import requests
from urllib.parse import quote
import random

class InstagramPostFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }
        self.session.headers.update(self.headers)
    
    def fetch_profile_posts(self, username):
        """
        Fetch posts from an Instagram profile using web scraping
        """
        try:
            url = f'https://www.instagram.com/{username}/'
            
            # Add some randomization to avoid detection
            time.sleep(random.uniform(2, 4))
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                # Look for post IDs in the HTML
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Method 1: Look for posts in script tags
                scripts = soup.find_all('script', type='text/javascript')
                posts = []
                
                for script in scripts:
                    if script.string and 'window._sharedData' in script.string:
                        # Extract JSON data
                        parts = script.string.split('window._sharedData = ')
                        if len(parts) > 1:
                            json_text = parts[1].rstrip(';')
                        else:
                            continue
                        try:
                            data = json.loads(json_text)
                            # Navigate through the JSON structure
                            user_data = data.get('entry_data', {}).get('ProfilePage', [{}])[0]
                            graphql = user_data.get('graphql', {})
                            user = graphql.get('user', {})
                            media = user.get('edge_owner_to_timeline_media', {})
                            edges = media.get('edges', [])
                            
                            for edge in edges[:3]:  # Get first 3 posts
                                node = edge.get('node', {})
                                shortcode = node.get('shortcode')
                                is_video = node.get('is_video', False)
                                
                                if shortcode:
                                    post_type = 'reel' if is_video else 'p'
                                    post_url = f'https://www.instagram.com/{post_type}/{shortcode}/'
                                    posts.append({
                                        'url': post_url,
                                        'type': 'reel' if is_video else 'post'
                                    })
                        except (json.JSONDecodeError, KeyError, IndexError):
                            pass
                
                # Method 2: Look for links in the HTML
                if not posts:
                    # Find post links directly
                    post_links = soup.find_all('a', href=re.compile(r'/p/[A-Za-z0-9_-]+/'))
                    reel_links = soup.find_all('a', href=re.compile(r'/reel/[A-Za-z0-9_-]+/'))
                    
                    for link in post_links[:2]:
                        posts.append({
                            'url': 'https://www.instagram.com' + link['href'],
                            'type': 'post'
                        })
                    
                    for link in reel_links[:2]:
                        posts.append({
                            'url': 'https://www.instagram.com' + link['href'],
                            'type': 'reel'
                        })
                
                # Method 3: Use regex to find shortcodes
                if not posts:
                    # Look for shortcodes in the HTML
                    shortcode_pattern = r'"shortcode":"([A-Za-z0-9_-]+)"'
                    shortcodes = re.findall(shortcode_pattern, response.text)[:3]
                    
                    for shortcode in shortcodes:
                        posts.append({
                            'url': f'https://www.instagram.com/p/{shortcode}/',
                            'type': 'post'
                        })
                
                return posts[0] if posts else None
            
            return None
            
        except Exception as e:
            print(f"Error fetching {username}: {str(e)}")
            return None
    
    def validate_post_url(self, url):
        """
        Validate if a post URL is accessible
        """
        try:
            oembed_url = f"https://api.instagram.com/oembed?url={quote(url)}"
            response = requests.get(oembed_url, timeout=5)
            return response.status_code == 200
        except:
            return False

def fetch_with_graphql_api(username):
    """
    Alternative method using Instagram's GraphQL API
    """
    try:
        # Instagram's public GraphQL endpoint
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-IG-App-ID': '936619743392459',  # Instagram web app ID
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
                        'type': 'reel' if is_video else 'post'
                    }
        
        return None
        
    except Exception as e:
        return None

def process_profiles_auto():
    """
    Automatically fetch posts for all profiles
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
    print("This will take some time to avoid rate limiting.\n")
    
    fetcher = InstagramPostFetcher()
    results = []
    successful = 0
    failed = 0
    
    for i, profile in enumerate(profiles):
        username = profile['username']
        print(f"[{i+1}/{len(profiles)}] Fetching @{username}...", end=' ')
        
        # Try multiple methods
        post_data = None
        
        # Method 1: Web scraping
        post_data = fetcher.fetch_profile_posts(username)
        
        # Method 2: GraphQL API
        if not post_data:
            post_data = fetch_with_graphql_api(username)
        
        if post_data:
            print(f"✓ Found {post_data['type']}")
            results.append({
                'profile_url': profile['url'],
                'username': username,
                'post_url': post_data['url'],
                'post_type': post_data['type'],
                'status': 'found'
            })
            successful += 1
        else:
            print("✗ No posts found")
            results.append({
                'profile_url': profile['url'],
                'username': username,
                'post_url': '',
                'post_type': '',
                'status': 'not_found'
            })
            failed += 1
        
        # Save progress every 10 profiles
        if (i + 1) % 10 == 0:
            save_results(results, 'profile_posts_auto.csv')
            print(f"  [Progress saved: {successful} successful, {failed} failed]")
        
        # Rate limiting
        if i < len(profiles) - 1:
            delay = random.uniform(3, 6)
            time.sleep(delay)
    
    # Save final results
    save_results(results, 'profile_posts_auto.csv')
    
    print("\n" + "=" * 50)
    print(f"Completed!")
    print(f"✓ Successful: {successful}")
    print(f"✗ Failed: {failed}")
    print(f"Total: {len(profiles)}")
    print(f"Results saved to: profile_posts_auto.csv")
    
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

def test_single_profile(username):
    """
    Test fetching a single profile
    """
    print(f"Testing fetch for @{username}...")
    
    fetcher = InstagramPostFetcher()
    
    # Try web scraping
    print("Method 1: Web scraping...", end=' ')
    result1 = fetcher.fetch_profile_posts(username)
    if result1:
        print(f"✓ Found: {result1['url']}")
    else:
        print("✗ Failed")
    
    # Try GraphQL API
    print("Method 2: GraphQL API...", end=' ')
    result2 = fetch_with_graphql_api(username)
    if result2:
        print(f"✓ Found: {result2['url']}")
    else:
        print("✗ Failed")
    
    # Validate if found
    if result1:
        print(f"\nValidating URL...", end=' ')
        fetcher = InstagramPostFetcher()
        is_valid = fetcher.validate_post_url(result1['url'])
        print("✓ Valid" if is_valid else "✗ Invalid")
    
    return result1 or result2

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--test' and len(sys.argv) > 2:
            # Test single profile
            test_single_profile(sys.argv[2])
        elif sys.argv[1] == '--auto':
            # Process all profiles automatically
            process_profiles_auto()
        elif sys.argv[1] == '--sample':
            # Process first 5 profiles as sample
            print("Processing sample (first 5 profiles)...")
            # Temporarily limit profiles
            import shutil
            shutil.copy('profile_link.txt', 'profile_link_backup.txt')
            
            with open('profile_link.txt', 'r') as f:
                lines = f.readlines()
            
            with open('profile_link_temp.txt', 'w') as f:
                f.writelines(lines[:6])  # Header + 5 profiles
            
            shutil.move('profile_link_temp.txt', 'profile_link.txt')
            process_profiles_auto()
            shutil.move('profile_link_backup.txt', 'profile_link.txt')
    else:
        print("Instagram Automated Post Fetcher")
        print("=" * 40)
        print("\nUsage:")
        print("  python auto_fetch_posts.py --test USERNAME")
        print("    Test fetching for a single profile")
        print("\n  python auto_fetch_posts.py --sample")
        print("    Process first 5 profiles as a test")
        print("\n  python auto_fetch_posts.py --auto")
        print("    Process all profiles automatically")
        print("\nNote: Instagram may block requests if too many are made.")
        print("The script includes delays to minimize this risk.")