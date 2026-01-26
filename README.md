# RecipeMaster 🍳

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/recipemaster/releases)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.5%20%2B%20Haiku%204.5-purple.svg)](https://claude.ai/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.8.8-green.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-blue.svg)](https://tailwindcss.com/)

A comprehensive MERN stack recipe sharing application with AI-powered recommendations, shopping cart, cooking mode, and full Hebrew UI support.

## 📸 Screenshots

### Desktop View

_Add screenshots here showing the main interface, recipe pages, and AI wizard_

### Mobile View

_Add mobile screenshots showing responsive design and cooking mode_

### AI Assistant

_Add screenshots of the AI recommendation wizard and floating button_

> **Note**: Screenshots will be added to `screenshots/` directory. Please add images in PNG/JPG format.

## ✨ Features

### 👤 User Authentication

- JWT-based authentication with secure password hashing
- Google OAuth 2.0 integration for easy login
- User roles: User, Poster (can create tags), Admin
- Profile management and user permissions

### 📝 Recipe Management

- Create, edit, and soft delete recipes
- Visibility controls: Public, Shared (with specific users), Private
- Rich content support: Images (Cloudinary), videos, detailed instructions
- Rating and commenting system
- Advanced search across titles, descriptions, and ingredients

### 🏷️ Tag System

- Categorized tags for recipe organization
- Admin/Poster role management for tag creation
- Search and filter by tags

### 🤖 AI Assistant (Powered by Groq)

- **Floating Action Button**: Pulsing FAB in bottom-right corner for AI writing assistance
- **Personalized Recommendations**: Smart recipe suggestions based on user preferences
- **Interactive Wizard**: Step-by-step question interface to find perfect recipes
- **AI-Powered Content**: Generate recipe ideas and modifications using Groq AI
- **Hebrew Support**: Full AI interaction in Hebrew language

### 🛒 Shopping Cart

- Add ingredients directly from recipes to cart
- Group items by recipe for organized shopping
- Check off purchased items with visual feedback
- Persistent cart storage per user
- Quick navigation back to original recipes

### 👨‍🍳 Cooking Mode

- Full-screen distraction-free cooking experience
- Large, readable text for ingredients and instructions
- Auto-hide navigation for immersive cooking
- Optimized for mobile devices during cooking

### 🌐 Hebrew UI & RTL Support

- Complete Hebrew language interface
- Right-to-left (RTL) layout support
- Tailwind CSS with RTL plugins
- Responsive design for all devices

### 📱 Additional Features

- Toast notifications for user feedback
- Image upload with Cloudinary integration
- Video embedding support
- Mobile-responsive design
- Error handling and validation

## 🛠️ Tech Stack

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework with middleware
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Passport.js** - Authentication middleware (Google OAuth)
- **Cloudinary** - Cloud image storage and manipulation
- **express-validator** - Server-side validation
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **cors** - Cross-origin resource sharing
- **Groq SDK** - AI integration for recipe recommendations

### Frontend

- **React 18** - UI library with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Toastify** - Toast notifications
- **Context API** - State management
- **React Scripts** - Build and development tools

### Development Tools

- **Nodemon** - Auto-restart server on changes
- **Concurrently** - Run multiple scripts simultaneously
- **ESLint** - Code linting
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **npm** or **yarn** package manager
- **Git** for cloning the repository

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd RecipeMaster
   ```

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/recipemaster
   # Required for: Connecting to MongoDB database to store users, recipes, tags, and cart data

   # JWT Authentication
   JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
   # Required for: Signing and verifying JWT tokens for user authentication sessions

   # Google OAuth (Optional but recommended)
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   # Required for: Enabling Google OAuth login functionality

   # Cloudinary Image Storage
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   # Required for: Uploading and storing recipe images in the cloud

   # AI Integration (Groq)
   GROQ_API_KEY=your_groq_api_key
   # Required for: Powering the AI assistant and recipe recommendations
   ```

   For the client, create `client/.env`:

   ```env
   REACT_APP_API_URL=http://localhost:5000
   # Required for: Telling the React app where the backend API is running
   ```

5. **Start MongoDB**
   - For local MongoDB: Ensure MongoDB service is running
   - For MongoDB Atlas: Your connection string should be in MONGODB_URI

6. **Seed initial data (optional)**
   ```bash
   npm run seed:tags
   ```
   This populates the database with initial tag categories.

## ▶️ Running the Application

### Development Mode (Recommended)

```bash
npm run dev
```

This starts both the backend server (port 5000) and frontend client (port 3000) simultaneously using concurrently.

### Production Mode

```bash
# Build the client
cd client
npm run build
cd ..

# Start the server
npm start
```

### Individual Services

```bash
# Start only the backend server
npm run server

# Start only the frontend client (in another terminal)
npm run client
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user account
- `POST /login` - Authenticate user login
- `GET /google` - Initiate Google OAuth flow
- `GET /google/callback` - Google OAuth callback
- `GET /me` - Get current authenticated user info

### Recipes (`/api/recipes`)

- `GET /` - Get all public recipes (with search/filter support)
- `GET /:shortId` - Get single recipe by short ID
- `POST /` - Create new recipe (authentication required)
- `PUT /:shortId` - Update existing recipe (owner only)
- `DELETE /:shortId` - Soft delete recipe (owner only)
- `GET /user/:userId` - Get recipes by specific user

### Tags (`/api/tags`)

- `GET /` - Get all available tags
- `POST /` - Create new tag (Poster/Admin roles only)

### Shopping Cart (`/api/cart`)

- `GET /` - Get user's shopping cart
- `POST /add` - Add ingredients to cart from recipe
- `PATCH /:itemId/toggle` - Mark item as purchased/unpurchased
- `DELETE /:itemId` - Remove single item from cart
- `DELETE /clear/all` - Clear entire cart

### Admin (`/api/admin`)

- `PATCH /role` - Update user role (Admin only)
- `GET /users` - Get all users (Admin only)

## 🎨 Database Schema

### User Model

```javascript
{
  name: String,           // User's display name
  email: String,          // Unique email address
  password: String,       // Hashed password (bcrypt)
  googleId: String,       // Google OAuth ID (optional)
  role: String,           // 'user', 'poster', 'admin'
  permissions: [String],  // Array of permission strings
  createdAt: Date,        // Auto-generated timestamp
  updatedAt: Date         // Auto-updated timestamp
}
```

### Recipe Model

```javascript
{
  shortId: String,        // Unique short identifier (nanoid)
  title: String,          // Recipe title
  description: String,    // Recipe description
  ingredients: [String],  // Array of ingredient strings
  instructions: [String], // Array of instruction steps
  mainImage: String,      // Cloudinary image URL
  additionalImages: [String], // Array of additional image URLs
  videoUrl: String,       // YouTube/video embed URL
  tags: [{                // Reference to Tag model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  author: {               // Reference to User model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  visibility: String,     // 'public', 'shared', 'private'
  allowComments: Boolean, // Whether comments are allowed
  isDeleted: Boolean,     // Soft delete flag
  ratings: [{             // User ratings and comments
    user: ObjectId,
    rating: Number,       // 1-5 stars
    comment: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Tag Model

```javascript
{
  name: String,           // Tag name (e.g., "Italian", "Dessert")
  category: String,       // Category grouping (e.g., "Cuisine", "Meal Type")
  createdAt: Date,
  updatedAt: Date
}
```

### Cart Model

```javascript
{
  user: ObjectId,         // Reference to User
  items: [{
    ingredient: String,   // Ingredient text
    recipe: ObjectId,     // Reference to Recipe
    recipeTitle: String,  // Cached recipe title
    shortId: String,      // Cached recipe short ID
    purchased: Boolean    // Purchase status
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 📖 Usage Guide

### Getting Started

1. **Register/Login**: Create an account or sign in with Google OAuth
2. **Browse Recipes**: Explore public recipes on the home page
3. **Search & Filter**: Use the search bar and tags to find specific recipes
4. **Create Recipe**: Click "Create Recipe" to add your own recipes
5. **AI Assistant**: Use the floating AI button for recipe recommendations

### Recipe Management

- **Visibility Settings**: Choose who can see your recipes (Public/Shared/Private)
- **Rich Content**: Add images, videos, and detailed instructions
- **Tags**: Categorize your recipes for better discoverability
- **Ratings**: Rate and comment on recipes you enjoy

### Shopping Cart Features

- **Add Ingredients**: Click the cart icon on any recipe to add ingredients
- **Organize Shopping**: Items are grouped by recipe for efficient shopping
- **Track Progress**: Check off items as you purchase them
- **Quick Access**: Navigate back to recipes directly from the cart

### Cooking Mode

- **Full Screen**: Click "Cooking Mode" for distraction-free cooking
- **Large Text**: Easy-to-read ingredients and instructions
- **Step Navigation**: Clear progression through cooking steps

### AI Assistant Usage

- **Recipe Discovery**: Answer questions to find personalized recipe suggestions
- **Content Generation**: Get AI help for recipe ideas and modifications
- **Hebrew Support**: Full conversational AI in Hebrew

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Issues

```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod      # Linux
# Windows: Check Services panel

# For MongoDB Atlas, verify connection string format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipemaster
```

#### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process and restart
npm run dev
```

#### Environment Variables Not Loading

- Ensure `.env` file is in the root directory (not `client/` folder)
- No spaces around `=` in `.env` file
- Restart the development server after adding new variables

#### Google OAuth Not Working

- Verify Google Cloud Console credentials
- Ensure callback URL matches: `http://localhost:5000/api/auth/google/callback`
- Check that domain is authorized in Google Console

#### Cloudinary Upload Issues

- Verify all three Cloudinary credentials are correct
- Check Cloudinary dashboard for upload limits
- Ensure images are under size limits (default 10MB)

#### AI Features Not Working

- Verify `GROQ_API_KEY` is set correctly
- Check Groq API status and rate limits
- Ensure internet connection for AI requests

### Development Tips

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear client build cache
cd client
rm -rf node_modules build
npm install

# Check for syntax errors
npm run lint  # if ESLint is configured
```

## � API Examples

### Authentication

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Recipes

#### Get All Recipes

```bash
GET /api/recipes?search=pasta&page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create Recipe

```bash
POST /api/recipes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  title: "Homemade Pasta",
  description: "Delicious homemade pasta recipe",
  ingredients: ["2 cups flour", "3 eggs", "1 tsp salt"],
  instructions: ["Mix ingredients", "Knead dough", "Cook in boiling water"],
  tags: ["Italian", "Pasta"],
  visibility: "public"
}
```

#### Add to Cart

```bash
POST /api/cart/add
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "ingredients": ["2 cups flour", "3 eggs"],
  "recipeId": "507f1f77bcf86cd799439011",
  "recipeTitle": "Homemade Pasta",
  "shortId": "abc123"
}
```

## ❓ FAQ

### General Questions

**Q: Is RecipeMaster free to use?**
A: Yes, RecipeMaster is completely free and open-source.

**Q: Do I need to create an account to browse recipes?**
A: You can browse public recipes without an account, but you'll need to register to create recipes, use the shopping cart, or access AI features.

**Q: Is the AI assistant available in Hebrew?**
A: Yes! The AI assistant fully supports Hebrew language interactions.

### Technical Questions

**Q: What are the system requirements?**
A: Node.js 16+, MongoDB, and a modern web browser.

**Q: Can I deploy this to my own server?**
A: Yes, see the deployment section for detailed instructions.

**Q: How do I reset my password?**
A: Password reset functionality is planned for future releases. Currently, please contact support.

**Q: Are my recipes private?**
A: You can set recipes to Public, Shared, or Private visibility levels.

### Troubleshooting

**Q: Images aren't uploading**
A: Check your Cloudinary credentials and ensure your account has upload permissions.

**Q: AI features aren't working**
A: Verify your GROQ_API_KEY is set correctly and you have internet connection.

**Q: Getting 500 errors**
A: Check server logs and ensure all environment variables are configured.

## 📝 Changelog

### Version 1.0.0 (Current)

- ✅ Complete MERN stack implementation
- ✅ AI-powered recipe recommendations
- ✅ Shopping cart functionality
- ✅ Cooking mode with full-screen experience
- ✅ Hebrew UI with RTL support
- ✅ Google OAuth integration
- ✅ Cloudinary image uploads
- ✅ Tag system with categories
- ✅ User roles and permissions
- ✅ Responsive design with Tailwind CSS

### Future Releases

- 🔄 Password reset functionality
- 🔄 Social features (follow, like)
- 🔄 Meal planning
- 🔄 Mobile app development

## 🗺️ Roadmap

### Phase 1 (Completed)

- [x] Basic MERN setup
- [x] User authentication
- [x] Recipe CRUD operations
- [x] Tag system
- [x] Image uploads

### Phase 2 (Completed)

- [x] AI integration
- [x] Shopping cart
- [x] Cooking mode
- [x] Hebrew localization

### Phase 3 (In Progress)

- [ ] Advanced search filters
- [ ] Social features
- [ ] Meal planning
- [ ] Mobile app development

### Phase 4 (Planned)

- [ ] Nutrition API integration
- [ ] Recipe scaling
- [ ] Offline mode
- [ ] Advanced analytics

## 🚀 Deployment

### Environment Setup for Production

#### Render.com Deployment

1. **Connect Repository**: Link your GitHub repo to Render
2. **Environment Variables**: Add all required env vars in Render dashboard
3. **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
4. **Start Command**: `npm start`

#### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_secure_jwt_secret"
# ... set all other required variables

# Deploy
git push heroku main
```

#### Vercel Deployment (Frontend Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy client
cd client
vercel --prod

# Set environment variables in Vercel dashboard
# REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Production Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_jwt_secret_min_32_chars
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GROQ_API_KEY=...
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help make RecipeMaster even better:

### Ways to Contribute

- **🐛 Bug Reports**: Found a bug? [Open an issue](https://github.com/yourusername/recipemaster/issues) with detailed steps to reproduce
- **💡 Feature Requests**: Have an idea? [Create a feature request](https://github.com/yourusername/recipemaster/issues) 
- **📝 Documentation**: Help improve documentation, tutorials, or examples
- **🔧 Code Contributions**: Fix bugs, add features, or improve performance
- **🎨 UI/UX Improvements**: Enhance the user interface and experience
- **🌐 Translations**: Help translate the app to new languages

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/recipemaster.git
   cd recipemaster
   ```
3. **Set up the development environment** (see Installation section above)
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** and test thoroughly
6. **Commit your changes**:
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** on GitHub

### Code Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting

### Reporting Issues

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs. actual behavior
- Browser/OS information
- Screenshots if applicable
- Console errors or logs

### License

By contributing to RecipeMaster, you agree that your contributions will be licensed under the same license as the project.

## 📞 Support

### Getting Help

If you need help with RecipeMaster, here are several ways to get support:

#### 📧 Contact Information
- **Email**: support@recipemaster.com
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/recipemaster/issues)
- **Discussions**: [Join community discussions](https://github.com/yourusername/recipemaster/discussions)

#### 🆘 Common Support Topics
- **Installation Issues**: Check the [Installation](#-installation) section
- **API Questions**: See [API Documentation](#-api-endpoints)
- **Troubleshooting**: Visit the [Troubleshooting](#-troubleshooting) section
- **Feature Requests**: Use GitHub Issues with the "enhancement" label

#### 📚 Resources
- **Documentation**: This README and inline code documentation
- **API Examples**: See the [API Examples](#-api-examples) section
- **FAQ**: Check the [Frequently Asked Questions](#-faq) section

### Community Guidelines

- Be respectful and constructive in all communications
- Search existing issues before creating new ones
- Provide detailed information when reporting problems
- Help others when you can

## 🙌 Credits

### Core Team

- **Lidor Cohen** - Project Lead & Full-Stack Developer

### Technologies & Libraries

RecipeMaster is built with the help of these amazing open-source projects:

#### Backend
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling
- **[JWT](https://jwt.io/)** - JSON Web Token implementation
- **[Passport.js](https://www.passportjs.org/)** - Authentication middleware
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing
- **[express-validator](https://express-validator.github.io/)** - Server-side validation

#### Frontend
- **[React](https://reactjs.org/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Axios](https://axios-http.com/)** - HTTP client
- **[React Router](https://reactrouter.com/)** - Declarative routing
- **[React Toastify](https://fkhadra.github.io/react-toastify/)** - Toast notifications

#### AI & Media
- **[Groq](https://groq.com/)** - AI language model API
- **[Cloudinary](https://cloudinary.com/)** - Cloud image management

#### Development Tools
- **[Nodemon](https://nodemon.io/)** - Auto-restart for Node.js
- **[Concurrently](https://www.npmjs.com/package/concurrently)** - Run multiple commands
- **[ESLint](https://eslint.org/)** - Code linting

### Special Thanks

- **Open Source Community** - For inspiration and learning opportunities
- **React Community** - For excellent documentation and ecosystem
- **MongoDB Community** - For database expertise and support
- **All Contributors** - For making RecipeMaster better every day

---

**Built with ❤️ for food lovers worldwide** 🍳✨
