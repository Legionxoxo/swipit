#!/usr/bin/env python3
"""
Instagram Profile and Reel Scraper using instaloader with authentication
Extracts profile information and post/reel data from Instagram profiles
"""

import sys
import json
import argparse
import instaloader
from datetime import datetime, timezone
import os
import getpass


def log_progress(message, progress=None):
    """Log progress with JSON format for Node.js parsing"""
    progress_data = {
        "type": "progress", 
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if progress is not None:
        progress_data["progress"] = progress
    
    print(json.dumps(progress_data), flush=True)


def log_error(message, error=None):
    """Log error with JSON format for Node.js parsing"""
    error_data = {
        "type": "error",
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if error:
        error_data["error"] = str(error)
    
    print(json.dumps(error_data), flush=True)


def setup_instaloader():
    """Setup instaloader with proper configuration"""
    try:
        # Create instaloader instance with conservative settings
        loader = instaloader.Instaloader(
            # Avoid downloading files - we only want metadata
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            
            # Conservative rate limiting
            sleep=True,
            max_connection_attempts=3,
            request_timeout=60,
        )
        
        # Set slower request rate to avoid rate limits
        loader.context.sleep_factor = 2.0
        
        return loader
        
    except Exception as error:
        log_error("Failed to setup instaloader", error)
        raise error


def authenticate_instagram(loader, username=None, password=None, extension_cookies=None):
    """
    Authenticate with Instagram using various methods
    
    Args:
        loader: Instaloader instance
        username: Instagram username (optional)
        password: Instagram password (optional)
        extension_cookies: Dict of extension cookies for authentication (optional)
        
    Returns:
        bool: True if authenticated successfully
    """
    try:
        log_progress("Attempting Instagram authentication", 5)
        
        # Method 1: Try to load session with extension cookies
        if extension_cookies:
            try:
                log_progress("Trying to load session with extension cookies", 6)
                # Convert extension cookies to session data format
                session_data = {}
                for cookie in extension_cookies:
                    if cookie['name'] in ['sessionid', 'csrftoken', 'ds_user_id', 'mid', 'ig_did', 'shbid', 'shbts', 'rur']:
                        session_data[cookie['name']] = cookie['value']
                
                if session_data.get('sessionid'):
                    # Create a dummy username for session loading
                    loader.load_session("extension_user", session_data)
                    log_progress("Successfully loaded session with extension cookies", 10)
                    return True
                else:
                    log_progress("No sessionid found in extension cookies", 7)
            except Exception as session_error:
                log_progress(f"Extension cookie session loading failed: {str(session_error)}", 7)
        
        # Method 2: Try to load session with hardcoded cookies (fallback)
        try:
            log_progress("Trying to load session with fallback cookies", 6)
            session_data = {
                "csrftoken": "P1OEVTOfy4AaElXRPw7HxzuMTM5LLRFM",
                "sessionid": "",
                "ds_user_id": "",
                "mid": "",
                "ig_did": ""
            }
            loader.load_session("dummy_user", session_data)
            log_progress("Successfully loaded session with fallback cookies", 10)
            return True
        except Exception as session_error:
            log_progress("Fallback cookie session loading failed, trying other methods", 7)
        
        # Method 3: Try to load existing session from file
        if username:
            try:
                log_progress(f"Trying to load existing session file for {username}", 6)
                loader.load_session_from_file(username)
                log_progress("Successfully loaded existing session from file", 10)
                return True
            except Exception as session_error:
                log_progress("No existing session file found", 7)
        
        # Method 4: Use provided credentials
        if username and password:
            try:
                log_progress("Logging in with provided credentials", 8)
                loader.login(username, password)
                log_progress("Successfully authenticated with credentials", 10)
                return True
            except Exception as login_error:
                log_error(f"Failed to login with credentials: {str(login_error)}", login_error)
                return False
        
        # Method 5: Interactive login (for testing/manual use)
        if username and not password:
            try:
                log_progress("Attempting interactive login", 8)
                loader.interactive_login(username)
                log_progress("Successfully authenticated interactively", 10)
                return True
            except Exception as interactive_error:
                log_error(f"Interactive login failed: {str(interactive_error)}", interactive_error)
                return False
        
        # Method 6: Try without authentication (limited data)
        log_progress("Proceeding without authentication (limited data available)", 10)
        return False
        
    except Exception as auth_error:
        log_error("Authentication process failed", auth_error)
        return False


def extract_post_data(post):
    """
    Extract all available data from an Instagram post
    
    Args:
        post: instaloader Post object
        
    Returns:
        dict: Complete post data
    """
    try:
        # Basic post data
        post_data = {
            "id": str(post.mediaid),
            "shortcode": post.shortcode,
            "typename": post.typename,
            "url": f"https://instagram.com/p/{post.shortcode}/",
            "thumbnail_url": post.url,
            "caption": post.caption or "",
            "likes": post.likes,
            "comments": post.comments,
            "date_posted": post.date_utc.isoformat() if post.date_utc else None,
            "is_video": post.is_video,
            "is_pinned": post.is_pinned,
            "is_sponsored": post.is_sponsored,
            "accessibility_caption": getattr(post, 'accessibility_caption', ''),
            "owner_username": post.owner_username,
            "owner_id": post.owner_id
        }
        
        # Hashtags and mentions (built-in properties)
        post_data["hashtags"] = post.caption_hashtags if hasattr(post, 'caption_hashtags') else []
        post_data["mentions"] = post.caption_mentions if hasattr(post, 'caption_mentions') else []
        
        # Video-specific data
        if post.is_video:
            post_data.update({
                "video_duration": getattr(post, 'video_duration', 0),
                "video_views": getattr(post, 'video_view_count', 0),
                "video_url": getattr(post, 'video_url', ''),
                "url": f"https://instagram.com/reel/{post.shortcode}/"  # Update URL for reels
            })
        
        # Location data (if available)
        if hasattr(post, 'location') and post.location:
            post_data["location"] = {
                "name": getattr(post.location, 'name', ''),
                "id": getattr(post.location, 'id', '')
            }
        else:
            post_data["location"] = None
            
        # Tagged users (if available)
        if hasattr(post, 'tagged_users'):
            post_data["tagged_users"] = [user.username for user in post.tagged_users]
        else:
            post_data["tagged_users"] = []
            
        return post_data
        
    except Exception as error:
        log_error(f"Error extracting post data: {str(error)}", error)
        return None


def scrape_instagram_profile(username, analysis_id, auth_username=None, auth_password=None, extension_cookies=None):
    """
    Scrape Instagram profile and extract post/reel data with authentication
    
    Args:
        username (str): Instagram username to analyze
        analysis_id (str): Analysis ID for tracking
        auth_username (str): Authentication username (optional)
        auth_password (str): Authentication password (optional)
        extension_cookies (list): Extension cookies for authentication (optional)
        
    Returns:
        dict: Analysis results with profile and post data
    """
    try:
        log_progress(f"Starting Instagram analysis for @{username}", 0)
        
        # Setup instaloader
        loader = setup_instaloader()
        
        # Authenticate (optional but enables full data access)
        authenticated = authenticate_instagram(loader, auth_username, auth_password, extension_cookies)
        
        # Get profile information
        try:
            log_progress(f"Fetching profile information for @{username}", 15)
            profile = instaloader.Profile.from_username(loader.context, username)
            
        except instaloader.ProfileNotExistsException:
            raise Exception(f"Instagram profile '@{username}' does not exist")
        except instaloader.LoginRequiredException:
            raise Exception(f"Profile '@{username}' is private and requires authentication")
        except Exception as error:
            raise Exception(f"Failed to access profile '@{username}': {str(error)}")
        
        log_progress("Profile information retrieved", 25)
        
        # Extract profile data
        profile_data = {
            "instagram_user_id": str(profile.userid),
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "follower_count": profile.followers,
            "following_count": profile.followees,
            "media_count": profile.mediacount,
            "is_private": profile.is_private,
            "is_verified": profile.is_verified,
            "external_url": profile.external_url,
            "profile_pic_url": profile.profile_pic_url
        }
        
        log_progress("Profile data extracted", 30)
        
        # Check if profile is private and we're not authenticated
        if profile.is_private and not authenticated:
            return {
                "success": True,
                "profile": profile_data,
                "reels": [],
                "all_posts": [],
                "total_reels": 0,
                "total_posts": 0,
                "authenticated": False,
                "message": "Profile is private - authentication required for post data"
            }
        
        # Extract posts and reels
        log_progress("Fetching posts and reels data", 40)
        posts = []
        reels = []
        post_count = 0
        reel_count = 0
        
        try:
            total_media = profile.mediacount
            
            # Get posts (requires authentication for full access)
            for post_index, post in enumerate(profile.get_posts()):
                try:
                    # Update progress
                    if post_index % 5 == 0:
                        progress = min(40 + int((post_index / max(total_media, 1)) * 50), 90)
                        log_progress(f"Processing post {post_index + 1}/{total_media}", progress)
                    
                    # Extract post data
                    post_data = extract_post_data(post)
                    if post_data:
                        posts.append(post_data)
                        post_count += 1
                        
                        # If it's a video, also add to reels
                        if post.is_video:
                            reel_data = post_data.copy()
                            reel_data.update({
                                "reel_id": post_data["id"],
                                "reel_shortcode": post_data["shortcode"],
                                "reel_url": post_data["url"],
                                "reel_thumbnail_url": post_data["thumbnail_url"],
                                "reel_caption": post_data["caption"],
                                "reel_likes": post_data["likes"],
                                "reel_comments": post_data["comments"],
                                "reel_views": post_data.get("video_views", 0),
                                "reel_date_posted": post_data["date_posted"],
                                "reel_duration": post_data.get("video_duration", 0),
                                "reel_is_video": True,
                                "reel_hashtags": post_data["hashtags"],
                                "reel_mentions": post_data["mentions"]
                            })
                            reels.append(reel_data)
                            reel_count += 1
                    
                    # Limit posts to avoid excessive processing
                    if post_index >= 100:  # Limit to first 100 posts
                        log_progress("Reached post limit (100), stopping processing", progress)
                        break
                        
                except Exception as post_error:
                    log_error(f"Error processing post {post_index + 1}: {str(post_error)}", post_error)
                    continue
                    
        except Exception as posts_error:
            log_error(f"Error accessing posts: {str(posts_error)}", posts_error)
            # Continue with profile data if posts fail
        
        log_progress("Data extraction completed", 95)
        
        # Prepare final response
        result = {
            "success": True,
            "profile": profile_data,
            "reels": reels,
            "all_posts": posts,
            "total_reels": reel_count,
            "total_posts": post_count,
            "authenticated": authenticated,
            "message": f"Successfully extracted {post_count} posts ({reel_count} reels) from @{username}"
        }
        
        if not authenticated:
            result["warning"] = "Limited data access without authentication. Login to get full post data."
        
        log_progress("Analysis completed successfully", 100)
        return result
        
    except Exception as error:
        log_error(f"Instagram scraping failed for @{username}", error)
        return {
            "success": False,
            "error": str(error),
            "profile": None,
            "reels": [],
            "all_posts": [],
            "total_reels": 0,
            "total_posts": 0,
            "authenticated": False,
            "message": f"Failed to analyze @{username}: {str(error)}"
        }


def main():
    """Main function to parse arguments and run scraper"""
    try:
        parser = argparse.ArgumentParser(description='Instagram Profile and Reel Scraper with Authentication')
        parser.add_argument('--username', required=True, help='Instagram username to analyze (without @)')
        parser.add_argument('--analysis-id', required=True, help='Analysis ID for tracking')
        parser.add_argument('--auth-username', help='Instagram login username (for authentication)')
        parser.add_argument('--auth-password', help='Instagram login password (for authentication)')
        parser.add_argument('--extension-cookies', help='Extension cookies as JSON string (for authentication)')
        
        args = parser.parse_args()
        
        # Clean and validate inputs
        username = args.username.replace('@', '').strip()
        analysis_id = args.analysis_id.strip()
        auth_username = args.auth_username.strip() if args.auth_username else None
        auth_password = args.auth_password if args.auth_password else None
        
        # Parse extension cookies
        extension_cookies = None
        if args.extension_cookies:
            try:
                extension_cookies = json.loads(args.extension_cookies)
            except json.JSONDecodeError as e:
                log_error(f"Failed to parse extension cookies JSON: {str(e)}")
                extension_cookies = None
        
        if not username:
            raise ValueError("Username cannot be empty")
        if not analysis_id:
            raise ValueError("Analysis ID cannot be empty")
            
        # Run the scraper
        result = scrape_instagram_profile(username, analysis_id, auth_username, auth_password, extension_cookies)
        
        # Output final result as JSON to stdout only
        print(json.dumps(result), flush=True)
        
        # Exit with appropriate code
        sys.exit(0 if result.get("success", False) else 1)
        
    except Exception as error:
        error_result = {
            "success": False,
            "error": str(error),
            "message": f"Scraper initialization failed: {str(error)}"
        }
        print(json.dumps(error_result), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()