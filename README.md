# RecipeMaster

A MERN stack application for sharing and discovering recipes.

## Features

- User authentication with JWT and Google OAuth
- Recipe creation, editing, and soft deletion
- Recipe visibility controls (Public, Shared, Private)
- Search functionality across recipes
- Tag system for categorization
- Cloudinary integration for image uploads
- Responsive UI with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Tailwind CSS
- **Authentication**: JWT, Passport.js (Google OAuth)
- **Image Storage**: Cloudinary

## Setup Instructions

1. **Clone the repository**

   ```
   git clone <repository-url>
   cd RecipeMaster
   ```

2. **Install dependencies**

   ```
   npm install
   cd client && npm install && cd ..
   ```

3. **Set up environment variables**
   - Copy `.env` file and fill in your credentials:
     - MongoDB URI
     - JWT Secret
     - Google OAuth credentials
     - Cloudinary credentials

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```
   npm run dev
   ```
   This will start both the server (port 5000) and client (port 3000).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email
- `GET /api/auth/google` - Google OAuth flow
- `GET /api/auth/me` - Get current user

### Recipes

- `GET /api/recipes` - Get all public recipes
- `GET /api/recipes/:shortId` - Get single recipe
- `POST /api/recipes` - Create recipe (Auth required)
- `PUT /api/recipes/:shortId` - Update recipe (Owner only)
- `DELETE /api/recipes/:shortId` - Soft delete recipe
- `GET /api/recipes/user/:userId` - Get user's recipes

### Tags

- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag (Admin/Poster only)

### Admin

- `PATCH /api/admin/role` - Update user role (Admin only)

## Database Schema

### User

- name, email, password, googleId, role, permissions

### Recipe

- shortId, title, description, ingredients, instructions, mainImage, additionalImages, videoUrl, tags, author, visibility, allowComments, isDeleted, ratings

### Tag

- name, category
