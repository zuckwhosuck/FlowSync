#!/bin/bash

# Create export directory if it doesn't exist
mkdir -p ./export

# Create a timestamped filename for the export
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_FILENAME="crm_export_${TIMESTAMP}.zip"

# Create a temporary directory for organizing files
mkdir -p ./temp_export
find . -maxdepth 1 -not -name "temp_export" -not -name "export" -not -name "." -not -name ".." -exec cp -r {} ./temp_export/ \;

# Remove node_modules, export directory, and any other unnecessary files from the copy
rm -rf ./temp_export/node_modules
rm -rf ./temp_export/export
rm -rf ./temp_export/temp_export
rm -rf ./temp_export/.git

# Add a README with setup instructions
cat > ./temp_export/README.md << 'EOF'
# CRM System

This is a comprehensive CRM system built with Express, React, PostgreSQL, and Firebase authentication.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=your_postgres_database_url
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

3. Run database migrations:
   ```
   npm run db:push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Features

- PostgreSQL database integration
- Firebase authentication
- Customer management
- Deal tracking
- Task management
- Meeting scheduling
- Interactive dashboard
- Reporting features

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express API
- `/shared` - Shared types and schemas
EOF

# Create the zip file
cd ./temp_export
zip -r "../export/${EXPORT_FILENAME}" .
cd ..

# Clean up
rm -rf ./temp_export

echo "Export complete! File saved to ./export/${EXPORT_FILENAME}"