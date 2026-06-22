# HSMS V2.0 — Complete Data Model & Relationship Map

## Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLATFORM LEVEL (No societyId)                   │
│                                                                     │
│  Super Admin ─── manages ──→ SubscriptionPackage                   │
│       │                            │                                │
│       │ creates                    │ assigned to                    │
│       ▼                            ▼                                │
│  ┌─────────┐              ┌──────────────┐                         │
│  │  User   │──────────────│   Society    │  (Root Tenant Entity)   │
│  │(SA role)│   creates    │  (Tenant)    │                         │
│  └─────────┘              └──────┬───────┘                         │
│                                  │                                  │
│  Global Lookups (shared):        │ Each society gets its own:      │
│  ├── City / State                │                                  │
│  ├── Status                      │                                  │
│  ├── SrModule                    │                                  │
│  ├── LookupValue                 │                                  │
│  └── DomesticStaff (cross-soc)   │                                  │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────┐
│              TENANT LEVEL (All have societyId)                      │
│                                  │                                  │
│  ┌───────────────────────────────┼────────────────────────────┐    │
│  │                    CORE ENTITIES                            │    │
│  │                               │                            │    │
│  │  Society ──┬── User (admin, moderator, accountant)         │    │
│  │            ├── UserStaff (operational staff)               │    │
│  │            ├── Role (custom roles per society)              │    │
│  │            ├── UserPermission (role → module permissions)   │    │
│  │            ├── Member (residents/owners)                    │    │
│  │            ├── Project (phases/sectors)                     │    │
│  │            │     └── PlotBlock (blocks within project)     │    │
│  │            └── SubscriptionHistory                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                 PROPERTY LIFECYCLE                          │    │
│  │                                                            │    │
│  │  Project ──→ PlotBlock ──→ Plot ──→ Possession ──→ Registry│    │
│  │                             │                              │    │
│  │                             ├── PlotSize (per society)     │    │
│  │                             ├── PlotType (per society)     │    │
│  │                             ├── PlotCategory (per society) │    │
│  │                             ├── SalesStatus (per society)  │    │
│  │                             ├── SrDevStatus (per society)  │    │
│  │                             └── File (documents)           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                 FINANCIAL MODULE                            │    │
│  │                                                            │    │
│  │  InstallmentPlan ──→ InstallmentPlanDetail                 │    │
│  │       │                    │                               │    │
│  │       └──→ InstallmentCategory                             │    │
│  │                                                            │    │
│  │  Member ──→ Installment (with plot, category)              │    │
│  │       │──→ BillInfo (with BillType)                        │    │
│  │       │──→ Defaulter                                       │    │
│  │       └──→ PaymentTransaction (via PaymentMode)            │    │
│  │                                                            │    │
│  │  PaymentMode (per society)                                 │    │
│  │  BillType (per society)                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              MEMBER LIFECYCLE & TRANSFERS                   │    │
│  │                                                            │    │
│  │  Member ──→ Plot (ownership)                               │    │
│  │    │  ├──→ Nominee (beneficiaries)                         │    │
│  │    │  ├──→ Application (with SrApplicationType)            │    │
│  │    │  └──→ File (documents)                                │    │
│  │    │                                                       │    │
│  │    └──→ SrTransfer (seller/buyer with SrTransferType)      │    │
│  │              └──→ Development (plot development tracking)  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │            OPERATIONS & COMMUNICATION                       │    │
│  │                                                            │    │
│  │  Complaint (with SrComplaintCategory)                      │    │
│  │  Announcement (with AnnouncementCategory)                  │    │
│  │  Notification                                              │    │
│  │  Facility ──→ FacilityBooking                              │    │
│  │  Visitor                                                   │    │
│  │  MaintenanceRequest                                        │    │
│  │  GatePass                                                  │    │
│  │  Meeting (with attendance)                                 │    │
│  │  Poll (with votes)                                         │    │
│  │  ForumThread ──→ ForumReply                                │    │
│  │  EmergencyAlert / MedicalProfile                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │           VENDOR & WORKFORCE                                │    │
│  │                                                            │    │
│  │  VendorProfile ──→ WorkOrder ──→ VendorContract            │    │
│  │                          └──→ VendorInvoice                │    │
│  │  Attendance (with Geofence)                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │           ADVANCED FEATURES                                 │    │
│  │                                                            │    │
│  │  CustomForm                                                │    │
│  │  Workflow ──→ WorkflowInstance                              │    │
│  │  AIConversation / AIInsight                                │    │
│  │  PrivacySettings / PrivacyAccessLog                        │    │
│  │  PLRACertificate / PLRASyncLog                             │    │
│  │  GamificationPoints / GamificationReward / Redemption      │    │
│  │  ParkingSpot ──→ ParkingPass                               │    │
│  │  Listing (marketplace)                                     │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘


## Entity Relationship Summary

### Society (Root Tenant)
Society is the root of all tenant-scoped data. Every document belongs
to exactly one society via `societyId`.

### User ←→ Society (Many-to-One)
- Each User belongs to one Society (via `societyId`)
- Super Admins have `societyId: null` (platform-level)
- JWT contains `societyId` for automatic tenant scoping

### Member ←→ Society (Many-to-One)  
- Members are residents/owners within a society
- Members link to Plots (ownership), Nominees, Applications

### Plot Hierarchy
Society → Project → PlotBlock → Plot
- Plot references PlotSize, PlotType, PlotCategory, SalesStatus
- Plot goes through lifecycle: Available → Booked → Sold → Possessed → Registered

### Financial Chain
Member → InstallmentPlan → InstallmentPlanDetail → Installment
Member → BillInfo → BillType
Member → Defaulter (when overdue)
All payments tracked via PaymentTransaction

### Permission Chain
Society → Role → UserPermission → SrModule
- System roles (isSystem: true) are global templates
- Custom roles (societyId set) are per-society
- UserPermission maps role + module → CRUD actions


## Model Classification

### GLOBAL (No societyId — shared across all tenants)
| Model | Reason |
|-------|--------|
| City | Geographic data shared globally |
| State | Geographic data shared globally |
| Status | System statuses shared globally |
| SrModule | Module registry (platform-level) |
| LookupValue | Can be global or per-society (uses metadata) |
| SubscriptionPackage | Platform billing plans |
| DomesticStaff | Cross-society staff verification network |
| AuditLog | Platform-wide audit trail |
| Token | Auth tokens (session-level) |
| User (database/models) | Has societyId but nullable for Super Admin |

### TENANT-SCOPED (Required societyId)
All other 70+ models require `societyId` and are isolated per society.
Queries automatically filter by `societyId` from the JWT.


## Data Isolation Rules

1. **Every API query** adds `societyId` filter from JWT context
2. **Super Admin** can override with `X-Society-Id` header
3. **Mongoose middleware** auto-injects `societyId` on find operations
4. **Cross-tenant queries** are ONLY allowed for Super Admin
5. **Soft deletes** (`isDeleted: true`) are excluded by default
6. **Feature gating** checks society's subscription plan before allowing module access
7. **Resource limits** enforce max counts from subscription plan
