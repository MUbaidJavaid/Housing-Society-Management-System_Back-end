# Deployment Checklist - Pre-Registration Signup

## Pre-Deployment Verification

### 1. Code Changes Verification

- ✅ [auth-member.validator.ts](src/Member/validator/auth-member.validator.ts) - Signup validation updated
- ✅ [auth-member.service.ts](src/Member/services/auth-member.service.ts) - Signup, login, and forgotPassword methods refactored
- ✅ [auth-member.controller.ts](src/Member/controllers/auth-member.controller.ts) - Response formats standardized
- ✅ [types-auth-member.ts](src/Member/types/types-auth-member.ts) - Type definitions updated
- ✅ [models-member.ts](src/Member/models/models-member.ts) - Compound index added

### 2. No Breaking Changes

- ✅ Admin routes (`createMember`) unchanged
- ✅ Protected routes (profile, change password) unchanged
- ✅ Authentication middleware unchanged
- ✅ Email verification flow unchanged
- ✅ Forgot password flow unchanged (improved security)
- ✅ Refresh token endpoint unchanged

### 3. Database Migrations

- ✅ Compound index `idx_signup_verification` created on (memNic, memContEmail, isDeleted, isActive)
- ✅ No schema changes needed (all fields already exist)
- ✅ Can deploy without data migration

**Migration Command:**

```bash
# The index will be created automatically when server starts (MongoDB auto-indexing)
# Or manually run:
db.members.createIndex(
  { memNic: 1, memContEmail: 1, isDeleted: 1, isActive: 1 },
  { name: "idx_signup_verification" }
)
```

### 4. Environment Variables

- ✅ No new environment variables required
- ✅ Verify `FRONTEND_URL` is set for password reset emails (existing)
- ✅ Verify email service is configured (existing)

### 5. Dependency Check

- ✅ `bcryptjs` - already in use, no new version required
- ✅ `jsonwebtoken` - already in use, no new version required
- ✅ `express-validator` - already in use, no new version required

**Verified by:** **\*\***\_\_\_\_**\*\*\*\***Time:** \*\*\*\***\_\_\_\_**\*\*** **Date:** **\*\***\_\_\_\_**\*\*** **Deployed by:** **\*\***\_\_\_\_**\*\*** - [ ] Rollback plan confirmed- [ ] Team briefed on changes- [ ] Deployment plan reviewed- [ ] Database backup completed- [ ] Tests passed- [ ] Code review completed## Sign-Off---- On-call engineer: [escalation contact]- DevOps: devops@hsms.com- Backend team: backend-team@hsms.comFor deployment issues:## Support & Contact---- ✅ [BEFORE_AND_AFTER.md](BEFORE_AND_AFTER.md) - Code comparison reference- ✅ [MOBILE_APP_INTEGRATION_GUIDE.md](MOBILE_APP_INTEGRATION_GUIDE.md) - Mobile developer guide- ✅ [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete technical documentation## Documentation Updates---10. Password reset flow works9. Account lockout engages after 5 failed attempts8. Token refresh works correctly7. Mobile app can signup and login6. Email notifications are sent5. Admin member creation still works4. Performance metrics are within expected ranges3. No errors in logs2. Database index is created and used1. All signup/login endpoints respond correctly✅ Deployment is successful when:## Success Criteria---- Expected: No degradation with proper indexing- Monitor CPU, memory, database connections- Test with 100+ concurrent signup requests### Concurrent Signups`// Bcrypt takes ~100ms, query should be < 10ms// Should be < 500ms (including password hashing)`javascript### Login Performance`// executionTimeMillis should be < 10ms (with index)db.members.find({memNic: "X", memContEmail: "Y", isDeleted: false, isActive: true}).explain("executionStats")// Should be < 500ms`javascript### Signup PerformanceAfter deployment, track these metrics:## Performance Benchmarks---`// But NOT recommended for production// To relax: Remove one requirement from the regex// Requires: uppercase, lowercase, digit, special char// Current: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/`typescript**Check validation regex:**If users report password rejection:### Issue 4: Password validation too strict---`)  {$set: {loginAttempts: 0, lockUntil: null}}  {memContEmail: "test@example.com"},db.members.updateOne(`bash- Manually reset for testing:**Fix:**`db.members.findOne({memContEmail: "test@example.com"}, {lockUntil: 1, loginAttempts: 1})// Check lockUntil field`javascript**Diagnosis:**### Issue 3: Account lockout is permanent---`db.members.createIndex({memNic: 1, memContEmail: 1, isDeleted: 1, isActive: 1}, {name: "idx_signup_verification"})db.members.dropIndex("idx_signup_verification")`bash- Rebuild index if needed:- Verify index was created: `idx_signup_verification`**Fix:**`db.members.find({memNic: "X", memContEmail: "Y", isDeleted: false, isActive: true}).explain("executionStats")// Check query executiondb.members.getIndexes()// Check if index exists`javascript**Diagnosis:**### Issue 2: Slow signup queries---- Verify CNIC is stored in uppercase- Check email is stored in lowercase (memContEmail)- Ensure member has `isActive: true` and `isDeleted: false`**Fix:**`db.members.findOne({memNic: "12345-6789012-3"}, {isActive: 1, isDeleted: 1})// Check if isActive and isDeleted are correctdb.members.findOne({memNic: "12345-6789012-3", memContEmail: "test@example.com"})// Check if member exists`javascript**Diagnosis:**### Issue 1: "Member not found" error for valid CNIC+Email## Common Issues & Fixes---- Check email delivery rates- Verify password reset emails are sent- Verify welcome/signup emails are sent### 5. Email Notifications- Test token refresh- Test login flow on both platforms- Test signup flow on Android- Test signup flow on iOS### 4. Mobile App Testing- Verify new members can sign up after creation- Verify admin can still create members without password### 3. Member Creation by Admin`# - executionStats.totalDocsExamined ≈ nReturned → GOOD (efficient)# - executionStages.stage: "IXSCAN" → GOOD (index used)# - executionStages.stage: "COLLSCAN" → BAD (index not used)# Should show:db.members.find({memNic: "X", memContEmail: "Y"}).explain("executionStats")# Check query performance`bash### 2. Performance Monitoring- Watch for lockout events- Monitor login attempt patterns- Check error logs for signup failures### 1. Monitor Error Rates## Post-Deployment Checks---`db.members.dropIndex("idx_signup_verification")# Drop the index if needed`bash### Database Rollback (if index causes issues)`mongorestore --uri "mongodb://user:pass@host:port/hsms_db" ./backup/# 4. Restore from database backup if neededsudo systemctl start hsms-backend# 3. Start servernpm run buildgit revert HEAD# 2. Revert to previous codesudo systemctl stop hsms-backend# 1. Stop the server`bash### Quick RollbackIf issues occur during deployment:## Rollback Plan---`grep -i "login" logs/app.log# Monitor login attemptsgrep -i "signup\|sign up" logs/app.log# Monitor signup attemptstail -f logs/app.log# Check server logs for errors`bash### Step 5: Monitor Logs`# }#   "name": "idx_signup_verification"#   "key": { "memNic": 1, "memContEmail": 1, "isDeleted": 1, "isActive": 1 },# {# Should contain:db.members.getIndexes()`bash#### 4.6 Verify Database Index`# }#   "statusCode": 423#   "error": "Account is temporarily locked. Try again in 15 minutes.",#   "success": false,# {# Expected Response (423):  }'    "password": "SecurePass123!"    "email": "test@example.com",  -d '{  -H "Content-Type: application/json" \curl -X POST http://localhost:3000/auth/login \# 6th attempt should return 423done    }'      "password": "WrongPassword"      "email": "test@example.com",    -d '{    -H "Content-Type: application/json" \  curl -X POST http://localhost:3000/auth/login \for i in {1..5}; do# Make 5 failed login attempts`bash#### 4.5 Login Test (Account Lockout)`# }#   "message": "Login successful"#   },#     "tokens": {...}#     "member": {...},#   "data": {#   "success": true,# {# Expected Response (200):  }'    "password": "SecurePass123!"    "email": "test@example.com",  -d '{  -H "Content-Type: application/json" \curl -X POST http://localhost:3000/auth/login \`bash#### 4.4 Login Test`# }#   "statusCode": 400#   "error": "Member not found or not eligible for signup. Please verify CNIC and email.",#   "success": false,# {# Expected Response (400):  }'    "confirmPassword": "SecurePass123!"    "password": "SecurePass123!",    "memContEmail": "test@example.com",    "memNic": "99999-9999999-9",  -d '{  -H "Content-Type: application/json" \curl -X POST http://localhost:3000/auth/signup \`bash#### 4.3 Signup Test (Failure - CNIC Not Found)`# }#   "message": "Account created successfully"#   },#     }#       "expiresIn": 3600#       "refreshToken": "...",#       "accessToken": "...",#     "tokens": {#     "member": {...},#   "data": {#   "success": true,# {# Expected Response (201):  }'    "confirmPassword": "SecurePass123!"    "password": "SecurePass123!",    "memContEmail": "test@example.com",    "memNic": "12345-6789012-3",  -d '{  -H "Content-Type: application/json" \curl -X POST http://localhost:3000/auth/signup \# 1. Admin has created member with CNIC "12345-6789012-3" and email "test@example.com"# Prerequisites:`bash#### 4.2 Signup Test (Success Case)`# Expected: 200 OKcurl http://localhost:3000/health`bash#### 4.1 Health Check### Step 4: Verify Deployment`pnpm start# ornpm run start# 4. Start servernpm run build# 3. Buildpnpm install# ornpm install# 2. Install dependencies (if any changes)git pull origin main# 1. Pull latest code`bash### Step 3: Deploy Code`mongodump --uri "mongodb://user:pass@host:port/hsms_db"# Backup production database before deployment`bash### Step 2: Backup Database`npx tsc --noEmit# 3. Check TypeScript compilationpnpm test# ornpm run test# 2. Run testspnpm build# ornpm run build# 1. Build the project`bash### Step 1: Pre-Deployment Testing## Deployment Steps---- ✅ No new dependencies added
