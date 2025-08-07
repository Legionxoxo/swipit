# System Architecture Documentation

## Architecture Overview

Swipit follows a modern three-tier architecture pattern with clear separation between presentation, business logic, and data layers. The system is designed for scalability, maintainability, and extensibility.

## High-Level Architecture

### Tier 1: Presentation Layer (Frontend)
- **Technology**: React with TypeScript
- **Responsibilities**: User interface, user experience, client-side state management
- **Communication**: HTTP/HTTPS requests to backend API
- **Deployment**: Static files served by Express.js backend

### Tier 2: Application Layer (Backend)
- **Technology**: Node.js with Express.js framework
- **Responsibilities**: Business logic, API endpoints, external service integration
- **Communication**: RESTful API, external service APIs
- **Deployment**: PM2 process management with Nginx reverse proxy

### Tier 3: Data Layer (Database)
- **Technology**: SQLite with optimized indexing
- **Responsibilities**: Data persistence, query optimization, data integrity
- **Communication**: Direct database connections through wrapper utilities
- **Deployment**: File-based database on server filesystem

## Component Architecture

### Frontend Components

#### Core Application Structure
- **App.tsx**: Main application container and routing logic
- **Components Directory**: Reusable UI components organized by functionality
- **Services Directory**: API communication and external service integration
- **Hooks Directory**: Custom React hooks for state management
- **Utils Directory**: Helper functions and utility modules

#### Component Organization
- **Layout Components**: Header, Sidebar, Navigation elements
- **View Components**: Page-level components for different application sections
- **Feature Components**: Specialized components for specific functionality
- **Common Components**: Shared components used across multiple features

#### State Management Pattern
- **Local State**: Component-specific state using React hooks
- **Context API**: Global state for user preferences and application settings
- **Custom Hooks**: Encapsulated state logic for complex operations
- **Service Layer**: API communication abstracted from components

### Backend Architecture

#### Service Layer Pattern
- **Route Handlers**: Express.js routes organized by feature domain
- **Business Logic**: Pure functions for data processing and analysis
- **Database Layer**: Abstracted database operations with connection pooling
- **Integration Layer**: External API and service integrations

#### Modular Structure
- **Routes Directory**: API endpoint definitions grouped by functionality
- **Functions Directory**: Business logic and processing functions
- **Utils Directory**: Helper utilities and shared functionality
- **Database Directory**: Data access objects and schema management

#### Middleware Stack
- **CORS Handling**: Cross-origin request configuration
- **Body Parsing**: JSON and URL-encoded request processing
- **Error Handling**: Centralized error processing and logging
- **Static File Serving**: Frontend asset delivery

## Data Flow Architecture

### Request-Response Cycle
1. **Client Request**: Frontend initiates API request
2. **Route Matching**: Express router identifies appropriate handler
3. **Middleware Processing**: Request passes through middleware stack
4. **Business Logic Execution**: Route handler processes request
5. **Database Operations**: Data retrieval or manipulation
6. **Response Formation**: Structured response preparation
7. **Client Update**: Frontend receives and processes response

### Analysis Workflow
1. **Job Initiation**: User requests channel/profile analysis
2. **Job Creation**: Analysis job record created in database
3. **External API Calls**: Data retrieval from YouTube/Instagram
4. **Data Processing**: Analysis algorithms process raw data
5. **Data Storage**: Processed data stored with relationships
6. **Status Updates**: Real-time progress updates to frontend
7. **Completion Notification**: Final results presented to user

### Data Synchronization
- **Optimistic Updates**: Frontend updates immediately for better UX
- **Server Validation**: Backend validates and processes requests
- **Error Handling**: Rollback mechanisms for failed operations
- **State Reconciliation**: Frontend state synchronized with server state

## Database Architecture

### Schema Design Philosophy
- **Normalization**: Proper database normalization to reduce redundancy
- **Relationships**: Foreign key constraints for data integrity
- **Indexing Strategy**: Strategic indexes for query performance
- **Scalability**: Design supports horizontal scaling patterns

### Entity Relationships
- **Analysis Jobs**: Central entities tracking analysis processes
- **Content Entities**: Videos, reels, and other content objects
- **User Interaction Entities**: Ratings, comments, and user-generated data
- **Organizational Entities**: Hubs, tags, and categorization structures

### Performance Optimization
- **Index Strategy**: Compound indexes for complex queries
- **Query Optimization**: Efficient JOIN operations and subqueries
- **Connection Management**: Database connection pooling and reuse
- **Data Archiving**: Strategies for managing large datasets over time

## Integration Architecture

### External Service Integration
- **YouTube Data API**: RESTful API integration with rate limiting
- **AssemblyAI**: Webhook-based transcription service integration
- **Instagram Scraping**: Python-based web scraping with session management
- **Chrome Extension**: Message passing and cookie sharing mechanisms

### API Design Patterns
- **RESTful Design**: Standard HTTP methods and resource-based URLs
- **Consistent Response Format**: Standardized API response structures
- **Error Handling**: Comprehensive error codes and messages
- **Versioning Strategy**: API versioning for backward compatibility

### Authentication & Authorization
- **Session Management**: User session handling and persistence
- **API Key Management**: Secure storage and rotation of service keys
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Server-side validation of all incoming data

## Deployment Architecture

### Production Environment Setup
- **Process Management**: PM2 for Node.js process management
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Static Asset Serving**: Optimized delivery of frontend assets
- **Health Monitoring**: Application health checks and monitoring

### Scalability Considerations
- **Horizontal Scaling**: Support for multiple server instances
- **Load Distribution**: Request distribution across server instances
- **Database Scaling**: Strategies for database performance under load
- **Caching Layers**: In-memory and distributed caching strategies

### Security Architecture
- **Network Security**: Firewall configuration and port management
- **Application Security**: Input validation and SQL injection prevention
- **Data Security**: Encrypted storage of sensitive information
- **Access Control**: Role-based access control mechanisms

## Development Architecture

### Code Organization Principles
- **Separation of Concerns**: Clear boundaries between different system layers
- **Modularity**: Self-contained modules with well-defined interfaces
- **Reusability**: Common functionality extracted into shared utilities
- **Testability**: Architecture supports comprehensive testing strategies

### Development Workflow
- **Version Control**: Git-based workflow with feature branches
- **Code Standards**: Consistent coding standards and formatting
- **Documentation**: Comprehensive documentation for all major components
- **Testing Strategy**: Unit testing, integration testing, and end-to-end testing

### Configuration Management
- **Environment Variables**: Secure configuration management
- **Build Processes**: Automated build and deployment processes
- **Dependency Management**: Package management and version control
- **Development Tools**: Linting, formatting, and development utilities

## Performance Architecture

### Optimization Strategies
- **Frontend Optimization**: Code splitting, lazy loading, and asset optimization
- **Backend Optimization**: Query optimization and response caching
- **Database Optimization**: Index optimization and query performance tuning
- **Network Optimization**: Compression, caching headers, and CDN strategies

### Monitoring and Analytics
- **Application Monitoring**: Performance metrics and error tracking
- **Database Monitoring**: Query performance and resource utilization
- **User Analytics**: Usage patterns and performance insights
- **Health Checks**: Automated health monitoring and alerting

### Capacity Planning
- **Resource Utilization**: CPU, memory, and storage usage patterns
- **Growth Projections**: Anticipated scaling requirements
- **Performance Benchmarks**: Baseline performance metrics
- **Bottleneck Identification**: Performance bottleneck analysis and resolution