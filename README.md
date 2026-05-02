# User Management System

A full-stack user management application with authentication, two-factor authentication, and a modern React UI.

## Features

- 🔐 **Secure Authentication**: JWT-based login system
- 🛡️ **Two-Factor Authentication**: TOTP support with QR codes
- 👥 **User Management**: Full CRUD operations for users
- 📊 **Dashboard**: Overview statistics and recent user activity
- 🎨 **Modern UI**: Material-UI based React frontend
- 🗄️ **Database**: MongoDB with Mongoose ODM
- 🔒 **Security**: Password hashing, input validation, protected routes

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcrypt for password hashing
- Speakeasy for 2FA
- QRCode generation

### Frontend
- React 18
- Material-UI (MUI)
- React Router for navigation
- Axios for API calls
- DataGrid for user management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB running locally or MongoDB Atlas account
- npm or yarn package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd users
npm install
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/users
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
ADMIN_RESET_TOKEN=admin-super-secret-token-change-in-production
```

**Important**: Change the `SECRET_KEY` to a secure random string in production.

### 3. Database Setup

Make sure MongoDB is running locally, or update the `MONGODB_URI` to point to your MongoDB instance.

### 4. Start the Application

#### Option 1: Run Both Backend and Frontend Together
```bash
npm run dev
```

#### Option 2: Run Separately

**Backend (Terminal 1):**
```bash
npm start
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## API Endpoints

### Authentication
- `POST /v1/signup` - Basic user registration
- `POST /v1/signup-with-2fa` - User registration with automatic 2FA setup
- `POST /v1/verify-signup-2fa` - Verify 2FA during signup process
- `POST /v1/login` - User login (returns temp token if 2FA required)
- `POST /v1/complete-login-2fa` - Complete login with 2FA verification
- `POST /v1/change-password` - Change password with old password
- `POST /v1/reset-password` - Reset password with or without old password
- `POST /v1/admin-reset-password` - Admin password reset (no old password required)
- `POST /v1/generate-reset-token` - Generate password reset token
- `POST /v1/reset-password-with-token` - Reset password using reset token
- `POST /v1/setup-two-factor` - Enable 2FA
- `POST /v1/verify-two-factor` - Verify 2FA token
- `POST /v1/disable-two-factor` - Disable 2FA

### User Management
- `GET /v1/users` - List all users
- `GET /v1/users/:id` - Get specific user
- `POST /v1/users` - Create new user
- `PUT /v1/users/:id` - Update user
- `PATCH /v1/users/:id` - Partial user update
- `DELETE /v1/users/:id` - Delete user

## Usage

### 1. Signup & Login
- **New Users**: Navigate to http://localhost:3000/signup to create an account
- **Existing Users**: Navigate to http://localhost:3000/login to sign in
- **Gmail Integration**: Use the Gmail button to generate a Gmail-style email address
- **Two-Factor Setup**: Automatically configured during signup process

### 2. Dashboard
- View system statistics
- See recent user activity
- Quick overview of user counts and 2FA status

### 3. User Management
- **View Users**: See all users in a searchable data grid
- **Add User**: Click "Add User" to create new accounts
- **Edit User**: Click the edit icon to modify user details
- **Delete User**: Click the delete icon to remove users
- **Search**: Use the search bar to find specific users

### 4. Password Reset
- **With Old Password**: Traditional password change requiring current password
- **With Reset Token**: Generate a secure token and reset password without old password
- **Admin Reset**: Administrators can reset any user's password using admin token
- **Multiple Methods**: Choose the most appropriate reset method for your situation

### 5. Two-Factor Authentication
- **Automatic Setup**: 2FA is configured during signup process
- **QR Code Generation**: Scan with Google Authenticator, Authy, etc.
- **Manual Setup**: Existing users can enable/disable 2FA from dashboard
- **Enhanced Security**: TOTP-based authentication with 6-digit codes
- **Multiple Apps**: Support for all major authenticator applications

## Project Structure

```
users/
├── app/
│   └── controllers/          # API controllers
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── App.js          # Main app component
├── middleware/               # Express middleware
├── models/                   # Mongoose models
├── routes/                   # API routes
├── main.js                   # Express server
└── package.json
```

## Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **JWT Tokens**: Secure authentication with expiration
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Email format and data sanitization
- **Protected Routes**: All user operations require authentication
- **CORS Configuration**: Proper cross-origin resource sharing

## Development

### Available Scripts

- `npm start` - Start backend server
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build frontend for production
- `npm run install-frontend` - Install frontend dependencies

### Adding New Features

1. **Backend**: Add routes in `routes/` directory, controllers in `app/controllers/`
2. **Frontend**: Add components in `frontend/src/components/`, update routing in `App.js`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **Port Already in Use**: Change the PORT in `.env` file
3. **Frontend Build Errors**: Clear `node_modules` and reinstall dependencies
4. **Authentication Issues**: Check JWT token expiration and secret key configuration

### Logs

- Backend logs appear in the terminal running `npm start`
- Frontend logs appear in the browser console and terminal

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `SECRET_KEY`
3. Configure MongoDB Atlas or production MongoDB instance
4. Set up proper CORS origins
5. Use environment variables for all sensitive configuration
6. Build frontend with `npm run build`
7. Serve static files from Express or use a CDN

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
