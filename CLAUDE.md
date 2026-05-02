# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start backend only (with nodemon auto-reload)
npm start

# Start backend + frontend together
npm run dev

# Build frontend for production
npm run build

# Install frontend dependencies separately
npm run install-frontend
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:3000`.

## Environment Variables

Required in `.env`:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/users
SECRET_KEY=<jwt-secret>
FRONTEND_URL=http://localhost:3000
ADMIN_RESET_TOKEN=<admin-secret>
```

## Architecture

**Backend**: Express.js + MongoDB (Mongoose). Entry point is `main.js`.

- `routes/` — defines URL paths and attaches middleware
- `app/controllers/` — request handlers (business logic)
- `models/userModel.js` — Mongoose schema with two pre-save hooks: auto-increment integer `id` field, and bcrypt password hashing on modification
- `middleware/verifyToken.js` — reads JWT from the `Cookie` header (parses `jwtToken=<value>`)

**Route structure**:
- `POST /v1/*` → `authRoutes.js` (auth + password management)
- `GET|POST|PUT|PATCH|DELETE /v1/users/*` → `userRoutes.js` (CRUD, all protected)

**Authentication flow**:
1. Login → JWT (1h) returned; also set as `httpOnly` cookie
2. If 2FA enabled: login returns a 10-minute `tempToken` instead; client must call `POST /v1/complete-login-2fa` with `tempToken` + TOTP code to get the full JWT
3. All protected routes read the token from the `Cookie` header, not `Authorization`

**2FA**: Uses `speakeasy` (TOTP) + `qrcode`. Secret stored as `twoFactorSecret` (base32) on the User document. `twoFactorEnabled` is set to `true` only after the user successfully verifies a TOTP code.

**Password reset**: Three mechanisms exist — (1) change with old password, (2) `ADMIN_RESET_TOKEN` env var checked at runtime (no DB), (3) JWT-based reset token with `type: 'password_reset'` claim verified before update.

**User model note**: The schema has both a MongoDB `_id` (ObjectId) and a custom auto-incremented integer `id` field. Controllers in `userController.js` query by the integer `id`, while `authController.js` uses `_id`.
