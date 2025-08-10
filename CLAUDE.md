# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
基本的に日本語で駆動します
Routinify is a task management system designed to support habit formation. The codebase consists of a full-stack application with Docker containerization:

- **Backend**: Ruby on Rails API with PostgreSQL database
- **Frontend**: React/TypeScript with Auth0 authentication
- **Infrastructure**: Docker Compose with Swagger API documentation

## Development Commands

### Core Operations
```bash
make up          # Start all services with build
make down        # Stop all services
make logs        # View logs
make clean       # Complete cleanup with cache removal
```

### Testing
```bash
make test-backend              # Run Ruby/Rails tests with RSpec
make test-frontend             # Run React/TypeScript tests with Vitest
make test-all                  # Run all tests
make test-backend-coverage     # Backend tests with detailed output
make test-frontend-coverage    # Frontend tests with coverage
```

### Code Quality
```bash
make lint-backend              # RuboCop linting
make lint-backend-fix          # Auto-fix Ruby code style
make lint-frontend             # Prettier format checking
make lint-frontend-fix         # Auto-format TypeScript/React code
make format-all                # Format both backend and frontend
make security-check            # Run Brakeman security analysis
make type-check                # TypeScript type checking
```

### Database Management
```bash
make ridgepole-apply    # Apply database schema changes
make ridgepole-dry-run  # Preview schema changes
```

### Container Management
```bash
make exec-backend    # Shell into Rails container
make exec-frontend   # Shell into React container
make exec-db         # Shell into PostgreSQL container
```

## Architecture

### Project Structure
```
/devenv/Routinify/
├── backend/           # Rails API (Port 3000)
│   ├── app/
│   │   ├── controllers/api/v1/  # API endpoints
│   │   └── models/              # ActiveRecord models
│   ├── db/
│   │   ├── Schemafile          # Ridgepole schema definition
│   │   └── schemas/            # Table definitions
│   └── spec/                   # RSpec tests
├── frontend/          # React App (Port 3001)
│   └── src/
│       ├── components/         # React components
│       ├── hooks/             # Custom React hooks
│       ├── auth/              # Auth0 integration
│       └── pages/             # Route components
├── api/
│   └── openapi.yaml           # API documentation
└── docker-compose.yml         # Service orchestration
```

### Key Technologies
- **Backend**: Ruby on Rails, PostgreSQL, Ridgepole (schema management), RuboCop, Brakeman
- **Frontend**: React, TypeScript, Auth0, Vitest, Prettier, Mantine UI
- **Infrastructure**: Docker, Swagger UI
- **Testing**: RSpec (backend), Vitest (frontend)

### Authentication Flow
- Auth0 integration for user authentication
- JWT tokens for API authorization
- Environment variables required for Auth0 configuration

### Database Schema Management
- Uses Ridgepole instead of Rails migrations
- Schema definitions in `db/schemas/` directory
- Apply changes with `make ridgepole-apply`

## Environment Setup

### Required Environment Variables
```bash
# frontend/.env
REACT_APP_AUTH0_DOMAIN=dev-x7dol3ce1bkdedsn.jp.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://Routinify-auth-api.com
REACT_APP_API_URL=http://localhost:3000
```

## Service Ports
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:3001` 
- Swagger UI: `http://localhost:8080`
- PostgreSQL: `localhost:5432`