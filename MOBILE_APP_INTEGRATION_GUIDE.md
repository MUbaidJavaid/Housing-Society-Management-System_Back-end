# Mobile App Integration Guide - Pre-Registration Signup

## Quick Start

### Step 1: Sign Up New Member

```
POST /auth/signup
Content-Type: application/json

{
  "memNic": "12345-6789012-3",
  "memContEmail": "user@example.com",
  "password": "YourPass123!",
  "confirmPassword": "YourPass123!"
}
```

**Requirements:**

- CNIC: 13-15 digits, numbers only
- Email: Valid email address (case-insensitive)
- Password: Min 8 chars, must contain:
  - At least 1 UPPERCASE letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (@$!%\*?&)

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "member": {
      "id": "6789abcdef012345",
      "memName": "John Doe",
      "memNic": "12345-6789012-3",
      "memContEmail": "user@example.com",
      "memContMob": "03001234567",
      "isActive": true,
      "emailVerified": false,
      "role": "MEMBER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Account created successfully"
}
```

**Error Response (400/401/409):**

```json
{
  "success": false,
  "error": "Member not found or not eligible for signup. Please verify CNIC and email.",
  "statusCode": 400
}
```

---

### Step 2: Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "member": {
      "id": "6789abcdef012345",
      "memName": "John Doe",
      "memNic": "12345-6789012-3",
      "memContEmail": "user@example.com",
      "memContMob": "03001234567",
      "lastLogin": "2026-01-21T10:30:00Z",
      "isActive": true,
      "emailVerified": false,
      "role": "MEMBER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Login successful"
}
```

**Error Cases:**

- Invalid credentials: HTTP 401
- Account locked (5 failed attempts): HTTP 423
- Account inactive/deleted: HTTP 401

---

### Step 3: Use Access Token for Authenticated Requests

```
GET /auth/profile
Authorization: Bearer {accessToken}
```

---

## Complete User Journey

```
1. Admin Pre-Creates Member
   └─ Admin POST /members
   └─ Creates with CNIC + Email only (NO password)
   └─ isActive: true, isDeleted: false

2. User Installs App
   └─ Sees signup screen

3. User Enters Credentials
   └─ CNIC: 12345-6789012-3
   └─ Email: user@example.com
   └─ Password: YourPass123!

4. App Calls POST /auth/signup
   ├─ Backend validates: CNIC + Email match existing member
   ├─ Backend validates: password NOT already set
   ├─ Backend hashes password with bcrypt
   ├─ Backend updates member with password
   ├─ Backend generates tokens
   └─ Returns tokens + member data

5. App Stores Tokens
   ├─ accessToken → Memory/Secure Storage
   ├─ refreshToken → Secure Storage (HttpOnly if possible)
   └─ member → Redux/Context/Local State

6. User Makes Authenticated Request
   ├─ App includes: Authorization: Bearer {accessToken}
   ├─ Backend validates token
   ├─ Backend processes request
   └─ Returns response

7. Token Expires
   ├─ App detects 401 Unauthorized
   ├─ App calls POST /auth/refresh-token with refreshToken
   ├─ Backend validates refresh token
   ├─ Backend returns new accessToken
   ├─ App updates tokens
   └─ Retries original request
```

---

## Common Error Scenarios

### Signup Errors

#### 1. CNIC Not Found

**Request:**

```json
{
  "memNic": "99999-9999999-9",
  "memContEmail": "user@example.com",
  "password": "Pass123!"
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Member not found or not eligible for signup. Please verify CNIC and email.",
  "statusCode": 400
}
```

**What to tell user:** "CNIC not found in our records. Please contact administration."

---

#### 2. Email Doesn't Match CNIC

**Request:**

```json
{
  "memNic": "12345-6789012-3",
  "memContEmail": "wrong@example.com",
  "password": "Pass123!"
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Member not found or not eligible for signup. Please verify CNIC and email.",
  "statusCode": 400
}
```

**What to tell user:** "CNIC and email don't match. Please verify both are correct."

---

#### 3. Already Has Password (Already Signed Up)

**Request:**

```json
{
  "memNic": "12345-6789012-3",
  "memContEmail": "user@example.com",
  "password": "NewPass123!"
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "This account already has a password set. Use login or forgot password.",
  "statusCode": 400
}
```

**What to tell user:** "This account is already active. Please login or use 'Forgot Password'."

---

#### 4. Weak Password

**Request:**

```json
{
  "memNic": "12345-6789012-3",
  "memContEmail": "user@example.com",
  "password": "weak"
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Password must be at least 8 characters",
  "statusCode": 400
}
```

**Then on retry with longer but weak password:**

```json
{
  "success": false,
  "error": "Password must contain uppercase, lowercase, number, and special character",
  "statusCode": 400
}
```

**What to tell user:** "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (e.g., YourPass123!)"

---

### Login Errors

#### 1. Invalid Email or Password

**Response (401):**

```json
{
  "success": false,
  "error": "Invalid email or password",
  "statusCode": 401
}
```

**What to tell user:** "Invalid email or password"

---

#### 2. Account Locked (5 Failed Attempts)

**Response (423):**

```json
{
  "success": false,
  "error": "Account is temporarily locked. Try again in 15 minutes.",
  "statusCode": 423
}
```

**What to tell user:** "Too many login attempts. Please try again in 15 minutes."

---

## Password Requirements Checklist

For app UI, show real-time validation:

```
Password must have:
☑ Minimum 8 characters
☑ At least 1 UPPERCASE letter (A-Z)
☑ At least 1 lowercase letter (a-z)
☑ At least 1 number (0-9)
☑ At least 1 special character (@$!%*?&)
```

**Valid Examples:**

- ✅ YourPass123!
- ✅ SecurePass@2024
- ✅ MyP@ssw0rd
- ✅ Test#Pass123

**Invalid Examples:**

- ❌ password (no uppercase, number, special char)
- ❌ Password (no number, special char)
- ❌ Pass123 (no special char, < 8 chars)
- ❌ Pass@123 (only 8 chars, but valid - see Valid Examples above)

---

## Token Management

### Access Token

- Validity: 1 hour (3600 seconds)
- Usage: Include in all authenticated requests
- Header: `Authorization: Bearer {accessToken}`
- Storage: Can be in memory (secure)
- Expiration: Returns 401 when expired

### Refresh Token

- Validity: 7 days (typically)
- Usage: Request new access token when expired
- Storage: Secure storage (HttpOnly cookie if possible, or encrypted storage)
- Endpoint: `POST /auth/refresh-token`

### Refresh Flow

```typescript
// When you get 401 Unauthorized
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response (200)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Token refreshed successfully"
}
```

---

## Implementation Recommendations

### 1. Store Tokens Securely

```typescript
// React Native Example
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
};
```

### 2. Use Axios/Fetch Interceptor

```typescript
// Add authorization header to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await axios.post('/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', response.data.data.accessToken);
        // Retry original request
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### 3. Show Loading During Signup

```typescript
const [loading, setLoading] = useState(false);

const handleSignup = async formData => {
  setLoading(true);
  try {
    const response = await axios.post('/auth/signup', formData);
    // Store tokens
    // Navigate to home
  } catch (error) {
    // Show error toast
  } finally {
    setLoading(false);
  }
};
```

### 4. Validate Form Before Submission

```typescript
const validateSignupForm = data => {
  const errors = {};

  if (!data.memNic || data.memNic.length < 13) {
    errors.memNic = 'Valid CNIC required (13-15 digits)';
  }

  if (!data.memContEmail || !isValidEmail(data.memContEmail)) {
    errors.memContEmail = 'Valid email required';
  }

  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'Password must contain uppercase letter';
  }

  if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'Password must contain lowercase letter';
  }

  if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain number';
  }

  if (!/(?=.*[@$!%*?&])/.test(data.password)) {
    errors.password = 'Password must contain special character';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
```

---

## Important Notes

1. **CNIC is NOT case-sensitive** - "12345-6789012-3" and "12345-6789012-3" are the same
2. **Email IS case-insensitive** - "User@Example.com" and "user@example.com" are the same
3. **Password IS case-sensitive** - "Pass123!" is different from "pass123!"
4. **Cannot change CNIC or Email after signup** - Only password and profile fields can be updated
5. **Admin must create member first** - Signup is only for pre-registered members
6. **Email verification is separate** - Signup doesn't require email verification, but profile update does
7. **Account lockout is time-based** - 15 minutes = automatic unlock
8. **Tokens expire** - Access token expires in 1 hour, use refresh token to get new access token

---

## Troubleshooting

### Issue: "Member not found or not eligible for signup"

**Causes:**

1. CNIC doesn't exist (admin hasn't created member)
2. Email doesn't exist (admin hasn't created member)
3. CNIC and Email don't match same member
4. Member is deleted (isDeleted: true)
5. Member is inactive (isActive: false)

**Solution:** Contact admin to verify member creation

---

### Issue: "This account already has a password set"

**Cause:** Member already signed up

**Solution:** Use login or "Forgot Password"

---

### Issue: "Invalid email or password"

**Causes:**

1. Wrong email address
2. Wrong password
3. Case sensitivity (password is case-sensitive)

**Solution:** Verify credentials and try again

---

### Issue: "Account is temporarily locked"

**Cause:** 5 failed login attempts

**Solution:** Wait 15 minutes before trying again

---

## Support Contact

For API issues or questions:

- Contact: backend-team@hsms.com
- Documentation: https://api.hsms.com/docs
- Status: https://status.hsms.com
