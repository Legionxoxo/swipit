#!/usr/bin/env python3
"""
Instagram oEmbed data extraction script
Based on working Python code provided by user
"""

import requests
import re
import json
import sys
import html
from urllib.parse import urlparse

def extract_from_embed_url(reel_url):
    """
    Try to get creator info using Instagram's oEmbed API
    """
    try:
        # Instagram's public oEmbed endpoint (updated) with URL encoding
        from urllib.parse import quote
        encoded_url = quote(reel_url, safe='')
        embed_url = f"https://www.instagram.com/oembed/?url={encoded_url}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; oEmbed)'
        }
        
        print(f"Trying oEmbed API: {embed_url}", file=sys.stderr)
        response = requests.get(embed_url, headers=headers, timeout=10)
        print(f"oEmbed API status: {response.status_code}", file=sys.stderr)
        
        if response.status_code == 200:
            data = response.json()
            print(f"oEmbed response: {data}", file=sys.stderr)
            
            # Return ALL available data from oEmbed API
            return data
        
        return None
    except Exception as e:
        print(f"oEmbed attempt failed: {e}", file=sys.stderr)
        return None

def extract_shortcode_from_url(url):
    """
    Extract shortcode (unique ID) from Instagram URL
    """
    try:
        # Match patterns like /p/ABC123/ or /reel/ABC123/
        match = re.search(r'/(?:p|reel)/([A-Za-z0-9_-]+)', url)
        if match:
            return match.group(1)
        return None
    except Exception as e:
        print(f"Error extracting shortcode: {e}", file=sys.stderr)
        return None

def get_reel_creator(reel_url):
    """
    Extract creator information from Instagram reel URL
    """
    
    # Extract shortcode from URL
    shortcode = extract_shortcode_from_url(reel_url)
    print(f"Extracted shortcode: {shortcode}", file=sys.stderr)
    
    # Skip oEmbed API for now - it's not working reliably
    # oembed_result = extract_from_embed_url(reel_url)
    # if oembed_result:
    #     return oembed_result
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',  # Removed 'br' to avoid Brotli compression
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
    }
    
    try:
        print(f"Fallback: Fetching URL directly: {reel_url}", file=sys.stderr)
        response = requests.get(reel_url, headers=headers, timeout=15, allow_redirects=True)
        print(f"Response status: {response.status_code}", file=sys.stderr)
        response.raise_for_status()
        
        # Check if content is compressed
        content_encoding = response.headers.get('content-encoding', '')
        print(f"Content encoding: {content_encoding}", file=sys.stderr)
        print(f"Response headers: {dict(response.headers)}", file=sys.stderr)
        
        # Use response.text which should handle decompression automatically
        content = response.text
        print(f"Content length: {len(content)} characters", file=sys.stderr)
        print(f"First 500 chars: {repr(content[:500])}", file=sys.stderr)
        print(f"Content type: {response.headers.get('content-type', 'unknown')}", file=sys.stderr)
        
        # Extract additional metadata
        thumbnail_url = None
        clean_caption = ""
        
        # Look for thumbnail in meta tags
        thumbnail_patterns = [
            r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+name=["\']twitter:image["\']\s+content=["\']([^"\']+)["\']',
            r'<link\s+rel=["\']image_src["\']\s+href=["\']([^"\']+)["\']'
        ]
        
        for pattern in thumbnail_patterns:
            thumb_match = re.search(pattern, content, re.IGNORECASE)
            if thumb_match:
                thumbnail_url = thumb_match.group(1)
                print(f"Found thumbnail URL: {thumbnail_url}", file=sys.stderr)
                break
        
        # Method 1: Look for different JavaScript data patterns
        
        # Pattern 1: window._sharedData
        script_match = re.search(r'window\._sharedData\s*=\s*({.+?});', content, re.DOTALL)
        if script_match:
            try:
                shared_data = json.loads(script_match.group(1))
                print("Found shared data", file=sys.stderr)
                # Navigate through the shared data structure to find user info
                entry_data = shared_data.get('entry_data', {})
                if 'PostPage' in entry_data:
                    posts = entry_data['PostPage']
                    if posts and len(posts) > 0:
                        post = posts[0]
                        media = post.get('graphql', {}).get('shortcode_media', {})
                        owner = media.get('owner', {})
                        username = owner.get('username', '')
                        author_id = owner.get('id', '')  # Extract the actual Instagram user ID
                        print(f"Found author_id from shared data: {author_id}", file=sys.stderr)
                        
                        if username and author_id:
                            caption_text = media.get('edge_media_to_caption', {}).get('edges', [{}])[0].get('node', {}).get('text', '')
                            return {
                                'author_name': username,
                                'username': username,
                                'author_id': author_id,
                                'profile_link': f'https://www.instagram.com/{username}/',
                                'instagram_id': shortcode,
                                'shortcode': shortcode,
                                'caption': caption_text,
                                'title': caption_text,
                                'author_url': f'https://www.instagram.com/{username}/',
                                'thumbnail_url': thumbnail_url,
                                'post_link': reel_url,
                                'embed_link': f'https://www.instagram.com/p/{shortcode}/embed/',
                                'html_embed': f'<blockquote class="instagram-media" data-instgrm-permalink="{reel_url}"><a href="{reel_url}">Instagram post</a></blockquote><script async src="//www.instagram.com/embed.js"></script>',
                                'provider_name': 'Instagram',
                                'provider_url': 'https://www.instagram.com',
                                'version': '1.0',
                                'type': 'rich'
                            }
                        elif username and not author_id:
                            print("Found username but no author_id in shared data", file=sys.stderr)
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Failed to parse shared data: {e}", file=sys.stderr)
        else:
            print("No window._sharedData found", file=sys.stderr)
        
        # Pattern 2: Look for other script patterns with user data
        script_patterns = [
            r'window\.__additionalDataLoaded\([^,]+,({[^}]+\"id\":\"(\d+)\"[^}]+})\)',
            r'"owner":\s*{\s*"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"',
            r'"user":\s*{\s*"pk":\s*"?(\d+)"?[^}]*"username":\s*"([^"]+)"',
            r'instagram://user\?id=(\d+)',
        ]
        
        for i, pattern in enumerate(script_patterns):
            matches = re.findall(pattern, content)
            if matches:
                print(f"Found matches with pattern {i+1}: {matches[:3]}", file=sys.stderr)  # Show first 3 matches
                
                for match in matches:
                    if isinstance(match, tuple) and len(match) >= 2:
                        if pattern == script_patterns[1] or pattern == script_patterns[2]:  # owner/user patterns
                            author_id = match[0]
                            username = match[1]
                        else:
                            continue
                            
                        if author_id and username:
                            print(f"Found author_id {author_id} and username {username} from pattern {i+1}", file=sys.stderr)
                            
                            # Extract caption from meta content we should have found
                            caption_text = ""
                            title_text = ""
                            
                            # Look for the caption in meta content
                            meta_patterns = [
                                r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                                r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']',
                                r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']'
                            ]
                            
                            for meta_pattern in meta_patterns:
                                meta_match = re.search(meta_pattern, content, re.IGNORECASE)
                                if meta_match:
                                    meta_content = meta_match.group(1)
                                    title_text = meta_content
                                    
                                    # Extract clean caption from meta content
                                    # Remove the "@username on Instagram: " prefix and extract the quoted content
                                    caption_match = re.search(r':\s*["\u201C\u0022]([^"\u201D\u0022]*)["\u201D\u0022]', html.unescape(meta_content))
                                    if caption_match:
                                        caption_text = caption_match.group(1)
                                        print(f"Extracted caption from meta: {caption_text[:100]}...", file=sys.stderr)
                                    break
                            
                            return {
                                'author_name': username,
                                'username': username,
                                'author_id': author_id,
                                'profile_link': f'https://www.instagram.com/{username}/',
                                'instagram_id': shortcode,
                                'shortcode': shortcode,
                                'caption': caption_text,
                                'title': title_text,
                                'author_url': f'https://www.instagram.com/{username}/',
                                'thumbnail_url': thumbnail_url,
                                'post_link': reel_url,
                                'embed_link': f'https://www.instagram.com/p/{shortcode}/embed/',
                                'html_embed': f'<blockquote class="instagram-media" data-instgrm-permalink="{reel_url}"><a href="{reel_url}">Instagram post</a></blockquote><script async src="//www.instagram.com/embed.js"></script>',
                                'provider_name': 'Instagram',
                                'provider_url': 'https://www.instagram.com',
                                'version': '1.0',
                                'type': 'rich'
                            }
        
        # Method 2: Try one more time with looser patterns for author_id
        looser_patterns = [
            r'"pk":\s*"?(\d+)"?[^}]*"username":\s*"([^"]+)"',  # Different format
            r'"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"',     # Simple id format
            r'instagram\.com\/([^\/\?]+)[\/\?].*"pk"[^}]*"(\d+)"',  # URL with pk
        ]
        
        for i, pattern in enumerate(looser_patterns):
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                print(f"Found matches with looser pattern {i+1}: {matches[:2]}", file=sys.stderr)
                for match in matches:
                    if isinstance(match, tuple) and len(match) >= 2:
                        if 'pk' in pattern or '"id"' in pattern:
                            author_id = match[0] 
                            username = match[1]
                        else:
                            continue
                            
                        if author_id and username and username.lower() != 'instagram':
                            print(f"Found author_id {author_id} and username {username} from looser pattern {i+1}", file=sys.stderr)
                            
                            # Extract caption from meta content
                            caption_text = ""
                            title_text = ""
                            
                            meta_patterns = [
                                r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                                r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']'
                            ]
                            
                            for meta_pattern in meta_patterns:
                                meta_match = re.search(meta_pattern, content, re.IGNORECASE)
                                if meta_match:
                                    meta_content = meta_match.group(1)
                                    title_text = meta_content
                                    
                                    # Extract caption from the quoted part
                                    decoded_content = html.unescape(meta_content)
                                    caption_match = re.search(r':\s*["\u201C\u0022]([^"\u201D\u0022]*)["\u201D\u0022]', decoded_content)
                                    if caption_match:
                                        caption_text = caption_match.group(1).strip()
                                        print(f"Extracted caption: {caption_text[:100]}...", file=sys.stderr)
                                    break
                            
                            return {
                                'author_name': username,
                                'username': username,
                                'author_id': author_id,
                                'profile_link': f'https://www.instagram.com/{username}/',
                                'instagram_id': shortcode,
                                'shortcode': shortcode,
                                'caption': caption_text,
                                'title': title_text,
                                'author_url': f'https://www.instagram.com/{username}/',
                                'thumbnail_url': thumbnail_url,
                                'post_link': reel_url,
                                'embed_link': f'https://www.instagram.com/p/{shortcode}/embed/',
                                'html_embed': f'<blockquote class="instagram-media" data-instgrm-permalink="{reel_url}"><a href="{reel_url}">Instagram post</a></blockquote><script async src="//www.instagram.com/embed.js"></script>',
                                'provider_name': 'Instagram',
                                'provider_url': 'https://www.instagram.com',
                                'version': '1.0',
                                'type': 'rich'
                            }

        # Method 3: Extract from meta tags using regex (as fallback if no author_id found)
        print("No author_id found, trying meta tag extraction", file=sys.stderr)
        meta_patterns = [
            r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+property=["\']twitter:title["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+property=["\']twitter:description["\']\s+content=["\']([^"\']+)["\']'
        ]
        
        for pattern in meta_patterns:
            meta_match = re.search(pattern, content, re.IGNORECASE)
            if meta_match:
                content_text = meta_match.group(1)
                print(f"Found meta content: {content_text}", file=sys.stderr)
                
                # Look for patterns like "@username" or "username on Instagram"
                username_patterns = [
                    r'@([a-zA-Z0-9._]+)',
                    r'([a-zA-Z0-9._]+)\s+on Instagram',
                    r'Instagram post by ([a-zA-Z0-9._]+)',
                ]
                
                for username_pattern in username_patterns:
                    match = re.search(username_pattern, content_text, re.IGNORECASE)
                    if match:
                        username = match.group(1)
                        if username and username.lower() != 'instagram':
                            print("Found username from meta tags but no author_id available", file=sys.stderr)
                            return {'error': 'Could not extract author ID from Instagram post'}
        
        # Method 3: Look in page title
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
        if title_match:
            title_text = title_match.group(1)
            print(f"Page title: {title_text}", file=sys.stderr)
            
            # Various title patterns Instagram uses
            patterns = [
                r'^(.+?)\s+on Instagram',
                r'Instagram post by (.+?)\s',
                r'@([a-zA-Z0-9._]+)',
                r'"([^"]+)"\s+•.*Instagram'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, title_text)
                if match:
                    potential_username = match.group(1).strip()
                    # Clean username
                    clean_username = re.sub(r'[^a-zA-Z0-9._]', '', potential_username)
                    if clean_username and len(clean_username) > 0:
                        print("Found username from page title but no author_id available", file=sys.stderr)
                        return {'error': 'Could not extract author ID from Instagram post'}
        
        print("No extraction methods succeeded", file=sys.stderr)
        return {'error': 'Could not extract creator information'}
        
    except requests.RequestException as e:
        return {'error': f'Request failed: {str(e)}'}
    except Exception as e:
        return {'error': f'Parsing failed: {str(e)}'}

def analyze_content(reel_data):
    """
    Analyze reel content for additional insights
    """
    analysis = {}
    
    # Get caption from title field and decode HTML entities
    caption = reel_data.get('title', '')
    if caption:
        # Decode HTML entities first
        clean_caption = html.unescape(caption)
        
        # Extract hashtags from cleaned text
        hashtags = re.findall(r'#[a-zA-Z0-9_]+', clean_caption)
        if hashtags:
            analysis['hashtags'] = [tag[1:] for tag in hashtags]  # Remove # symbol
            analysis['hashtag_count'] = len(hashtags)
        
        # Extract mentions (@username) from cleaned text
        mentions = re.findall(r'@[a-zA-Z0-9_.]+', clean_caption)
        if mentions:
            analysis['mentions'] = [mention[1:] for mention in mentions]  # Remove @ symbol
            analysis['mention_count'] = len(mentions)
        
        # Basic text analysis (using cleaned text)
        analysis['character_count'] = len(clean_caption)
        analysis['word_count'] = len(clean_caption.split())
        analysis['line_count'] = clean_caption.count('\n') + 1
    
    return analysis

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python instagram_oembed.py <instagram_url>'}))
        sys.exit(1)
    
    reel_url = sys.argv[1]
    
    print(f"Extracting reel info from: {reel_url}", file=sys.stderr)
    
    reel_info = get_reel_creator(reel_url)
    
    if 'error' in reel_info:
        print(json.dumps({'success': False, 'error': reel_info['error']}))
    else:
        # Add content analysis
        analysis = analyze_content(reel_info)
        if analysis:
            reel_info.update(analysis)
        
        # Output JSON result to stdout
        print(json.dumps({'success': True, 'data': reel_info}))

if __name__ == "__main__":
    main()