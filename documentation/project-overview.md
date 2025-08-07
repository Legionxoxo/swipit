# Swipit - Social Media Analytics Platform

## Project Overview

Swipit is a comprehensive social media analytics platform that provides deep insights into YouTube channels and Instagram profiles. The platform enables users to analyze content performance, track engagement metrics, and organize their analysis data through a sophisticated hub system.

## Core Concepts

### 1. Multi-Platform Analysis
- **YouTube Channel Analysis**: Complete channel profiling including subscriber counts, video performance metrics, engagement rates, and content categorization
- **Instagram Profile Analysis**: Comprehensive reel analysis, profile statistics, and content performance tracking
- **Cross-Platform Insights**: Unified dashboard for comparing performance across different social media platforms

### 2. Content Performance Segmentation
The platform automatically categorizes content based on performance metrics:
- **Low Performance**: 0-1,000 views/engagements
- **Medium Performance**: 1,001-10,000 views/engagements  
- **High Performance**: 10,001-100,000 views/engagements
- **Very High Performance**: 100,001-1,000,000 views/engagements
- **Viral Content**: 1,000,000+ views/engagements

### 3. User Interaction System
- **Video Interactions**: Star ratings, comments, favorites tracking
- **Creator Interactions**: Creator-specific notes, tags, and organizational tools
- **Hub System**: Custom organizational containers for grouping related creators and content

### 4. Transcription Services
- **AI-Powered Transcription**: Integration with AssemblyAI for accurate video transcriptions
- **Multi-Platform Support**: YouTube and Instagram video transcription capabilities
- **Searchable Content**: Transcribed content becomes searchable and analyzable

## Architecture Philosophy

### Separation of Concerns
- **Frontend**: React-based single-page application focused on user experience
- **Backend**: Node.js/Express API server handling business logic and data processing
- **Database**: SQLite for reliable data persistence with proper indexing
- **External Services**: YouTube API, AssemblyAI, Instagram scraping services

### Scalability Considerations
- **Modular Route Structure**: API routes organized by functionality
- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategies**: Efficient data retrieval and storage patterns
- **Process Management**: PM2 for production deployment and process monitoring

### Data Flow Architecture
1. **Data Ingestion**: External API calls and web scraping
2. **Data Processing**: Analysis algorithms and metric calculations  
3. **Data Storage**: Structured storage with relationships and indexing
4. **Data Presentation**: REST API endpoints for frontend consumption
5. **User Interactions**: Real-time updates and state management

## Key Features

### Analytics Dashboard
- **Performance Overview**: Quick insights into content performance trends
- **Engagement Metrics**: Detailed breakdown of likes, comments, shares, and views
- **Creator Profiles**: Comprehensive creator information and content history
- **Comparison Tools**: Side-by-side analysis of different creators or time periods

### Organization System
- **Hub Management**: Create custom organizational containers
- **Creator Tagging**: Tag and categorize creators for easy filtering
- **Favorites System**: Mark and quickly access preferred content
- **Search Functionality**: Full-text search across all analyzed content

### Export Capabilities
- **CSV Export**: Tabular data for spreadsheet analysis
- **JSON Export**: Structured data for programmatic use
- **Custom Filters**: Export specific subsets of data
- **Scheduled Reports**: Automated report generation (planned feature)

## Technical Implementation

### Database Design
- **Normalized Structure**: Proper relationships between entities
- **Indexing Strategy**: Performance-optimized queries
- **Data Integrity**: Foreign keys and constraints
- **Migration Support**: Versioned schema changes

### API Design
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Consistent Response Format**: Standardized error handling and data structures
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Security Considerations
- **Input Validation**: Server-side validation of all inputs
- **Error Handling**: Proper error messages without sensitive information exposure
- **Environment Variables**: Secure configuration management
- **API Key Management**: Secure storage and rotation of external service keys

### Deployment Strategy
- **Production Environment**: PM2 process management
- **Reverse Proxy**: Nginx for improved performance and security
- **Static File Serving**: Optimized asset delivery
- **Process Monitoring**: Health checks and automatic restarts

## Data Models

### Core Entities
- **Analysis Jobs**: Tracking of analysis processes and their states
- **Channel/Profile Data**: Social media account information and metadata
- **Video/Content Data**: Individual content pieces with performance metrics
- **User Interactions**: User-generated data like ratings and comments
- **Transcriptions**: AI-generated text content from videos

### Relationship Patterns
- **One-to-Many**: Channels to Videos, Users to Interactions
- **Many-to-Many**: Users to Hubs, Content to Tags
- **Hierarchical**: Hub organization and content categorization

## Integration Points

### External APIs
- **YouTube Data API**: Channel and video metadata retrieval
- **AssemblyAI**: Audio transcription services
- **Instagram (Web Scraping)**: Profile and content data extraction

### Browser Extensions
- **Chrome Extension**: Cookie management and session handling
- **Cross-Origin Communication**: Secure messaging between extension and web app

## Performance Considerations

### Optimization Strategies
- **Database Indexing**: Strategic index placement for common queries
- **Caching Layers**: In-memory caching for frequently accessed data
- **Pagination**: Efficient handling of large datasets
- **Background Processing**: Asynchronous analysis job processing

### Scalability Patterns
- **Horizontal Scaling**: Design supports multiple server instances
- **Load Balancing**: Nginx configuration for traffic distribution
- **Database Optimization**: Query optimization and connection pooling
- **Memory Management**: Efficient resource utilization patterns

## Future Enhancements

### Planned Features
- **Real-time Analytics**: Live performance tracking
- **Advanced Filtering**: Complex query building interface  
- **Collaboration Tools**: Multi-user workspace features
- **API Integration**: Third-party service connections
- **Mobile Application**: Native mobile app development

### Technical Improvements
- **Microservices Architecture**: Service decomposition for better scalability
- **Message Queue System**: Asynchronous job processing
- **Advanced Caching**: Redis integration for improved performance
- **Monitoring & Analytics**: Application performance monitoring