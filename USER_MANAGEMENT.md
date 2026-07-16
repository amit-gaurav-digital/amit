# User Management System Documentation

## Overview

The User Management system provides complete multi-user support with role-based access control (RBAC), authentication, authorization, and comprehensive audit logging for the AI blogging platform.

## Features

### Authentication
- Secure user registration and login with JWT tokens
- Password hashing with bcryptjs
- Account lockout after failed login attempts
- Password reset via email
- Token refresh mechanism
- Session management

### Authorization
- Role-based access control (RBAC)
- Permission-based resource access
- Role hierarchy (Admin > Reviewer > Editor > Viewer)
- Resource-level authorization (can edit own vs all)

### User Management
- Create, read, update, and delete users
- Assign roles to users
- Activate/deactivate user accounts
- User profile management
- Bulk operations (assign roles, deactivate users)

### Security
- Minimum password requirements (12 characters, uppercase, lowercase, numbers, special chars)
- Password history
- Account lockout (15 minutes after 5 failed attempts)
- Audit trail for all actions
- IP address and user agent tracking
- Immutable audit records with 90-day retention

### Audit Logging
- Comprehensive action logging
- User activity tracking
- Resource change history
- Timeline view of all actions
- Filterable and searchable audit logs
- CSV export capability

## Database Models

### User
```javascript
{
  email: String (unique),
  passwordHash: String,
  name: String,
  role: String (admin|editor|reviewer|viewer),
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
  department: String,
  notificationPreferences: {
    emailOnApproval: Boolean,
    emailOnRejection: Boolean,
    emailOnPublication: Boolean,
    dailyDigest: Boolean,
    weeklyReport: Boolean
  },
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Role
```javascript
{
  name: String (unique),
  description: String,
  permissions: [String],
  isBuiltIn: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### UserAudit
```javascript
{
  userId: ObjectId,
  actionType: String,
  resourceType: String,
  resourceId: ObjectId,
  resourceName: String,
  changes: { before: Mixed, after: Mixed },
  ipAddress: String,
  userAgent: String,
  status: String (success|failed),
  errorMessage: String,
  createdAt: Date (expires after 90 days)
}
```

## Roles and Permissions

### Admin
- Full system access
- Can manage users and roles
- Can approve and publish blogs
- Can view all audit logs
- Can manage system settings

**Permissions**: blog.create, blog.read, blog.edit.all, blog.delete.all, blog.approve, blog.publish, blog.unpublish, user.create, user.read, user.edit.all, user.delete, role.manage, permission.manage, settings.view, settings.edit, audit.view, analytics.view

### Editor
- Can create and edit own blogs
- Cannot approve or publish
- Can view analytics
- Cannot manage users

**Permissions**: blog.create, blog.read, blog.edit.own, blog.delete.own, user.read, user.edit.own, settings.view, analytics.view

### Reviewer
- Can approve and publish blogs
- Cannot edit blogs (read-only)
- Cannot create new users
- Can view analytics

**Permissions**: blog.read, blog.approve, blog.publish, blog.unpublish, user.read, user.edit.own, settings.view, analytics.view

### Viewer
- Read-only access to published blogs
- Can manage own profile
- Can view limited analytics

**Permissions**: blog.read, user.read, user.edit.own, settings.view, analytics.view

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify` - Verify token validity

### User Management
- `GET /api/users` - List all users (Admin only)
- `POST /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id/role` - Assign role (Admin only)
- `POST /api/users/:id/deactivate` - Deactivate user (Admin only)
- `POST /api/users/:id/activate` - Activate user (Admin only)
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/audit` - Get user audit log
- `POST /api/users/bulk/assign-role` - Bulk assign roles (Admin only)
- `POST /api/users/bulk/deactivate` - Bulk deactivate users (Admin only)

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create custom role (Admin only)
- `PUT /api/roles/:id` - Update role (Admin only)
- `DELETE /api/roles/:id` - Delete custom role (Admin only)

### Audit Logs
- `GET /api/audit` - Get paginated audit log (Admin only)
- `GET /api/audit/user/:userId` - Get user's actions
- `GET /api/audit/resource/:resourceType/:resourceId` - Get resource history
- `GET /api/audit/summary` - Get audit summary by time period
- `GET /api/audit/timeline` - Get latest audit events

## Frontend Components

### Login Page (`/login`)
- Email and password authentication
- Password visibility toggle
- Forgot password flow
- Demo credentials display

### User Management Page (`/dashboard/users`)
- List all users with pagination
- Search and filter by role
- Create new users
- Assign roles inline
- Deactivate/activate users
- View user statistics

### Profile Page (`/dashboard/profile`)
- View and edit profile information
- Change password with validation
- Manage notification preferences
- View membership date and role

### Audit Log Page (`/dashboard/audit`)
- Comprehensive audit log viewer
- Advanced filtering options
- Export to CSV functionality
- Audit summary statistics
- Timeline view of activities

## Environment Variables

Backend (`.env`):
```
JWT_SECRET=your_secret_key
JWT_EXPIRY=24h
PASSWORD_MIN_LENGTH=12
ENABLE_USER_REGISTRATION=false
DEFAULT_USER_ROLE=viewer
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Usage Examples

### Create a New User (Admin Only)
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@example.com",
    "password": "SecurePassword123!",
    "name": "John Editor",
    "role": "editor",
    "department": "Marketing"
  }'
```

### Assign Role (Admin Only)
```bash
curl -X PUT http://localhost:3001/api/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "reviewer"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123!"
  }'
```

### Get Audit Log
```bash
curl -X GET 'http://localhost:3001/api/audit?limit=50&actionType=login' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Permission Hierarchy

Users can only perform actions they have explicit permission for:

```
User Action → hasPermission(userId, permission) → Check User Role
                                                  → Check User Permissions
                                                  → Check Role Permissions
                                                  → Return True/False
```

For resource-level permissions:
```
Edit Blog → hasPermission('blog.edit.all') OR 
            (hasPermission('blog.edit.own') AND blog.createdBy === userId)
```

## Security Considerations

1. **Password Security**
   - Minimum 12 characters
   - Must contain uppercase, lowercase, numbers, special characters
   - Stored as bcrypt hash (not reversible)
   - Password changes tracked in audit log

2. **Session Security**
   - JWT tokens expire after 24 hours
   - Refresh tokens valid for 7 days
   - Token verification on every protected route
   - Tokens included in Authorization header

3. **Account Security**
   - Account lockout after 5 failed login attempts
   - 15-minute cooldown before retry
   - Failed attempts logged with IP address
   - Cannot reset lockout manually by user

4. **Audit Trail**
   - Every action logged with user, timestamp, IP, user agent
   - Immutable records (cannot be deleted)
   - 90-day retention by default
   - Includes "before/after" values for changes

5. **Permission Enforcement**
   - Checked on every endpoint
   - Cannot access resources unless authorized
   - Cannot escalate own permissions
   - Admin actions logged separately

## Migration from No User Management

If migrating existing data:

1. Create default admin user during initialization
2. Assign all existing blogs to admin user
3. Create additional users as needed
4. Assign appropriate roles to each user

## Troubleshooting

### Account Locked
- User is locked for 15 minutes after 5 failed attempts
- Automatically unlocks after cooldown period
- Cannot be manually unlocked by user (admin only)

### Password Reset Not Working
- Check email configuration in `.env`
- Verify reset token hasn't expired (30 min validity)
- Check spam folder for reset email

### Permission Denied Errors
- Verify user's role has required permission
- Check if editing own resource (requires different permission)
- Admin can view audit log to see what permission was required

### Cannot Login
- Check user account is active (`isActive: true`)
- Check account isn't locked
- Verify email and password are correct
- Check user role was assigned

## Performance

- User queries indexed on email, role, and isActive
- Audit logs indexed on userId, actionType, resourceType
- Automatic index creation on startup
- Audit log data expires after 90 days (TTL index)

## Future Enhancements

- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub)
- Single Sign-On (SSO)
- API key management for programmatic access
- Role hierarchies (custom role inheritance)
- Advanced audit log analytics
- Email digest notifications
