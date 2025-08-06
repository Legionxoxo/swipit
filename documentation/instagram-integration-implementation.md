# Instagram Integration Implementation Guide

## File Structure

Following the CLAUDE.md directory rules and maintaining consistency with the existing codebase structure:

```
backend/
├── database/
│   └── instagramDb.js                    # Database connection and Instagram operations
├── functions/
│   ├── analysis/
│   │   └── instagramJobManager.js        # Instagram job tracking and management
│   ├── route_fns/
│   │   └── analyzeInstagram.js           # Instagram analysis route functions
│   └── scripts/
│       └── instagram_scraper.py          # Python scraper script
├── utils/
│   ├── instagram/
│   │   ├── instagramService.js           # Main Instagram service orchestrator
│   │   ├── profileResolver.js            # Username to user ID conversion
│   │   └── reelService.js                # Reel data processing and storage
│   ├── python/
│   │   └── pythonExecutor.js             # Python child process management
│   └── formatting/
│       └── instagramFormatters.js        # Instagram data formatting utilities
├── routes/
│   └── api/
│       └── instagram.js                  # Instagram API route handlers
├── types/
│   └── instagram.js                      # Instagram type definitions and validation
└── requirements.txt                      # Python dependencies
```

## Database Design

### Single Table Structure: `instagram_data`

**Table Creation SQL Structure**:
```sql
CREATE TABLE instagram_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL,            -- Analysis job tracking ID
    instagram_user_id TEXT NOT NULL,      -- Unique Instagram user ID
    
    -- Analysis Job Status
    analysis_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    analysis_progress INTEGER DEFAULT 0,     -- Progress percentage (0-100)
    analysis_error TEXT,                     -- Error message if failed
    
    -- Profile Information (minimal)
    profile_username TEXT,
    profile_follower_count INTEGER DEFAULT 0,
    profile_following_count INTEGER DEFAULT 0,
    profile_media_count INTEGER DEFAULT 0,
    profile_is_private BOOLEAN DEFAULT 0,
    profile_pic_url TEXT,
    
    -- Reel Information
    reel_id TEXT,
    reel_shortcode TEXT,
    reel_url TEXT,
    reel_thumbnail_url TEXT,
    reel_caption TEXT,
    reel_likes INTEGER DEFAULT 0,
    reel_comments INTEGER DEFAULT 0,
    reel_views INTEGER DEFAULT 0,
    reel_date_posted TEXT,
    reel_duration INTEGER DEFAULT 0,
    reel_is_video BOOLEAN DEFAULT 1,
    
    -- JSON Fields for Arrays
    reel_hashtags TEXT,                   -- JSON array of hashtags
    reel_mentions TEXT,                   -- JSON array of mentions
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_analysis_id ON instagram_data(analysis_id);
CREATE INDEX idx_instagram_user_id ON instagram_data(instagram_user_id);
CREATE INDEX idx_analysis_status ON instagram_data(analysis_status);
CREATE INDEX idx_reel_id ON instagram_data(reel_id);
CREATE INDEX idx_created_at ON instagram_data(created_at);
CREATE INDEX idx_composite_analysis_user ON instagram_data(analysis_id, instagram_user_id);
```

### Database Field Specifications

**Primary Key**: 
- `id` - Auto-incrementing integer primary key

**Analysis Job Tracking**:
- `analysis_id` - UUID for tracking analysis jobs (TEXT, NOT NULL)
- `analysis_status` - Current job status: pending, processing, completed, failed (TEXT)
- `analysis_progress` - Completion percentage 0-100 (INTEGER)
- `analysis_error` - Error message if analysis fails (TEXT)

**User Identification**:
- `instagram_user_id` - Unique Instagram user ID (TEXT, NOT NULL)

**Profile Data Fields**:
- `profile_username` - Instagram username without @ symbol (TEXT)
- `profile_follower_count` - Number of followers (INTEGER)
- `profile_following_count` - Number of following (INTEGER)  
- `profile_media_count` - Total posts count (INTEGER)
- `profile_is_private` - Privacy status (BOOLEAN)
- `profile_pic_url` - Profile picture URL (TEXT)

**Reel Data Fields**:
- `reel_id` - Instagram media ID (TEXT)
- `reel_shortcode` - Instagram shortcode identifier (TEXT)
- `reel_url` - Direct link to reel (TEXT)
- `reel_thumbnail_url` - Thumbnail image URL (TEXT)
- `reel_caption` - Reel description text (TEXT)
- `reel_likes` - Like count (INTEGER)
- `reel_comments` - Comment count (INTEGER)
- `reel_views` - View count if available (INTEGER)
- `reel_date_posted` - Upload date in ISO format (TEXT)
- `reel_duration` - Video length in seconds (INTEGER)
- `reel_is_video` - Content type flag (BOOLEAN)

**JSON Array Fields**:
- `reel_hashtags` - JSON array of hashtag strings (TEXT)
- `reel_mentions` - JSON array of mentioned usernames (TEXT)

**Timestamp Fields**:
- `created_at` - Record creation timestamp (DATETIME)
- `updated_at` - Last modification timestamp (DATETIME)

## User Input Processing

### Input Validation

**Username Format**:
- Accept both @username and username formats
- Remove @ symbol if present
- Validate character requirements
- Check username length constraints
- Sanitize input for security

**Input Sources**:
- POST request body parameter
- Form data submission
- Direct API calls
- Frontend form submissions

### Job Tracking Processing Flow

**Step 1: Analysis Job Creation**
- User provides Instagram username
- Frontend validates format
- Generate unique analysis ID
- Create database entry with status='pending'
- Return analysis ID to user for polling

**Step 2: Background Processing**
- Convert username to Instagram user ID
- Update status to 'processing' with progress updates
- Fetch profile and reel data asynchronously
- Store complete dataset in database using Instagram user ID
- Update status to 'completed' when finished

**Step 3: Status Polling and Data Retrieval**
- User polls analysis status endpoint with analysis ID
- Return current status: pending/processing/completed/failed
- Include progress percentage and error messages if applicable
- When completed, return full reel dataset with profile information

## Scraping Process Architecture

### Python Integration Layer

**Process Management**:
- Node.js spawns Python child processes
- Asynchronous background processing with job tracking
- Error handling and recovery mechanisms
- Resource management and cleanup

**Data Extraction Pipeline**:
- Profile information retrieval using Instagram user ID
- Reel discovery and metadata extraction
- Engagement metrics collection
- Content analysis and categorization
- Hashtag and mention extraction
- Database storage with job status updates

### Background Job Processing Flow

**Phase 1: Job Initialization**
- Create analysis job with status='pending'
- Convert username to unique Instagram user ID
- Verify profile existence and accessibility
- Update status to 'processing' with progress=10%

**Phase 2: Profile Data Collection**
- Extract basic profile information
- Store profile data in database
- Update progress to 30%
- Use Instagram user ID for all subsequent operations

**Phase 3: Reel Data Extraction**
- Iterate through profile posts using user ID
- Filter for video/reel content
- Collect reel metadata with progress updates (30-80%)
- Process and validate data as it's retrieved

**Phase 4: Database Storage and Completion**
- Format data for database insertion
- Store each reel as individual database row
- Parse and store hashtags/mentions as JSON
- Update status to 'completed' with progress=100%
- Handle errors by setting status='failed' with error message

## Database Storage Strategy

### Data Organization

**Single Row Per Reel**:
- Each reel gets individual database row
- Profile information repeated across rows
- Analysis metadata included in each row
- JSON fields for complex data structures

**Storage Optimization**:
- Efficient data types for numerical fields
- Text compression for large caption fields
- JSON storage for variable-length arrays
- Proper indexing for query performance

### Data Integrity

**Validation Rules**:
- Required field enforcement
- Data type validation
- Range checking for numerical values
- Format validation for URLs and dates

**Consistency Measures**:
- Transaction support for batch operations
- Rollback capability for failed insertions
- Duplicate detection and handling
- Data relationship maintenance

## User Data Presentation

### Analysis Results Display

**Summary Information**:
- Profile overview with key statistics
- Total reel count and analysis scope
- Performance distribution across engagement tiers
- Overall analysis completion status

**Detailed Reel Listing**:
- Sortable table with key metrics
- Thumbnail previews where available
- Engagement data visualization
- Content categorization display

**Performance Analytics**:
- Reel segmentation by engagement levels
- Performance trend analysis
- Top-performing content identification
- Hashtag and mention analysis

### Real-time Updates

**Progress Tracking**:
- Percentage completion indicators
- Current processing status messages
- Estimated time remaining
- Error notifications and recovery status

**Dynamic Data Loading**:
- Progressive result display as data becomes available
- Pagination for large datasets
- Filtering and search capabilities
- Interactive data exploration

## Export Functionality

### Export Formats

**CSV Export Features**:
- Complete reel dataset with all metrics
- Profile information header section
- Excel-compatible formatting
- Custom field selection options
- Timestamp-based file naming

**JSON Export Features**:
- Structured data with nested objects
- Complete metadata preservation
- API-friendly format
- Machine-readable structure
- Compression for large datasets

### Export Process

**Data Preparation**:
- Query database for complete analysis dataset
- Format data according to export type
- Apply any user-specified filters
- Generate export metadata

**File Generation**:
- Create temporary export files
- Set appropriate HTTP headers for download
- Implement streaming for large exports
- Clean up temporary files after delivery

**Download Management**:
- Secure download URLs with expiration
- Progress tracking for large exports
- Resume capability for interrupted downloads
- Export history and re-download options

## Performance Considerations

### Scalability Design

**Concurrent Processing**:
- Multiple analysis jobs support
- Resource allocation and management
- Queue management for high demand
- Load balancing across available resources

**Memory Management**:
- Efficient data structure usage
- Streaming data processing where possible
- Garbage collection optimization
- Memory leak prevention

### Response Time Optimization

**Database Query Optimization**:
- Proper indexing strategy
- Query plan optimization
- Connection pooling
- Prepared statement usage

**Caching Strategy**:
- Profile data caching for repeat analyses
- Export file caching
- API response caching
- Database query result caching

## Error Handling and Recovery

### Error Categories

**User Input Errors**:
- Invalid username format
- Non-existent profiles
- Private profile limitations
- Rate limiting notifications

**System Errors**:
- Database connection failures
- Python process crashes
- Network connectivity issues
- Resource exhaustion conditions

**Recovery Mechanisms**:
- Automatic retry with exponential backoff
- Graceful degradation of functionality
- User notification of error conditions
- Manual retry options for users

### Monitoring and Alerting

**System Health Monitoring**:
- Database connectivity checks
- Python process health monitoring
- Resource usage tracking
- Performance metric collection

**Alert Configuration**:
- Error rate threshold alerts
- Resource usage warnings
- Performance degradation notifications
- System availability monitoring

## Security and Privacy

### Data Protection

**Input Sanitization**:
- SQL injection prevention
- Cross-site scripting protection
- Input validation and filtering
- Output encoding for safety

**Access Control**:
- Rate limiting per IP address
- Request size limitations
- Authentication if required
- Session management

### Privacy Compliance

**Data Handling**:
- Public data extraction only
- No personal information storage beyond public profiles
- Data retention policy implementation
- User data deletion capabilities

**Legal Compliance**:
- Terms of service adherence
- Respect for platform rate limits
- No unauthorized access attempts
- Transparent data usage policies

## Integration Architecture

### System Integration Points

**API Layer Integration**:
- RESTful endpoint design
- Consistent response formatting
- Error handling standardization
- Documentation and versioning

**Database Integration**:
- Connection management
- Transaction handling
- Migration support
- Backup and recovery procedures

**Frontend Integration**:
- API client implementation
- Real-time update handling
- User experience optimization
- Error state management

### Deployment Considerations

**Environment Configuration**:
- Development and production settings
- Environment variable management
- Dependency installation procedures
- System requirement documentation

**Monitoring Setup**:
- Application performance monitoring
- Error tracking and reporting
- Usage analytics collection
- System health dashboards