import mongoose from 'mongoose';
import { Role } from '../users/models/Role.model';
import SrModule from '../Module/models/models-srmodule';
import UserPermission from '../UserPermissions/models/models-userpermission';

// ---------------------------------------------------------------------------
// Default Modules
// ---------------------------------------------------------------------------
const DEFAULT_MODULES = [
  { moduleName: 'Members', moduleCode: 'MEM', displayOrder: 1 },
  { moduleName: 'Plot Inventory', moduleCode: 'INV', displayOrder: 2 },
  { moduleName: 'Accounts & Billing', moduleCode: 'ACC', displayOrder: 3 },
  { moduleName: 'Transfers', moduleCode: 'TRF', displayOrder: 4 },
  { moduleName: 'Possession', moduleCode: 'POS', displayOrder: 5 },
  { moduleName: 'Reports', moduleCode: 'REP', displayOrder: 6 },
  { moduleName: 'Complaints', moduleCode: 'COMP', displayOrder: 7 },
  { moduleName: 'Administration', moduleCode: 'ADM', displayOrder: 8 },
  { moduleName: 'Settings', moduleCode: 'SET', displayOrder: 9 },
  { moduleName: 'Dashboard', moduleCode: 'DASH', displayOrder: 10 },
  { moduleName: 'Visitors', moduleCode: 'VIS', displayOrder: 11 },
  { moduleName: 'Facilities', moduleCode: 'FAC', displayOrder: 12 },
  { moduleName: 'Announcements', moduleCode: 'ANN', displayOrder: 13 },
  { moduleName: 'Projects', moduleCode: 'PROJ', displayOrder: 14 },
];

// ---------------------------------------------------------------------------
// Default Roles
// ---------------------------------------------------------------------------
const DEFAULT_ROLES = [
  { roleName: 'Super Admin', roleCode: 'SUPER_ADMIN', priority: 1000, isSystem: true },
  { roleName: 'Society Admin', roleCode: 'SOCIETY_ADMIN', priority: 900, isSystem: true },
  { roleName: 'Committee Member', roleCode: 'COMMITTEE_MEMBER', priority: 700, isSystem: false },
  { roleName: 'Treasurer', roleCode: 'TREASURER', priority: 700, isSystem: false },
  { roleName: 'Secretary', roleCode: 'SECRETARY', priority: 700, isSystem: false },
  { roleName: 'Accountant', roleCode: 'ACCOUNTANT', priority: 600, isSystem: false },
  { roleName: 'Moderator', roleCode: 'MODERATOR', priority: 500, isSystem: false },
  { roleName: 'Resident', roleCode: 'RESIDENT', priority: 300, isSystem: false },
  { roleName: 'Tenant', roleCode: 'TENANT', priority: 200, isSystem: false },
  { roleName: 'Guard', roleCode: 'GUARD', priority: 200, isSystem: false },
  { roleName: 'Staff', roleCode: 'STAFF', priority: 200, isSystem: false },
  { roleName: 'Vendor', roleCode: 'VENDOR', priority: 100, isSystem: false },
  { roleName: 'Guest', roleCode: 'GUEST', priority: 0, isSystem: false },
];

// ---------------------------------------------------------------------------
// Permission Templates
// ---------------------------------------------------------------------------
interface PermissionSet {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
  approve: boolean;
  verify: boolean;
}

const ALL_ACCESS: PermissionSet = {
  read: true, create: true, update: true, delete: true,
  export: true, import: true, approve: true, verify: true,
};

const PERMISSION_TEMPLATES: Record<string, Record<string, PermissionSet>> = {
  SUPER_ADMIN: { '*': ALL_ACCESS },
  SOCIETY_ADMIN: { '*': ALL_ACCESS },
  COMMITTEE_MEMBER: {
    MEM: { read: true, create: true, update: true, delete: false, export: true, import: false, approve: false, verify: false },
    INV: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
    ACC: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
    COMP: { read: true, create: true, update: true, delete: false, export: false, import: false, approve: true, verify: false },
    REP: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    ANN: { read: true, create: true, update: true, delete: false, export: false, import: false, approve: false, verify: false },
  },
  TREASURER: {
    ACC: { read: true, create: true, update: true, delete: false, export: true, import: true, approve: true, verify: true },
    MEM: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    REP: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  SECRETARY: {
    MEM: { read: true, create: true, update: true, delete: false, export: true, import: true, approve: false, verify: false },
    COMP: { read: true, create: true, update: true, delete: false, export: true, import: false, approve: true, verify: false },
    ANN: { read: true, create: true, update: true, delete: true, export: false, import: false, approve: true, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    REP: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
  },
  ACCOUNTANT: {
    ACC: { read: true, create: true, update: true, delete: false, export: true, import: true, approve: false, verify: true },
    MEM: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    INV: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    REP: { read: true, create: false, update: false, delete: false, export: true, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  MODERATOR: {
    COMP: { read: true, create: true, update: true, delete: false, export: false, import: false, approve: true, verify: false },
    ANN: { read: true, create: true, update: true, delete: false, export: false, import: false, approve: false, verify: false },
    VIS: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  RESIDENT: {
    COMP: { read: true, create: true, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    MEM: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    ANN: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    FAC: { read: true, create: true, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  TENANT: {
    COMP: { read: true, create: true, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    ANN: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    FAC: { read: true, create: true, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  GUARD: {
    VIS: { read: true, create: true, update: true, delete: false, export: false, import: false, approve: false, verify: true },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  STAFF: {
    COMP: { read: true, create: false, update: true, delete: false, export: false, import: false, approve: false, verify: false },
    FAC: { read: true, create: false, update: true, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  VENDOR: {
    PROJ: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
  GUEST: {
    ANN: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
    DASH: { read: true, create: false, update: false, delete: false, export: false, import: false, approve: false, verify: false },
  },
};

// ---------------------------------------------------------------------------
// Seed Functions
// ---------------------------------------------------------------------------

/**
 * System ObjectId used as createdBy for seeded documents.
 * This avoids requiring an actual user to exist before seeding.
 */
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

/**
 * Seed default modules (upsert by moduleCode).
 */
export async function seedDefaultModules(): Promise<void> {
  let created = 0;
  let updated = 0;

  for (const mod of DEFAULT_MODULES) {
    const result = await SrModule.findOneAndUpdate(
      { moduleCode: mod.moduleCode },
      {
        $setOnInsert: {
          moduleName: mod.moduleName,
          moduleCode: mod.moduleCode,
          displayOrder: mod.displayOrder,
          isActive: true,
          isDefault: true,
          isDeleted: false,
          createdBy: SYSTEM_USER_ID,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If the document was just created (no updatedAt before upsert)
    if (result && result.createdAt && result.updatedAt &&
        result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`[seed-modules] Modules seeded: ${created} created, ${updated} already existed`);
}

/**
 * Seed default roles (upsert by roleCode) and their permission templates.
 */
export async function seedDefaultRoles(): Promise<void> {
  let rolesCreated = 0;
  let rolesExisted = 0;
  let permsCreated = 0;
  let permsExisted = 0;

  // 1. Upsert roles
  const roleMap = new Map<string, mongoose.Types.ObjectId>();

  for (const roleDef of DEFAULT_ROLES) {
    const result = await Role.findOneAndUpdate(
      { roleCode: roleDef.roleCode },
      {
        $setOnInsert: {
          roleName: roleDef.roleName,
          roleCode: roleDef.roleCode,
          priority: roleDef.priority,
          isSystem: roleDef.isSystem,
          isActive: true,
          isDeleted: false,
          createdBy: SYSTEM_USER_ID,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (result) {
      roleMap.set(roleDef.roleCode, result._id as mongoose.Types.ObjectId);
      if (result.createdAt && result.updatedAt &&
          result.createdAt.getTime() === result.updatedAt.getTime()) {
        rolesCreated++;
      } else {
        rolesExisted++;
      }
    }
  }

  console.log(`[seed-roles] Roles seeded: ${rolesCreated} created, ${rolesExisted} already existed`);

  // 2. Fetch all modules
  const allModules = await SrModule.find({ isDeleted: false, isActive: true });
  const modulesByCode = new Map<string, typeof allModules[number]>();
  for (const mod of allModules) {
    modulesByCode.set(mod.moduleCode, mod);
  }

  if (allModules.length === 0) {
    console.warn('[seed-roles] No modules found. Run seedDefaultModules first.');
    return;
  }

  // 3. Create permission entries for each role template
  for (const [roleCode, template] of Object.entries(PERMISSION_TEMPLATES)) {
    const roleId = roleMap.get(roleCode);
    if (!roleId) {
      console.warn(`[seed-roles] Role ${roleCode} not found, skipping permissions`);
      continue;
    }

    // Determine which modules to apply permissions to
    const isWildcard = '*' in template;
    const modulesToProcess = isWildcard ? allModules : allModules.filter(m => template[m.moduleCode]);

    for (const mod of modulesToProcess) {
      const permSet = isWildcard ? template['*'] : template[mod.moduleCode];
      if (!permSet) continue;

      try {
        const existing = await UserPermission.findOne({
          roleId,
          srModuleId: mod._id,
          isDeleted: false,
        });

        if (!existing) {
          await UserPermission.create({
            roleId,
            srModuleId: mod._id,
            moduleName: mod.moduleName,
            canRead: permSet.read,
            canCreate: permSet.create,
            canUpdate: permSet.update,
            canDelete: permSet.delete,
            canExport: permSet.export,
            canImport: permSet.import,
            canApprove: permSet.approve,
            canVerify: permSet.verify,
            isActive: true,
            isDeleted: false,
            createdBy: SYSTEM_USER_ID,
          });
          permsCreated++;
        } else {
          permsExisted++;
        }
      } catch (error: any) {
        // Handle duplicate key errors gracefully (race condition / compound index)
        if (error.code === 11000) {
          permsExisted++;
        } else {
          console.error(`[seed-roles] Error creating permission for ${roleCode}/${mod.moduleCode}:`, error.message);
        }
      }
    }
  }

  console.log(`[seed-roles] Permissions seeded: ${permsCreated} created, ${permsExisted} already existed`);
}
