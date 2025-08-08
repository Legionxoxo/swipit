#!/usr/bin/env python3
"""
Persistent Python API server for handling Instagram scraping and oEmbed requests
Reads JSON requests from stdin and outputs JSON responses to stdout
"""

import json
import sys
import traceback
import os
from datetime import datetime

# Import existing modules
try:
    from instagram_oembed import extract_from_embed_url, extract_shortcode_from_url
    from instagram_scraper import main as instagram_scraper_main
except ImportError as e:
    print(json.dumps({
        "type": "log",
        "message": f"Import error: {e}",
        "level": "error",
        "timestamp": datetime.now().isoformat()
    }), file=sys.stderr, flush=True)


def log_message(message, level="info"):
    """Log a message to stderr"""
    try:
        log_data = {
            "type": "log",
            "message": str(message),
            "level": level,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(log_data), file=sys.stderr, flush=True)
    except Exception as e:
        print(f"Logging error: {e}", file=sys.stderr, flush=True)
    finally:
        # Logging completed
        pass


def send_response(request_id, success, data=None, error=None, progress_logs=None):
    """Send JSON response to stdout"""
    try:
        response = {
            "id": request_id,
            "success": success,
            "timestamp": datetime.now().isoformat()
        }
        
        if success and data is not None:
            response["data"] = data
            
        if not success and error:
            response["error"] = str(error)
            
        if progress_logs:
            response["progressLogs"] = progress_logs
            
        print(json.dumps(response), flush=True)
        
    except Exception as e:
        # Fallback error response
        try:
            fallback_response = {
                "id": request_id,
                "success": False,
                "error": f"Response serialization error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            print(json.dumps(fallback_response), flush=True)
        except:
            pass
    finally:
        # Response sending completed
        pass


def handle_instagram_oembed(request_id, params):
    """Handle Instagram oEmbed request"""
    try:
        post_url = params.get('postUrl')
        if not post_url:
            send_response(request_id, False, error="Post URL is required")
            return
            
        log_message(f"Processing oEmbed request for: {post_url}")
        
        # Use existing oEmbed function
        oembed_data = extract_from_embed_url(post_url)
        
        if oembed_data:
            # Extract shortcode for additional data
            shortcode = extract_shortcode_from_url(post_url)
            if shortcode:
                oembed_data['shortcode'] = shortcode
                oembed_data['instagram_id'] = shortcode
                
            # Add additional fields
            if 'author_name' in oembed_data and 'username' not in oembed_data:
                oembed_data['username'] = oembed_data['author_name']
                
            if 'author_url' in oembed_data and 'profile_link' not in oembed_data:
                oembed_data['profile_link'] = oembed_data['author_url']
                
            if 'title' in oembed_data and 'caption' not in oembed_data:
                oembed_data['caption'] = oembed_data['title']
                
            # Extract hashtags from caption
            if 'caption' in oembed_data and oembed_data['caption']:
                import re
                hashtag_pattern = r'#[a-zA-Z0-9_\u00c0-\u024f\u1e00-\u1eff]+'
                hashtags = re.findall(hashtag_pattern, oembed_data['caption'])
                oembed_data['hashtags'] = [tag[1:] for tag in hashtags]  # Remove # symbol
            else:
                oembed_data['hashtags'] = []
                
            # Create embed link
            if shortcode:
                oembed_data['embed_link'] = f"https://www.instagram.com/p/{shortcode}/embed/"
                
            oembed_data['post_link'] = post_url
            
            log_message("oEmbed request successful")
            send_response(request_id, True, data=oembed_data)
        else:
            send_response(request_id, False, error="Failed to fetch oEmbed data")
            
    except Exception as e:
        log_message(f"oEmbed error: {str(e)}", "error")
        send_response(request_id, False, error=f"oEmbed processing error: {str(e)}")
    finally:
        # oEmbed handling completed
        pass


def handle_instagram_scraper(request_id, params):
    """Handle Instagram scraper request"""
    try:
        username = params.get('username')
        analysis_id = params.get('analysisId')
        extension_cookies = params.get('extensionCookies')
        
        if not username:
            send_response(request_id, False, error="Username is required")
            return
            
        if not analysis_id:
            send_response(request_id, False, error="Analysis ID is required")
            return
            
        log_message(f"Processing scraper request for: {username}")
        
        # Build arguments for scraper
        args = ['--username', username, '--analysis-id', analysis_id]
        
        if extension_cookies:
            args.extend(['--extension-cookies', json.dumps(extension_cookies)])
            
        # Mock sys.argv for the scraper
        original_argv = sys.argv
        sys.argv = ['instagram_scraper.py'] + args
        
        try:
            # Call existing scraper main function
            result = instagram_scraper_main()
            
            if result and isinstance(result, dict):
                log_message("Scraper request successful")
                send_response(request_id, True, data=result)
            else:
                send_response(request_id, False, error="Scraper returned invalid result")
                
        except Exception as scraper_error:
            log_message(f"Scraper execution error: {str(scraper_error)}", "error")
            send_response(request_id, False, error=f"Scraper error: {str(scraper_error)}")
        finally:
            sys.argv = original_argv
            
    except Exception as e:
        log_message(f"Scraper error: {str(e)}", "error")
        send_response(request_id, False, error=f"Scraper processing error: {str(e)}")
    finally:
        # Scraper handling completed
        pass


def handle_test_environment(request_id, params):
    """Handle environment test request"""
    try:
        log_message("Testing Python environment")
        
        # Test basic functionality
        test_results = {
            "python_version": sys.version,
            "modules": {
                "requests": False,
                "json": True,
                "sys": True,
                "os": True
            }
        }
        
        # Test module imports
        try:
            import requests
            test_results["modules"]["requests"] = True
        except ImportError:
            pass
            
        log_message("Environment test completed")
        send_response(request_id, True, data=test_results)
        
    except Exception as e:
        log_message(f"Environment test error: {str(e)}", "error")
        send_response(request_id, False, error=f"Environment test error: {str(e)}")
    finally:
        # Environment test completed
        pass


def process_request(request_data):
    """Process a single request"""
    try:
        request_id = request_data.get('id')
        action = request_data.get('action')
        params = request_data.get('params', {})
        
        if not request_id:
            log_message("Request missing ID", "error")
            return
            
        if not action:
            send_response(request_id, False, error="Action is required")
            return
            
        log_message(f"Processing request {request_id}: {action}")
        
        # Route to appropriate handler
        if action == 'instagram_oembed':
            handle_instagram_oembed(request_id, params)
        elif action == 'instagram_scraper':
            handle_instagram_scraper(request_id, params)
        elif action == 'test_environment':
            handle_test_environment(request_id, params)
        else:
            send_response(request_id, False, error=f"Unknown action: {action}")
            
    except Exception as e:
        log_message(f"Request processing error: {str(e)}", "error")
        if 'request_id' in locals():
            send_response(request_id, False, error=f"Request processing error: {str(e)}")
    finally:
        # Request processing completed
        pass


def main():
    """Main server loop"""
    try:
        log_message("Python API server starting...")
        log_message(f"Python version: {sys.version}")
        log_message(f"Working directory: {os.getcwd()}")
        
        # Main request processing loop
        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue
                    
                # Parse JSON request
                request_data = json.loads(line)
                process_request(request_data)
                
            except json.JSONDecodeError as e:
                log_message(f"Invalid JSON request: {str(e)}", "error")
                continue
            except Exception as e:
                log_message(f"Request handling error: {str(e)}", "error")
                continue
                
    except KeyboardInterrupt:
        log_message("Server interrupted by user")
    except Exception as e:
        log_message(f"Server error: {str(e)}", "error")
        traceback.print_exc(file=sys.stderr)
    finally:
        log_message("Python API server shutting down")


if __name__ == "__main__":
    main()