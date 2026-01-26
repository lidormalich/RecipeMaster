# RecipeMaster 🍳

A comprehensive MERN stack recipe sharing application with AI-powered recommendations, shopping cart, cooking mode, and full Hebrew UI support.

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

## 🔮 Future Enhancements

### Planned Features

- **Recipe Sharing**: Share recipes with specific users
- **Meal Planning**: Weekly meal planning with shopping lists
- **Nutrition Tracking**: Calorie counting and nutritional information
- **Social Features**: Follow users, like recipes, comments
- **Advanced Search**: Filter by ingredients, cooking time, difficulty
- **Recipe Scaling**: Automatically adjust ingredient quantities
- **Offline Mode**: Save recipes for offline viewing
- **Mobile App**: React Native mobile application

### Technical Improvements

- **Real-time Updates**: WebSocket integration for live comments
- **Caching**: Redis for improved performance
- **CDN**: Content delivery network for images
- **Testing**: Comprehensive unit and integration tests
- **Monitoring**: Application performance monitoring
- **Backup**: Automated database backups

## 📊 Project Structure

```
RecipeMaster/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   └── config/        # Configuration files
│   └── package.json
├── config/                 # Server configuration
├── controllers/            # Route controllers
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── scripts/                # Utility scripts
├── uploads/                # Temporary file uploads
├── .env                    # Environment variables
├── package.json
├── server.js              # Main server file
└── README.md
```

## 🙏 Acknowledgments

- **React Community** for excellent documentation and tools
- **Tailwind CSS** for beautiful utility-first styling
- **MongoDB** for flexible NoSQL database
- **Cloudinary** for seamless image management
- **Groq** for powerful AI capabilities
- **Open Source Community** for inspiration and learning

## 📈 Performance

### Optimization Features

- **Lazy Loading**: Components load on demand
- **Image Optimization**: Cloudinary automatic image optimization
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Client-side caching for better UX
- **Code Splitting**: Reduced bundle sizes

### Recommended Server Specifications

- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: 1 vCPU minimum
- **Storage**: 5GB for database and uploads
- **Bandwidth**: 100GB/month for image serving

## 🔒 Security

### Implemented Security Measures

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: express-validator for all inputs
- **CORS**: Configured cross-origin policies
- **Rate Limiting**: Basic rate limiting on auth endpoints
- **Environment Variables**: Sensitive data not in code

### Security Best Practices

- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use HTTPS in production

---

**Built with ❤️ for food lovers worldwide** 🍳✨
