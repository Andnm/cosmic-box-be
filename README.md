## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Letters
- `POST /api/letters` - Create new letter
- `GET /api/letters/my` - Get my letters
- `GET /api/letters/received` - Get received letters
- `PUT /api/letters/:id/archive` - Archive letter
- `DELETE /api/letters/:id` - Delete draft letter

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/letters/pending` - Get pending letters
- `PUT /api/admin/letters/:id/review` - Review letter
- `GET /api/admin/letters` - Get all letters
- `GET /api/admin/payments` - Get all payments

### Connections
- `GET /api/connections/users` - Get users list
- `POST /api/connections/requests` - Create connection request
- `GET /api/connections/requests` - Get my connection requests
- `PUT /api/connections/requests/:id/respond` - Respond to request

### Chat
- `GET /api/chat/conversations` - Get my conversations
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/conversations/:id/read` - Mark as read

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Payments
- `GET /api/payments` - Get my payments
- `GET /api/payments/request/:id/status` - Get payment status
- `POST /api/payments/webhook/payos` - PayOS webhook

