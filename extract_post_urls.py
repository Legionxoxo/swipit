#!/usr/bin/env python3

import csv

# Read the profile_posts_real.csv file
successful_posts = []

with open('profile_posts_real.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    for row in reader:
        # Only include successful entries with actual post URLs
        if row['status'] == 'found' and row['post_url']:
            successful_posts.append(row['post_url'])

# Write to new CSV with only post URLs
with open('post_urls_only.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['post_url'])  # Header
    for url in successful_posts:
        writer.writerow([url])

print(f"✓ Extracted {len(successful_posts)} successful post URLs")
print(f"✓ Saved to: post_urls_only.csv")

# Show sample
print("\nFirst 5 post URLs:")
for url in successful_posts[:5]:
    print(f"  - {url}")