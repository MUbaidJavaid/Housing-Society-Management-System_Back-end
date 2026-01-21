# Before & After - Code Changes Reference

## Summary of All Changes

| File                        | Change                              | Reason                                               |
| --------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `auth-member.validator.ts`  | Signup validation strengthened      | Enforce CNIC + Email both required, strong passwords |
| `auth-member.service.ts`    | Signup method complete rewrite      | Proper pre-registration verification logic           |
| `auth-member.service.ts`    | Login method fixed                  | Changed from User model to Member model              |
| `auth-member.service.ts`    | Forgot password method fixed        | Proper Member model usage, 1-hour token expiry       |
| `auth-member.controller.ts` | Signup response format improved     | Mobile-friendly JSON structure                       |
| `auth-member.controller.ts` | Login response format improved      | Consistent token response format                     |
| `auth-member.controller.ts` | Forgot password response simplified | Cleaner mobile response                              |
| `types-auth-member.ts`      | SignupCredentials updated           | CNIC and Email now required                          |
| `types-auth-member.ts`      | LoginCredentials simplified         | Only email and password required                     |
| `models-member.ts`          | Compound index added                | Performance optimization for signup query            |

---

## File-by-File Changes

---

## 1. auth-member.validator.ts

### BEFORE

```typescript
export const validateSignup = (): ValidationChain[] => [
  body('memNic')
    .optional() // ❌ WRONG: Should be required
    .trim()
    .isLength({ min: 13, max: 15 })
    .withMessage('CNIC must be 13-15 characters'),

  body('memContEmail')
    .optional() // ❌ WRONG: Should be required
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 }) // ❌ Too weak
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .optional() // ❌ Should be required
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('memName') // ❌ Not needed for signup
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),

  body('memContMob') // ❌ Not needed for signup
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Invalid mobile number'),
];
```

### AFTER

```typescript
export const validateSignup = (): ValidationChain[] => [
  body('memNic')
    .trim()
    .notEmpty() // ✅ REQUIRED
    .withMessage('CNIC is required')
    .isLength({ min: 13, max: 15 })
    .withMessage('CNIC must be 13-15 characters')
    .matches(/^[0-9]+$/) // ✅ Only numeric
    .withMessage('CNIC must contain only numeric characters')
    .customSanitizer(value => value.toUpperCase()), // ✅ Normalize to uppercase

  body('memContEmail')
    .trim()
    .notEmpty() // ✅ REQUIRED
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(), // ✅ Normalize

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 }) // ✅ Stronger (was 6)
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/) // ✅ Strong regex
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('confirmPassword')
    .trim()
    .notEmpty() // ✅ REQUIRED (was optional)
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];
```

**Key Improvements:**

- ✅ CNIC and Email now REQUIRED (not optional)
- ✅ CNIC validated as numeric only
- ✅ Password minimum increased from 6 to 8 characters
- ✅ Strong password regex enforced
- ✅ confirmPassword now required
- ✅ Removed unnecessary memName and memContMob fields

---

## 2. auth-member.service.ts - Signup Method

### BEFORE

```typescript
async signup(data: SignupCredentials): Promise<AuthResponse> {
  const { memNic, memContEmail, password, memName, memContMob } = data;

  // ❌ WRONG: OR logic instead of AND
  if (!memNic && !memContEmail) {
    throw new Error('CNIC or Email is required');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  let existingMember = null;

  // ❌ WRONG: Checks ONLY by CNIC
  if (memNic) {
    existingMember = await Member.findOne({
      memNic: memNic.toUpperCase(),
      isDeleted: false,
    });

    if (existingMember) {
      // ❌ WRONG: Delegates to another method
      if (!existingMember.password) {
        return await this.activateExistingMember(existingMember, password, memName, memContMob);
      }
      throw new Error('Member with this CNIC already has an account');
    }
  }

  // ❌ WRONG: Separate check for Email (not combined with CNIC check)
  if (memContEmail) {
    existingMember = await Member.findOne({
      memContEmail: memContEmail.toLowerCase(),
      isDeleted: false,
    });

    if (existingMember) {
      throw new Error('Member with this email already has an account');
    }
  }

  // ❌ WRONG: Throws error if not found (instead of supporting pre-registration)
  throw new Error(
    'Member not found in our records. Please contact administration for registration.'
  );
}
```

### AFTER

```typescript
/**
 * Member signup - Pre-registered members only
 *
 * Business Logic:
 * 1. CNIC and Email must BOTH be provided and match an existing record
 * 2. Member must exist in DB (created by admin)
 * 3. Member must NOT have a password set yet
 * 4. isActive must be true, isDeleted must be false
 * 5. Both CNIC and Email must match (case-insensitive)
 */
async signup(data: SignupCredentials): Promise<AuthResponse> {
  const { memNic, memContEmail, password } = data;

  // ✅ Validate required fields
  if (!memNic || !memNic.trim()) {
    throw new Error('CNIC is required');
  }

  if (!memContEmail || !memContEmail.trim()) {
    throw new Error('Email is required');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // ✅ Normalize input for consistent matching
  const normalizedNic = memNic.trim().toUpperCase();
  const normalizedEmail = memContEmail.trim().toLowerCase();

  // ✅ SINGLE query with BOTH conditions (must match BOTH)
  const member = await Member.findOne({
    memNic: normalizedNic,
    memContEmail: normalizedEmail,
    isDeleted: false,
    isActive: true,
  }).select('+password');

  // ✅ No member found - clear error message
  if (!member) {
    throw new Error('Member not found or not eligible for signup. Please verify CNIC and email.');
  }

  // ✅ Member already has a password - prevent duplicate signup
  if (member.password) {
    throw new Error('This account already has a password set. Use login or forgot password.');
  }

  // ✅ Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // ✅ Update member: set password and mark as activated
  member.password = hashedPassword;
  member.emailVerified = false; // Email needs verification after signup
  member.lastLogin = new Date();
  member.updatedAt = new Date();

  await member.save();

  // ✅ Generate tokens
  const tokens = await jwtService.generateTokenPair(
    member._id,
    member.memContEmail,
    UserRole.MEMBER
  );

  return {
    member: this.formatMemberResponse(member),
    tokens,
  };
}
```

**Key Improvements:**

- ✅ Both CNIC and Email required and must match same member
- ✅ Single combined query (no separate checks)
- ✅ Includes isActive and isDeleted checks
- ✅ Prevents duplicate signup (checks if password already set)
- ✅ Proper case normalization
- ✅ Inline implementation (no delegation to other methods)
- ✅ Clear error messages
- ✅ Sets lastLogin and updatedAt fields

---

## 3. auth-member.service.ts - Login Method

### BEFORE

```typescript
async login(loginCredentials: LoginCredentials): Promise<{ user: any; tokens: TokenPair }> {
  // ❌ WRONG: Uses User model instead of Member
  const existingUser = await User.findByEmail(loginCredentials.email);
  if (existingUser) {
    throw new AppError(409, 'User already exists');
  }

  // ❌ WRONG: Creates new user (signup logic in login!)
  const user = await User.create({
    email: loginCredentials.email.toLowerCase(),
    password: loginCredentials.password,
    firstName: loginCredentials.firstName,
    lastName: loginCredentials.lastName,
    role: UserRole.USER,
    status: 'active' as UserStatus,
    emailVerified: true,
  });

  const tokens = await jwtService.generateTokenPair(
    user._id as Types.ObjectId,
    user.email,
    user.role
  );

  return {
    user: user.getPublicProfile(),  // ❌ Wrong response structure
    tokens,
  };
}
```

### AFTER

```typescript
/**
 * Member login with Email + Password
 * - Email is case-insensitive (normalized to lowercase)
 * - Password must match hashed version
 * - Account locks after 5 failed attempts (15 min lockout)
 * - Returns tokens on success
 */
async login(loginCredentials: LoginCredentials): Promise<{ member: any; tokens: TokenPair }> {
  const { email, password } = loginCredentials;

  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }

  if (!password || password.length < 8) {
    throw new Error('Password is required');
  }

  // ✅ Normalize email to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // ✅ Find member by email (not creating new)
  const member = await Member.findOne({
    memContEmail: normalizedEmail,
    isDeleted: false,
    isActive: true,
  }).select('+password +lockUntil +loginAttempts');

  if (!member) {
    throw new Error('Invalid email or password');  // ✅ Generic message for security
  }

  // ✅ Check if account is locked
  if (member.lockUntil && member.lockUntil > new Date()) {
    const remainingTime = Math.ceil((member.lockUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account is temporarily locked. Try again in ${remainingTime} minutes.`);
  }

  // ✅ Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, member.password || '');
  if (!isPasswordValid) {
    // ✅ Track failed attempts
    member.loginAttempts = (member.loginAttempts || 0) + 1;

    // ✅ Lock account after 5 failed attempts
    if (member.loginAttempts >= 5) {
      member.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await member.save();
      throw new Error('Too many failed login attempts. Account locked for 15 minutes.');
    }

    await member.save();
    throw new Error('Invalid email or password');
  }

  // ✅ Reset login attempts on successful login
  member.loginAttempts = 0;
  member.lockUntil = undefined;
  member.lastLogin = new Date();
  member.updatedAt = new Date();
  await member.save();

  // ✅ Generate tokens
  const tokens = await jwtService.generateTokenPair(
    member._id,
    member.memContEmail,
    UserRole.MEMBER
  );

  return {
    member: this.formatMemberResponse(member),  // ✅ Correct response structure
    tokens,
  };
}
```

**Key Improvements:**

- ✅ Uses Member model (not User)
- ✅ Finds existing member (doesn't create new)
- ✅ Case-insensitive email matching
- ✅ Login attempt tracking
- ✅ Account lockout (5 attempts, 15 minutes)
- ✅ Secure password comparison with bcrypt
- ✅ Generic error messages (security)
- ✅ Proper response structure with member data

---

## 4. auth-member.controller.ts - Signup Handler

### BEFORE

```typescript
signup: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials: SignupCredentials = req.body;

    // ❌ No validation
    const result = await authMemberService.signup(credentials);

    res.status(201).json({
      success: true,
      data: result,  // ❌ Not mobile-friendly structure
      message: 'Account activated successfully',
    });
  } catch (error) {
    handleError(error, next);
  }
},
```

### AFTER

```typescript
signup: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials: SignupCredentials = req.body;

    // ✅ Additional validation
    if (!credentials.memNic || !credentials.memContEmail || !credentials.password) {
      throw new AppError(400, 'CNIC, Email, and Password are required');
    }

    const result = await authMemberService.signup(credentials);

    // ✅ Mobile-friendly response structure
    res.status(201).json({
      success: true,
      data: {
        member: result.member,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
        },
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    handleError(error, next);
  }
},
```

**Key Improvements:**

- ✅ Additional controller-level validation
- ✅ Clean token response structure
- ✅ Better success message
- ✅ Proper HTTP 201 status code

---

## 5. auth-member.controller.ts - Login Handler

### BEFORE

```typescript
login: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials: LoginCredentials = req.body;
    const { email, password } = credentials;
    const result = await authMemberService.login({ email, password });

    res.json({
      success: true,
      data: result,  // ❌ Inconsistent structure
      message: 'Login successful',
    });
  } catch (error) {
    handleError(error, next);
  }
},
```

### AFTER

```typescript
login: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials: LoginCredentials = req.body;

    // ✅ Validation
    if (!credentials.email || !credentials.password) {
      throw new AppError(400, 'Email and password are required');
    }

    const result = await authMemberService.login(credentials);

    // ✅ Consistent mobile-friendly response
    res.json({
      success: true,
      data: {
        member: result.member,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    handleError(error, next);
  }
},
```

**Key Improvements:**

- ✅ Consistent response structure with signup
- ✅ Proper validation
- ✅ Clean token response

---

## 6. types-auth-member.ts - Type Updates

### BEFORE

```typescript
export interface LoginCredentials {
  email: string; // CNIC or Email
  firstName: string; // ❌ Not used in login
  lastName: string; // ❌ Not used in login
  password: string;
}

export interface SignupCredentials {
  memNic: string;
  memContEmail?: string; // ❌ Optional (should be required)
  password: string;
  memName?: string; // ❌ Not used in signup
  memContMob?: string; // ❌ Not used in signup
  confirmPassword?: string; // ❌ Optional (should be required)
}
```

### AFTER

```typescript
export interface LoginCredentials {
  email: string; // Email identifier (case-insensitive)
  password: string;
}

export interface SignupCredentials {
  memNic: string; // REQUIRED for pre-registration verification
  memContEmail: string; // REQUIRED for pre-registration verification
  password: string;
  confirmPassword?: string;
}
```

**Key Improvements:**

- ✅ LoginCredentials simplified (only needed fields)
- ✅ SignupCredentials: CNIC and Email required
- ✅ Removed unused fields (firstName, lastName, memName, memContMob)
- ✅ Better TypeScript type safety

---

## 7. models-member.ts - Database Index

### BEFORE

```typescript
// ❌ No index for CNIC + Email combination
// Each signup query needs to scan entire collection
```

### AFTER

```typescript
// Compound index for efficient signup verification (CNIC + Email)
// This speeds up the query: {memNic: X, memContEmail: Y, isDeleted: false, isActive: true}
memberSchema.index(
  { memNic: 1, memContEmail: 1, isDeleted: 1, isActive: 1 },
  { name: 'idx_signup_verification' }
);
```

**Performance Impact:**

- ❌ Before: O(n) full collection scan
- ✅ After: O(log n) indexed lookup
- ✅ Critical for thousands of users

---

## Summary of Security Improvements

| Aspect                   | Before                         | After                                        |
| ------------------------ | ------------------------------ | -------------------------------------------- |
| **Signup Validation**    | Optional fields, weak password | Required fields, 8+ char strong password     |
| **CNIC+Email Matching**  | Separate checks OR'd together  | Combined AND query                           |
| **Duplicate Prevention** | Only checked one field         | Checks if password already set               |
| **Login**                | Created new users (!!)         | Proper member login with bcrypt              |
| **Account Lockout**      | None                           | 5 attempts, 15 min lockout                   |
| **Error Messages**       | Specific (information leak)    | Generic (secure)                             |
| **Case Handling**        | Inconsistent                   | Normalized (CNIC uppercase, Email lowercase) |
| **Database Queries**     | No indexing                    | Compound index for fast lookups              |
| **Response Format**      | Inconsistent                   | Mobile-friendly standard structure           |
