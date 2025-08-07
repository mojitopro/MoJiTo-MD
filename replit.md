# replit.md

## Overview

MoJiTo-MD is a sophisticated WhatsApp bot built with Node.js and the Baileys library. The bot provides automated responses, group management capabilities, command processing, and multimedia handling through a modular plugin architecture. It features cluster-based process management for reliability, comprehensive authentication and authorization systems, and support for both JSON file and MongoDB databases.

## Recent Changes (Latest Update: 2025-08-07)

✅ **MIGRATION TO REPLIT COMPLETED - BOT 100% FUNCTIONAL**
- Successfully migrated from Replit Agent to Replit environment
- All dependencies installed and configured properly
- Package.json dependencies validated and working
- Workflow configured and running successfully
- QR code generation working for WhatsApp connection
- All core systems initialized successfully
- Bot fully operational and ready for WhatsApp connection

**Migration Status**: ✅ Complete - Project ready for use on Replit
**Current Status**: Bot supports both QR code and pairing code connection methods

## Connection Methods

### QR Code (Default)
1. Run the bot normally
2. Scan the displayed QR code with WhatsApp
3. The bot will connect automatically

### Pairing Code
1. Set environment variables or use command line arguments:
   - `USE_PAIRING_CODE=true`
   - `PHONE_NUMBER=your_phone_number_with_country_code`
2. Run the bot with: `node index.js --pairing-code --phone=+1234567890`
3. Enter the displayed 8-digit code in WhatsApp settings
4. The bot will connect automatically

**Current Status**: Bot supports both connection methods and is ready for WhatsApp connection

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture
- **Entry Point**: Cluster-based main process (`index.js`) that manages worker processes and provides automatic restart capabilities
- **Application Core**: Modular architecture with separate services for different functionalities (database, logging, caching, cleanup)
- **Connection Management**: WhatsApp connection handling with auto-reconnection logic using Baileys library
- **Message Processing**: Multi-stage message processing pipeline with validation, rate limiting, and command routing

### Plugin System
- **Dynamic Plugin Loading**: Hot-reloadable plugin system that automatically discovers and loads JavaScript files from the plugins directory
- **Plugin Manager**: Runtime plugin management allowing enable/disable operations with proper authorization checks
- **Command Routing**: Automatic command parsing and routing to appropriate plugin handlers

### Authentication & Authorization
- **Multi-level Authentication**: Owner, moderator, and premium user tiers with different permission levels
- **Group Administration**: Group-specific admin checking and permission validation
- **Rate Limiting**: Advanced rate limiting with different limits for different user types and message types

### Data Management
- **Database Abstraction**: Flexible database layer supporting both JSON files and MongoDB with automatic adapter selection
- **Caching System**: In-memory caching service with TTL support for frequently accessed data
- **User Data Schema**: Comprehensive user data structure including experience, levels, inventory, and game statistics

### Middleware Architecture
- **Authentication Middleware**: Command-level authentication and authorization
- **Rate Limiting Middleware**: Multi-strategy rate limiting (message, command, media-based)
- **Validation Middleware**: Input validation and message filtering
- **Pipeline Processing**: Modular middleware pipeline for extensible message processing

### Background Services
- **Cleanup Service**: Automated cleanup of temporary files and memory optimization
- **Auto-save System**: Periodic database persistence with configurable intervals
- **Process Monitoring**: Cluster-based process management with automatic worker restart

## External Dependencies

### Core WhatsApp Integration
- **@whiskeysockets/baileys**: WhatsApp Web API library for connection and message handling
- **Multi-file Auth State**: Session management and authentication persistence

### Database Solutions
- **lowdb**: JSON file-based database with JSONFile adapter
- **MongoDB**: NoSQL database support with custom MongoDB adapters (mongoDB and mongoDBV2)
- **Database Selection**: Automatic adapter selection based on connection string format

### Media and File Processing
- **file-type**: File type detection from buffers
- **jimp**: Image processing and manipulation
- **fluent-ffmpeg**: Video and audio processing
- **qrcode**: QR code generation for authentication
- **node-webpmux**: WebP image format handling

### System Utilities
- **pino**: High-performance logging with pretty printing
- **yargs**: Command-line argument parsing
- **chalk**: Terminal string styling and colors
- **cfonts**: ASCII art text generation
- **gradient-string**: Gradient text effects
- **ora**: Terminal spinners and progress indicators

### External APIs
- **Multiple API Providers**: Integration with various APIs for AI processing, media manipulation, and utility services
- **API Configuration**: Centralized API endpoint and key management
- **Failover Support**: Multiple API providers for redundancy

### Development Tools
- **syntax-error**: JavaScript syntax validation for plugins
- **nodemon**: Development auto-restart (via file watching)
- **Hot Reloading**: Plugin hot-reloading system for development