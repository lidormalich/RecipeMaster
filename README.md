# RecipeMaster 🍳

<div align="center">

![RecipeMaster](https://img.shields.io/badge/RecipeMaster-Recipe%20Sharing%20Platform-orange?style=for-the-badge)

**A comprehensive MERN stack recipe sharing application with AI-powered recommendations**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)](https://github.com/lidormalich/recipemaster/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/lidormalich/recipemaster/graphs/commit-activity)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Storage-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Groq](https://img.shields.io/badge/Groq-AI%20Powered-F55036?style=flat-square)](https://groq.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Google OAuth](https://img.shields.io/badge/Google-OAuth%202.0-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/identity)

[![GitHub Stars](https://img.shields.io/github/stars/lidormalich/recipemaster?style=social)](https://github.com/lidormalich/recipemaster/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/lidormalich/recipemaster?style=social)](https://github.com/lidormalich/recipemaster/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/lidormalich/recipemaster?style=flat-square)](https://github.com/lidormalich/recipemaster/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/lidormalich/recipemaster?style=flat-square)](https://github.com/lidormalich/recipemaster/pulls)

[Live Demo](https://recipemaster.onrender.com) • [Report Bug](https://github.com/lidormalich/recipemaster/issues) • [Request Feature](https://github.com/lidormalich/recipemaster/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [Support](#-support)
- [License](#-license)
- [Credits](#-credits)

---

## 🎯 About

**RecipeMaster** is a full-featured recipe sharing platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It combines traditional recipe management with cutting-edge AI technology to provide personalized recipe recommendations.

### Why RecipeMaster?

| Feature                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| 🤖 **AI-Powered**      | Smart recipe recommendations using Groq AI (Llama 3.3 70B) |
| 🌐 **Hebrew First**    | Complete RTL support with Hebrew UI                        |
| 📱 **Responsive**      | Optimized for all devices - desktop, tablet, mobile        |
| 👨‍🍳 **Cooking Mode**    | Distraction-free cooking experience                        |
| 🛒 **Smart Cart**      | Intelligent shopping list management                       |
| 🔒 **Secure**          | JWT + OAuth authentication                                 |
| 📊 **Admin Dashboard** | Full control with usage analytics                          |
| 🔗 **Social Sharing**  | Open Graph meta tags for rich previews                     |

### Key Highlights

- **Full MERN Stack** - MongoDB, Express.js, React 18, Node.js
- **AI Integration** - Groq API with usage tracking dashboard
- **Cloud Storage** - Cloudinary for image management with auto-optimization
- **Authentication** - JWT tokens + Google OAuth 2.0
- **Real-time Feedback** - Toast notifications throughout the app
- **Soft Delete** - Recipe restoration from trash

---

## 📸 Screenshots

<details>
<summary><b>Click to expand screenshots</b></summary>

### Desktop View

| Home Page                     | Recipe Detail                     | AI Assistant              |
| ----------------------------- | --------------------------------- | ------------------------- |
| ![Home](screenshots/home.png) | ![Recipe](screenshots/recipe.png) | ![AI](screenshots/ai.png) |

### Mobile View

| Browse                                          | Cooking Mode                        | Cart                          |
| ----------------------------------------------- | ----------------------------------- | ----------------------------- |
| ![Mobile Browse](screenshots/mobile-browse.png) | ![Cooking](screenshots/cooking.png) | ![Cart](screenshots/cart.png) |

### Admin Dashboard

| Users Management                      | Groq API Stats                      |
| ------------------------------------- | ----------------------------------- |
| ![Users](screenshots/admin-users.png) | ![Groq](screenshots/admin-groq.png) |

</details>

---

## ✨ Features

### 🔐 Authentication & Users

- **JWT-based authentication** with secure password hashing (bcrypt)
- **Google OAuth 2.0** integration for easy login
- **Role-based access control**:
  - `User` - Browse and save recipes
  - `Poster` - Create tags and recipes
  - `Admin` - Full system access
- **Session management** with auto-expiry warnings
- **Account suspension** support for admins

### 📝 Recipe Management

- **CRUD Operations**: Create, read, update, and soft-delete recipes
- **Rich Content**: Support for images (Cloudinary), videos, detailed instructions
- **Visibility Controls**: Public, Shared, and Private recipes
- **Rating System**: 5-star ratings with user reviews
- **Advanced Search**: Full-text search across titles, descriptions, and ingredients
- **Tag Filtering**: Categorized tags for easy organization
- **Recipe Restoration**: Recover deleted recipes from trash
- **Favorites**: Save recipes to your personal collection

### 🤖 AI Assistant (Groq)

| Feature                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| **Smart Recommendations** | Personalized recipe suggestions based on preferences |
| **Interactive Wizard**    | Step-by-step question flow to find perfect recipes   |
| **Tag Generation**        | AI-powered tag suggestions for new recipes           |
| **Hebrew Support**        | Full conversational AI in Hebrew language            |
| **Usage Dashboard**       | Monitor API usage with detailed stats (Admin only)   |
| **Multiple Models**       | Support for Llama 3.3 70B, Mixtral, Gemma 2          |

### 🛒 Shopping Cart

- **One-Click Add**: Add all ingredients from any recipe
- **Smart Grouping**: Items organized by recipe
- **Progress Tracking**: Check off purchased items
- **Persistent Storage**: Cart saved per user
- **Quick Navigation**: Jump back to recipe from cart

### 👨‍🍳 Cooking Mode

- **Full-Screen Experience**: Distraction-free cooking view
- **Large Typography**: Easy-to-read instructions
- **Auto-Hide Navigation**: Maximum screen real estate
- **Mobile Optimized**: Perfect for kitchen use
- **Step-by-Step**: Clear progression through instructions

### 🌐 Internationalization

- **Hebrew UI**: Complete Hebrew language interface
- **RTL Layout**: Full right-to-left support
- **Localized Dates**: Hebrew date formatting
- **Cultural Adaptation**: Israeli food categories and tags

### 📱 Additional Features

- **Open Graph**: Rich social media previews when sharing (WhatsApp, Facebook, Twitter)
- **Image Optimization**: Auto-compression and Cloudinary CDN
- **Toast Notifications**: Real-time user feedback
- **Error Handling**: Graceful error management
- **Mobile Responsive**: Works on all screen sizes
- **Admin Panel**: User management, tag management, analytics

---

## 🛠️ Tech Stack

### Backend

| Technology                                                                                                       | Purpose             | Version |
| ---------------------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)          | Runtime environment | 18.x    |
| ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white)          | Web framework       | 4.x     |
| ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)          | Database            | 7.x     |
| ![Mongoose](https://img.shields.io/badge/-Mongoose-880000?style=flat-square)                                     | ODM                 | 8.x     |
| ![JWT](https://img.shields.io/badge/-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)            | Authentication      | -       |
| ![Passport](https://img.shields.io/badge/-Passport-34E27A?style=flat-square)                                     | OAuth middleware    | -       |
| ![Cloudinary](https://img.shields.io/badge/-Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) | Image storage       | -       |
| ![Groq](https://img.shields.io/badge/-Groq-F55036?style=flat-square)                                             | AI integration      | -       |
| ![Multer](https://img.shields.io/badge/-Multer-FF6600?style=flat-square)                                         | File uploads        | -       |
| ![bcrypt](https://img.shields.io/badge/-bcrypt-003A70?style=flat-square)                                         | Password hashing    | -       |

### Frontend

| Technology                                                                                                              | Purpose          | Version |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------- | ------- |
| ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)                       | UI library       | 18.2.0  |
| ![React Router](https://img.shields.io/badge/-React%20Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white) | Routing          | 6.x     |
| ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)     | Styling          | 3.x     |
| ![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)                       | HTTP client      | -       |
| ![React Toastify](https://img.shields.io/badge/-Toastify-FFCA28?style=flat-square)                                      | Notifications    | -       |
| ![Context API](https://img.shields.io/badge/-Context%20API-61DAFB?style=flat-square)                                    | State management | -       |

### Development Tools

| Tool                                                                                                       | Purpose              |
| ---------------------------------------------------------------------------------------------------------- | -------------------- |
| ![Nodemon](https://img.shields.io/badge/-Nodemon-76D04B?style=flat-square&logo=nodemon&logoColor=white)    | Auto-restart server  |
| ![Concurrently](https://img.shields.io/badge/-Concurrently-333?style=flat-square)                          | Run multiple scripts |
| ![ESLint](https://img.shields.io/badge/-ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)       | Code linting         |
| ![Prettier](https://img.shields.io/badge/-Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black) | Code formatting      |

---

## 🏗️ Architecture

### Project Structure

```
RecipeMaster/
├── 📁 client/                 # React frontend
│   ├── 📁 public/             # Static assets
│   └── 📁 src/
│       ├── 📁 components/     # Reusable UI components
│       ├── 📁 context/        # React Context providers
│       ├── 📁 pages/          # Page components
│       └── 📄 App.js          # Root component
├── 📁 controllers/            # Business logic
├── 📁 middleware/             # Auth, validation, error handling
├── 📁 models/                 # MongoDB schemas
├── 📁 routes/                 # API endpoints
├── 📁 config/                 # Configuration files
├── 📁 scripts/                # Utility scripts (seeding, etc.)
├── 📄 server.js               # Application entry point
└── 📄 package.json            # Dependencies
```

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages    │  Components  │  Context    │  Hooks     │  Utils    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS (Axios)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Routes   │  Controllers │  Middleware │  Models    │  Config   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ MongoDB  │       │Cloudinary│       │  Groq AI │
    │ Database │       │  Images  │       │  Service │
    └──────────┘       └──────────┘       └──────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version  | Check Command      |
| ----------- | -------- | ------------------ |
| Node.js     | ≥ 18.0.0 | `node --version`   |
| npm         | ≥ 9.0.0  | `npm --version`    |
| MongoDB     | ≥ 6.0    | `mongod --version` |
| Git         | Any      | `git --version`    |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lidormalich/RecipeMaster.git
cd RecipeMaster

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Set up environment variables (see Configuration section)
# Create .env file with required variables

# 4. Seed initial tags (optional)
npm run seed:tags

# 5. Start development server
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Running Options

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start both server and client (development) |
| `npm run server`    | Start backend only                         |
| `npm run client`    | Start frontend only                        |
| `npm start`         | Start production server                    |
| `npm run seed:tags` | Seed database with tags                    |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
MONGODB_URI=mongodb://localhost:27017/recipemaster
# For MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/recipemaster

# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ═══════════════════════════════════════════════════════════════
# GOOGLE OAUTH (Optional)
# ═══════════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Get from: https://console.cloud.google.com/apis/credentials

# ═══════════════════════════════════════════════════════════════
# CLOUDINARY (Image Storage)
# ═══════════════════════════════════════════════════════════════
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# Get from: https://cloudinary.com/console

# ═══════════════════════════════════════════════════════════════
# AI INTEGRATION (Groq)
# ═══════════════════════════════════════════════════════════════
GROQ_API_KEY=gsk_your_groq_api_key
# Get from: https://console.groq.com/keys

# ═══════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:3000
```

### Client Environment (Optional)

Create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📡 API Documentation

### Base URL

```
Development: http://localhost:5000/api
Production:  https://recipemaster.onrender.com/api
```

### Authentication Endpoints

| Method | Endpoint                | Description       | Auth |
| ------ | ----------------------- | ----------------- | ---- |
| `POST` | `/auth/register`        | Register new user | No   |
| `POST` | `/auth/login`           | Login user        | No   |
| `GET`  | `/auth/me`              | Get current user  | Yes  |
| `GET`  | `/auth/google`          | Google OAuth      | No   |
| `GET`  | `/auth/google/callback` | OAuth callback    | No   |

### Recipe Endpoints

| Method   | Endpoint                      | Description            | Auth     |
| -------- | ----------------------------- | ---------------------- | -------- |
| `GET`    | `/recipes`                    | Get all public recipes | Optional |
| `GET`    | `/recipes/:shortId`           | Get single recipe      | Optional |
| `POST`   | `/recipes`                    | Create new recipe      | Yes      |
| `PUT`    | `/recipes/:shortId`           | Update recipe          | Owner    |
| `DELETE` | `/recipes/:shortId`           | Soft delete recipe     | Owner    |
| `GET`    | `/recipes/user/:userId`       | Get user's recipes     | Optional |
| `GET`    | `/recipes/deleted/all`        | Get deleted recipes    | Yes      |
| `PATCH`  | `/recipes/:shortId/restore`   | Restore recipe         | Owner    |
| `DELETE` | `/recipes/:shortId/permanent` | Permanent delete       | Owner    |

### AI Endpoints

| Method | Endpoint                  | Description            | Auth |
| ------ | ------------------------- | ---------------------- | ---- |
| `POST` | `/recipes/ai-recommend`   | Get AI recommendations | No   |
| `GET`  | `/recipes/available-tags` | Get available tags     | No   |
| `POST` | `/recipes/search-by-tags` | Search by tags         | No   |

### Cart Endpoints

| Method   | Endpoint                 | Description      | Auth |
| -------- | ------------------------ | ---------------- | ---- |
| `GET`    | `/recipes/user/cart`     | Get user's cart  | Yes  |
| `POST`   | `/recipes/:shortId/cart` | Add to cart      | Yes  |
| `DELETE` | `/recipes/:shortId/cart` | Remove from cart | Yes  |

### Admin Endpoints

| Method  | Endpoint                   | Description          | Auth  |
| ------- | -------------------------- | -------------------- | ----- |
| `GET`   | `/admin/users`             | Get all users        | Admin |
| `PATCH` | `/admin/users/:id/role`    | Update user role     | Admin |
| `PATCH` | `/admin/users/:id/suspend` | Suspend user         | Admin |
| `GET`   | `/groq/usage`              | Get API usage stats  | Admin |
| `GET`   | `/groq/available-months`   | Get months with data | Admin |

### Example Requests

<details>
<summary><b>Register User</b></summary>

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

</details>

<details>
<summary><b>Create Recipe</b></summary>

```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Homemade Pasta",
    "description": "Delicious fresh pasta",
    "ingredients": "2 cups flour\n3 eggs\n1 tsp salt",
    "instructions": "Mix and knead for 10 minutes...",
    "visibility": "Public"
  }'
```

</details>

---

## 🗄️ Database Schema

### Models Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Users     │     │   Recipes    │     │    Tags      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ _id          │◄────┤ author       │     │ globalId     │
│ name         │     │ shortId      │     │ name         │
│ email        │     │ title        │     │ category     │
│ password     │     │ tags[]───────┼────►│              │
│ role         │     │ visibility   │     └──────────────┘
│ favorites[]  │     │ isDeleted    │
└──────────────┘     └──────────────┘
                            │
┌──────────────┐            │
│  GroqUsage   │            │
├──────────────┤            │
│ model        │            │
│ tokens       │            │
│ endpoint     │            │
│ responseTime │            │
└──────────────┘            │
```

---

## 🚀 Deployment

### Render.com (Recommended)

1. **Connect GitHub Repository**
2. **Configure Build Settings:**
   - Build Command: `npm install && cd client && npm install && npm run build && cd ..`
   - Start Command: `npm start`
3. **Set Environment Variables** in dashboard
4. **Deploy!**

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
BASE_URL=https://your-domain.com
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Commit Convention

| Type       | Description                  |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `docs`     | Documentation                |
| `style`    | Code style (no logic change) |
| `refactor` | Code refactoring             |
| `test`     | Adding tests                 |
| `chore`    | Maintenance                  |

---

## 🗺️ Roadmap

### Completed ✅

- [x] Core MERN application
- [x] JWT + OAuth authentication
- [x] Recipe CRUD with visibility
- [x] AI-powered recommendations
- [x] Shopping cart
- [x] Cooking mode
- [x] Hebrew RTL support
- [x] Open Graph meta tags
- [x] Admin dashboard
- [x] Groq usage tracking

### In Progress 🚧

- [ ] Advanced search filters
- [ ] Recipe import from URL
- [ ] Nutrition information

### Planned 📋

- [ ] Mobile app (React Native)
- [ ] Meal planning calendar
- [ ] Social features (follow, share)
- [ ] Multi-language support
- [ ] PWA offline mode

---

## ❓ FAQ

<details>
<summary><b>Is RecipeMaster free to use?</b></summary>

Yes! RecipeMaster is completely free and open-source under the MIT license.

</details>

<details>
<summary><b>Do I need an account to browse recipes?</b></summary>

No, you can browse public recipes without an account. However, you'll need to register to create recipes, use the cart, or access AI features.

</details>

<details>
<summary><b>What AI models are supported?</b></summary>

We use Groq's free tier with models like Llama 3.3 70B, Mixtral 8x7B, and Gemma 2. See the admin dashboard for detailed usage stats.

</details>

<details>
<summary><b>Can I self-host RecipeMaster?</b></summary>

Absolutely! Follow the installation guide and you can run it on any server with Node.js and MongoDB.

</details>

---

## 🆘 Support

- **Documentation**: This README
- **Bug Reports**: [GitHub Issues](https://github.com/lidormalich/recipemaster/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/lidormalich/recipemaster/discussions)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙌 Credits

### Creator

**Lidor Cohen** - Full-Stack Developer

- GitHub: [@lidormalich](https://github.com/lidormalich)

### Built With

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Passport.js
- **Frontend**: React 18, Tailwind CSS, React Router, Axios
- **AI**: Groq (Llama 3.3 70B)
- **Media**: Cloudinary
- **Auth**: Google OAuth 2.0

---

<div align="center">

**Made with ❤️ for food lovers worldwide** 🍳✨

[![Star this repo](https://img.shields.io/github/stars/lidormalich/recipemaster?style=social)](https://github.com/lidormalich/recipemaster)

</div>
