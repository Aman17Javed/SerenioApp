# 🧠 Serenio - AI-Powered Mental Health Platform

A comprehensive mental health platform that combines traditional therapy services with cutting-edge AI technology to provide personalized mental health support.

![Serenio Logo](serenio-frontend/src/assets/logo.png)

## 🌟 Features

### 🤖 AI-Powered Chatbot with RAG
- **Retrieval-Augmented Generation (RAG)** for contextually relevant responses
- **Mental Health Knowledge Base** integration for accurate information
- **Sentiment Analysis** to understand user emotional state
- **Personalized Conversations** based on user history and preferences
- **24/7 Availability** for immediate support

### 👥 User Management
- **Secure Authentication** with JWT tokens
- **User Profiles** with mental health history tracking
- **Role-based Access** (Users, Psychologists, Admins)
- **Privacy Protection** with encrypted data storage

### 📅 Appointment System
- **Real-time Booking** with available psychologists
- **Calendar Integration** for seamless scheduling
- **Reminder System** for upcoming sessions
- **Video Call Integration** for remote therapy

### 📊 Mood Tracking & Analytics
- **Daily Mood Logging** with sentiment analysis
- **Progress Visualization** with interactive charts
- **Trend Analysis** to identify patterns
- **Personalized Insights** and recommendations

### 💳 Payment Integration
- **Stripe Payment Gateway** for secure transactions
- **Multiple Payment Methods** support
- **Subscription Plans** for ongoing therapy
- **Automated Billing** and invoicing

### 💬 Real-time Communication
- **Live Chat** between users and psychologists
- **File Sharing** for documents and resources
- **Message History** for reference
- **Push Notifications** for important updates

### 📈 Admin Dashboard
- **Analytics Dashboard** with key metrics
- **User Management** tools
- **Content Management** for knowledge base
- **System Monitoring** and health checks

## 🛠 Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API communication
- **Chart.js** - Data visualization
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication and authorization

### AI & Machine Learning
- **OpenAI GPT** - Natural language processing
- **RAG Implementation** - Retrieval-augmented generation
- **Sentiment Analysis** - Emotional state detection
- **Vector Embeddings** - Semantic search capabilities

### Infrastructure
- **Stripe API** - Payment processing
- **Socket.io** - Real-time bidirectional communication
- **Nodemailer** - Email service integration
- **Multer** - File upload handling

### Development Tools
- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code quality
- **Prettier** - Code formatting

## 🚀 Getting Started

### 🌐 Live Application
- **Frontend**: [https://serenio-frontend-inky.vercel.app](https://serenio-frontend-inky.vercel.app)
- **Backend API**: [https://serenio-production.up.railway.app](https://serenio-production.up.railway.app)

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aman17Javed/SerenioApp.git
   cd SerenioApp
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Serenio-Backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../serenio-frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in `Serenio-Backend/`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   FLASK_URL=http://127.0.0.1:5001
   FLASK_PORT=5001
   ```

5. **Start the Application**
   
   **Backend:**
   ```bash
   cd Serenio-Backend
   npm start
   ```
   
   **Frontend:**
   ```bash
   cd serenio-frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### 🚀 Deployment

#### Frontend (Vercel)
The frontend is deployed on Vercel with automatic deployments from the main branch.

#### Backend (Railway)
The backend is deployed on Railway with the following configuration:
- **Platform**: Railway
- **Database**: MongoDB Atlas
- **Environment Variables**: Configured in Railway dashboard
- **Auto-deploy**: Enabled from main branch

## 🤖 AI Chatbot Features

### RAG Implementation
The chatbot uses Retrieval-Augmented Generation to provide accurate, contextually relevant responses:

- **Knowledge Base Integration**: Access to comprehensive mental health information
- **Semantic Search**: Find relevant information based on user queries
- **Context Awareness**: Maintains conversation context for better responses
- **Factual Accuracy**: Combines AI generation with verified information

### Sentiment Analysis
- **Real-time Emotion Detection**: Analyzes user messages for emotional state
- **Mood Tracking**: Logs and tracks emotional patterns over time
- **Personalized Responses**: Adapts responses based on detected emotions
- **Crisis Detection**: Identifies potential mental health crises

## 📱 User Interface

### Responsive Design
- **Mobile-First Approach**: Optimized for all device sizes
- **Accessibility Features**: WCAG compliant design
- **Dark/Light Mode**: User preference support
- **Intuitive Navigation**: Easy-to-use interface

### Key Screens
- **Landing Page**: Introduction and feature overview
- **User Dashboard**: Personal health metrics and appointments
- **Chat Interface**: AI chatbot and psychologist communication
- **Mood Tracker**: Daily mood logging and visualization
- **Appointment Booking**: Calendar-based scheduling system

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Bcrypt hashing for user passwords
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin resource sharing security
- **Rate Limiting**: API request throttling
- **Data Encryption**: Sensitive data encryption at rest

## 📊 API Documentation

**Base URL**: `https://serenio-production.up.railway.app`

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/mood-logs` - Get mood history

### Appointment System
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Book new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### AI Chatbot
- `POST /api/chatbot/message` - Send message to AI chatbot
- `GET /api/chatbot/history` - Get chat history
- `POST /api/chatbot/sentiment` - Analyze message sentiment
- `GET /api/chatbot/health` - Health check endpoint

### Payment Integration
- `POST /api/payment/create-session` - Create payment session
- `POST /api/payment/webhook` - Stripe webhook handler
- `GET /api/payment/history` - Get payment history

### Additional Endpoints
- `GET /` - Health check
- `GET /api/dashboard` - Dashboard data
- `GET /api/recommendations` - Get recommendations
- `POST /api/feedback` - Submit feedback

## 🧪 Testing

```bash
# Backend Tests
cd Serenio-Backend
npm test

# Frontend Tests
cd serenio-frontend
npm test
```

## 🏗️ Architecture & Deployment

### Frontend (Vercel)
- **Platform**: Vercel
- **Framework**: React.js
- **Build**: Automatic from main branch
- **Domain**: https://serenio-frontend-inky.vercel.app
- **Features**: 
  - Global CDN
  - Automatic HTTPS
  - Edge functions support
  - Real-time preview deployments

### Backend (Railway)
- **Platform**: Railway
- **Runtime**: Node.js
- **Database**: MongoDB Atlas
- **Domain**: https://serenio-production.up.railway.app
- **Features**:
  - Auto-scaling
  - Environment variable management
  - Database integration
  - Health monitoring

### Database
- **Platform**: MongoDB Atlas
- **Type**: NoSQL Document Database
- **Features**: 
  - Automatic backups
  - Global distribution
  - Real-time analytics
  - Built-in security

## 📈 Performance

- **Response Time**: < 200ms for API calls
- **Uptime**: 99.9% availability
- **Scalability**: Auto-scaling on Railway
- **CDN**: Global content delivery via Vercel
- **Database**: Optimized queries with MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aman Javed**
- GitHub: [@Aman17Javed](https://github.com/Aman17Javed)
- LinkedIn: [Aman Javed](https://linkedin.com/in/aman-javed)

## 🙏 Acknowledgments

- OpenAI for GPT integration
- Stripe for payment processing
- MongoDB for database services
- React and Node.js communities

## 📞 Support

For support, email support@serenio.com or create an issue in this repository.

---

**Serenio** - Empowering mental health through AI technology 🧠✨ 