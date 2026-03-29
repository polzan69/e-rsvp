# RSVP System - Super Admin & Authentication Testing Guide

## Base URL
```
http://localhost:5000/api/users
```

## 1. Create Admin User
**Method:** POST  
**Endpoint:** `/create`  
**Headers:** 
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "securePassword123",
  "role": "admin",
  "paymentStatus": "paid",
  "serviceType": "premium"
}
```

**Expected Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id_here",
    "email": "admin@example.com",
    "role": "admin",
    "paymentStatus": "paid",
    "serviceType": "premium"
  }
}
```

---

## 2. Create Super Admin User
**Method:** POST  
**Endpoint:** `/create`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "firstName": "Super",
  "lastName": "Admin",
  "password": "superPassword456",
  "role": "super_admin",
  "paymentStatus": "paid",
  "serviceType": "deluxe"
}
```

---

## 3. Create Invitee User
**Method:** POST  
**Endpoint:** `/create`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "invitee@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "invitee"
}
```

---

## 4. Login as Admin
**Method:** POST  
**Endpoint:** `/login`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_here",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

---

## 5. Login as Super Admin
**Method:** POST  
**Endpoint:** `/login`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "superPassword456"
}
```

---

## 6. Access Protected Route (Profile)
**Method:** GET  
**Endpoint:** `/profile`  
**Headers:**
```
Authorization: Bearer <your_jwt_token_here>
```

**Expected Response (200):**
```json
{
  "message": "Your profile",
  "user": {
    "userId": "user_id_here",
    "email": "admin@example.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "iat": 1703001234,
    "exp": 1703087634
  }
}
```

---

## 7. Get All Users (Admin View - Only Invitees)
**Method:** GET  
**Endpoint:** `/all`  
**Headers:**
```
Authorization: Bearer <admin_token_here>
```

**Expected Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "count": 1,
  "users": [
    {
      "_id": "user_id",
      "email": "invitee@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "invitee",
      "createdAt": "2024-03-29T10:00:00.000Z",
      "updatedAt": "2024-03-29T10:00:00.000Z"
    }
  ]
}
```

**Note:** Admins can only see invitees, not other admins or super admins.

---

## 8. Get All Users (Super Admin View - Everyone)
**Method:** GET  
**Endpoint:** `/all`  
**Headers:**
```
Authorization: Bearer <super_admin_token_here>
```

**Expected Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "count": 3,
  "users": [
    {
      "_id": "user_id_1",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "paymentStatus": "paid",
      "serviceType": "premium",
      "createdAt": "2024-03-29T10:00:00.000Z"
    },
    {
      "_id": "user_id_2",
      "email": "superadmin@example.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "super_admin",
      "paymentStatus": "paid",
      "serviceType": "deluxe"
    },
    {
      "_id": "user_id_3",
      "email": "invitee@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "invitee"
    }
  ]
}
```

---

## 9. Update User by ID (Admin - Limited Access)
**Method:** PUT  
**Endpoint:** `/:id`  
**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body (Admin can only update invitees with limited fields):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Expected Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "email": "invitee@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "invitee"
  }
}
```

**Attempting to update another admin (will fail):**
```
Response (403):
{
  "message": "Admins cannot edit other admin or super_admin accounts"
}
```

---

## 10. Update User by ID (Super Admin - Full Access)
**Method:** PUT  
**Endpoint:** `/:id`  
**Headers:**
```
Authorization: Bearer <super_admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "paymentStatus": "paid",
  "serviceType": "deluxe"
}
```

**Expected Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "firstName": "Updated",
    "lastName": "Name",
    "role": "admin",
    "paymentStatus": "paid",
    "serviceType": "deluxe"
  }
}
```

---

## 11. Delete User by ID (Super Admin Only)
**Method:** DELETE  
**Endpoint:** `/:id`  
**Headers:**
```
Authorization: Bearer <super_admin_token_here>
```

**Expected Response (200):**
```json
{
  "message": "User deleted successfully",
  "deletedUser": {
    "id": "user_id",
    "email": "invitee@example.com",
    "role": "invitee"
  }
}
```

**Attempting to delete with Admin token (will fail):**
```
Response (403):
{
  "message": "Only super admin can delete users"
}
```

**Attempting to delete another super_admin account (will fail):**
```
Response (403):
{
  "message": "Cannot delete other super admin accounts"
}
```

---

## Error Cases to Test

### Missing Email/Password
**Request:**
```json
{
  "email": "admin@example.com"
}
```
**Response (400):**
```json
{
  "message": "Email and password are required"
}
```

### Invitee Login Attempt
**Response (403):**
```json
{
  "message": "Invitees cannot login. Use OTP verification instead"
}
```

### Invalid Password
**Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

### Missing Authorization Header
**Response (401):**
```json
{
  "message": "No token provided"
}
```

### Expired/Invalid Token
**Response (401):**
```json
{
  "message": "Invalid or expired token"
}
```

### Invalid User ID (for update/delete)
**Response (400):**
```json
{
  "message": "Invalid user ID"
}
```

### User Not Found
**Response (404):**
```json
{
  "message": "User not found"
}
```

---

## Field Information

### Payment Status Values
- `pending` (default) - Payment not yet received
- `paid` - Payment successfully completed
- `failed` - Payment failed

### Service Type Values
- `standard` (default) - Standard RSVP service
- `premium` - Premium RSVP service with additional features
- `deluxe` - Deluxe RSVP service with all features

### Admin Updatable Fields
**Admins can update:**
- firstName
- lastName
- eventId

**Admins CANNOT update:**
- role
- password
- paymentStatus
- serviceType
- email

**Super Admins can update:**
- All fields except: role, _id, createdAt

---

## Authorization & Permissions Summary

| Role | Create Users | Login | View All Users | Update Users | Delete Users |
|------|------|------|------|------|------|
| **Admin** | ❌ | ✅ | ✅ (invitees only) | ✅ (invitees, limited fields) | ❌ |
| **Super Admin** | ❌* | ✅ | ✅ (all users) | ✅ (all users, all fields) | ✅ (except self) |

*Only through API, not requiring specific role

---

## Token Expiration
- Tokens expire in **24 hours**
- Users will need to login again after expiration

## Security Notes
- Change `JWT_SECRET` in `.env` to a strong, random key in production
- Store tokens securely on the client side
- Consider implementing token refresh mechanism later
- Passwords are hashed with bcryptjs (10 salt rounds)
- Admin accounts cannot modify other admin/super_admin accounts
- Only super_admin can delete users
- Super admin cannot delete other super_admin accounts
