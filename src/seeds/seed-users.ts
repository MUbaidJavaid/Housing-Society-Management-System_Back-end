import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User, { UserRole, UserStatus } from '../database/models/User';
import Society from '../Society/models/models-society';
import Project from '../Project/models/models-project';
import Member from '../Member/models/models-member';
import PlotBlock from '../Plots/models/models-plotblock';
import PlotSize from '../Plots/models/models-plotsize';
import PlotCategory from '../Plots/models/models-plotcategory';
import Plot from '../Plots/models/models-plot';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const TEST_USERS = [
  {
    email: 'superadmin@societysphere.com',
    password: 'SuperAdmin@123',
    firstName: 'Muhammad',
    lastName: 'Admin',
    role: UserRole.SUPER_ADMIN,
    phone: '+923001234567',
    label: 'Super Admin',
  },
  {
    email: 'admin@societysphere.com',
    password: 'Admin@1234',
    firstName: 'Ahmed',
    lastName: 'Khan',
    role: UserRole.ADMIN,
    phone: '+923012345678',
    label: 'Admin',
  },
  {
    email: 'moderator@societysphere.com',
    password: 'Moderator@123',
    firstName: 'Fatima',
    lastName: 'Ali',
    role: UserRole.MODERATOR,
    phone: '+923023456789',
    label: 'Moderator',
  },
  {
    email: 'accountant@societysphere.com',
    password: 'Accountant@123',
    firstName: 'Hassan',
    lastName: 'Raza',
    role: UserRole.ACCOUNTANT,
    phone: '+923034567890',
    label: 'Accountant',
  },
  {
    email: 'member@societysphere.com',
    password: 'Member@1234',
    firstName: 'Ayesha',
    lastName: 'Malik',
    role: UserRole.MEMBER,
    phone: '+923045678901',
    label: 'Member',
  },
  {
    email: 'user@societysphere.com',
    password: 'User@12345',
    firstName: 'Usman',
    lastName: 'Sheikh',
    role: UserRole.USER,
    phone: '+923056789012',
    label: 'User',
  },
  {
    email: 'member2@societysphere.com',
    password: 'Member@1234',
    firstName: 'Zainab',
    lastName: 'Hussain',
    role: UserRole.MEMBER,
    phone: '+923067890123',
    label: 'Member 2',
  },
  {
    email: 'member3@societysphere.com',
    password: 'Member@1234',
    firstName: 'Bilal',
    lastName: 'Ahmad',
    role: UserRole.MEMBER,
    phone: '+923078901234',
    label: 'Member 3',
  },
];

// ---------------------------------------------------------------------------
// Helper: seed a single user (skip if email exists)
// ---------------------------------------------------------------------------
async function seedUser(userData: (typeof TEST_USERS)[number]): Promise<mongoose.Types.ObjectId | null> {
  const existing = await User.findOne({ email: userData.email, isDeleted: false });
  if (existing) {
    return existing._id as mongoose.Types.ObjectId;
  }

  // Hash password manually so the pre-save hook doesn't double-hash
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const user = await User.create({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    status: UserStatus.ACTIVE,
    phone: userData.phone,
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    authMethod: 'email',
    isDeleted: false,
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: { email: true, push: true, sms: false },
      privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
    },
    metadata: { seeded: true },
  });

  return user._id as mongoose.Types.ObjectId;
}

// ---------------------------------------------------------------------------
// Helper: seed sample Society
// ---------------------------------------------------------------------------
async function seedSociety(createdBy: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> {
  const existing = await Society.findOne({ societyCode: 'DHA-ISB-P5', isDeleted: false });
  if (existing) {
    return existing._id as mongoose.Types.ObjectId;
  }

  const society = await Society.create({
    societyName: 'DHA Phase 5 Islamabad',
    societyCode: 'DHA-ISB-P5',
    address: 'DHA Phase 5, Islamabad, Pakistan',
    country: 'Pakistan',
    contactEmail: 'info@dhaphase5.com',
    contactPhone: '+92511234567',
    subscriptionStatus: 'active',
    maxMembers: 500,
    maxProjects: 10,
    maxStaff: 50,
    enabledModules: [
      'members', 'plots', 'projects', 'installments',
      'complaints', 'announcements', 'facilities',
    ],
    isActive: true,
    createdBy,
    isDeleted: false,
  });

  return society._id as mongoose.Types.ObjectId;
}

// ---------------------------------------------------------------------------
// Helper: seed sample City & State (required by Project)
// ---------------------------------------------------------------------------
async function seedCityAndState(createdBy: mongoose.Types.ObjectId) {
  const State = mongoose.model('State');
  const City = mongoose.model('City');

  let state = await State.findOne({ stateName: 'Islamabad Capital Territory', isDeleted: false });
  if (!state) {
    state = await State.create({
      stateName: 'Islamabad Capital Territory',
      stateDescription: 'Federal capital territory of Pakistan',
      createdBy,
      isDeleted: false,
    });
  }

  let city = await City.findOne({ cityName: 'Islamabad', isDeleted: false });
  if (!city) {
    city = await City.create({
      cityName: 'Islamabad',
      cityDescription: 'Capital city of Pakistan',
      stateId: state._id,
      createdBy,
      isDeleted: false,
    });
  }

  return { stateId: state._id as mongoose.Types.ObjectId, cityId: city._id as mongoose.Types.ObjectId };
}

// ---------------------------------------------------------------------------
// Helper: seed sample Project
// ---------------------------------------------------------------------------
async function seedProject(
  societyId: mongoose.Types.ObjectId,
  cityId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId> {
  const existing = await Project.findOne({ projCode: 'DHA5A', isDeleted: false });
  if (existing) {
    return existing._id as mongoose.Types.ObjectId;
  }

  const project = await Project.create({
    projName: 'DHA Phase 5 - Sector A',
    projCode: 'DHA5A',
    projLocation: 'DHA Phase 5, Sector A, Islamabad',
    projPrefix: 'DHA5A',
    projDescription: 'Residential sector with premium plots',
    totalArea: 500,
    areaUnit: 'kanal',
    launchDate: new Date('2024-01-15'),
    projStatus: 'under_development',
    projType: 'residential',
    isActive: true,
    contactEmail: 'sectora@dhaphase5.com',
    contactPhone: '+92511234568',
    address: 'Sector A, DHA Phase 5, Islamabad',
    cityId,
    country: 'Pakistan',
    societyId,
    createdBy,
    isDeleted: false,
  });

  return project._id as mongoose.Types.ObjectId;
}

// ---------------------------------------------------------------------------
// Helper: seed lookup records needed for plots
// ---------------------------------------------------------------------------
async function seedPlotLookups(
  projectId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
) {
  // --- PlotBlock ---
  let block = await PlotBlock.findOne({ plotBlockName: 'Block A', projectId, isDeleted: false });
  if (!block) {
    block = await PlotBlock.create({
      projectId,
      plotBlockName: 'Block A',
      plotBlockDesc: 'Premium residential block',
      blockTotalArea: 100,
      blockAreaUnit: 'kanal',
      createdBy,
      isDeleted: false,
    });
  }

  // --- PlotSize ---
  let size5Marla = await PlotSize.findOne({ plotSizeName: '5 Marla', isDeleted: false });
  if (!size5Marla) {
    size5Marla = await PlotSize.create({
      plotSizeName: '5 Marla',
      totalArea: 1125,
      areaUnit: 'sqft',
      ratePerUnit: 5000,
      standardBasePrice: 5625000,
      createdBy,
      isDeleted: false,
    });
  }

  let size10Marla = await PlotSize.findOne({ plotSizeName: '10 Marla', isDeleted: false });
  if (!size10Marla) {
    size10Marla = await PlotSize.create({
      plotSizeName: '10 Marla',
      totalArea: 2250,
      areaUnit: 'sqft',
      ratePerUnit: 4500,
      standardBasePrice: 10125000,
      createdBy,
      isDeleted: false,
    });
  }

  let size1Kanal = await PlotSize.findOne({ plotSizeName: '1 Kanal', isDeleted: false });
  if (!size1Kanal) {
    size1Kanal = await PlotSize.create({
      plotSizeName: '1 Kanal',
      totalArea: 4500,
      areaUnit: 'sqft',
      ratePerUnit: 4000,
      standardBasePrice: 18000000,
      createdBy,
      isDeleted: false,
    });
  }

  // --- PlotCategory ---
  let catStandard = await PlotCategory.findOne({ categoryName: 'Standard', isDeleted: false });
  if (!catStandard) {
    catStandard = await PlotCategory.create({
      categoryName: 'Standard',
      categoryDesc: 'Standard residential plot',
      surchargePercentage: 0,
      surchargeFixedAmount: 0,
      isActive: true,
      createdBy,
      isDeleted: false,
    });
  }

  let catCorner = await PlotCategory.findOne({ categoryName: 'Corner', isDeleted: false });
  if (!catCorner) {
    catCorner = await PlotCategory.create({
      categoryName: 'Corner',
      categoryDesc: 'Corner plot with extra premium',
      surchargePercentage: 10,
      surchargeFixedAmount: 0,
      isActive: true,
      createdBy,
      isDeleted: false,
    });
  }

  // --- SalesStatus ---
  const SalesStatus = mongoose.model('SalesStatus');
  let statusAvailable = await SalesStatus.findOne({ statusCode: 'AVAILABLE', isDeleted: false });
  if (!statusAvailable) {
    statusAvailable = await SalesStatus.create({
      statusName: 'Available',
      statusCode: 'AVAILABLE',
      statusType: 'available',
      description: 'Plot is available for sale',
      colorCode: '#4CAF50',
      isActive: true,
      isDefault: true,
      sequence: 1,
      allowsSale: true,
      requiresApproval: false,
      createdBy,
      isDeleted: false,
    });
  }

  let statusBooked = await SalesStatus.findOne({ statusCode: 'BOOKED', isDeleted: false });
  if (!statusBooked) {
    statusBooked = await SalesStatus.create({
      statusName: 'Booked',
      statusCode: 'BOOKED',
      statusType: 'booked',
      description: 'Plot is booked by a member',
      colorCode: '#FF9800',
      isActive: true,
      isDefault: false,
      sequence: 2,
      allowsSale: false,
      requiresApproval: false,
      createdBy,
      isDeleted: false,
    });
  }

  let statusSold = await SalesStatus.findOne({ statusCode: 'SOLD', isDeleted: false });
  if (!statusSold) {
    statusSold = await SalesStatus.create({
      statusName: 'Sold',
      statusCode: 'SOLD',
      statusType: 'sold',
      description: 'Plot has been sold',
      colorCode: '#F44336',
      isActive: true,
      isDefault: false,
      sequence: 3,
      allowsSale: false,
      requiresApproval: true,
      createdBy,
      isDeleted: false,
    });
  }

  return {
    blockId: block._id as mongoose.Types.ObjectId,
    sizes: {
      fiveMarla: size5Marla._id as mongoose.Types.ObjectId,
      tenMarla: size10Marla._id as mongoose.Types.ObjectId,
      oneKanal: size1Kanal._id as mongoose.Types.ObjectId,
    },
    categories: {
      standard: catStandard._id as mongoose.Types.ObjectId,
      corner: catCorner._id as mongoose.Types.ObjectId,
    },
    salesStatuses: {
      available: statusAvailable._id as mongoose.Types.ObjectId,
      booked: statusBooked._id as mongoose.Types.ObjectId,
      sold: statusSold._id as mongoose.Types.ObjectId,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: seed 5 sample plots
// ---------------------------------------------------------------------------
async function seedPlots(
  projectId: mongoose.Types.ObjectId,
  societyId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
  lookups: Awaited<ReturnType<typeof seedPlotLookups>>,
): Promise<number> {
  const plotDefs = [
    {
      plotNo: 'A-001',
      plotBlockId: lookups.blockId,
      plotSizeId: lookups.sizes.fiveMarla,
      plotType: 'residential',
      plotCategoryId: lookups.categories.standard,
      plotLength: 25,
      plotWidth: 45,
      plotBasePrice: 5625000,
      salesStatusId: lookups.salesStatuses.available,
      plotFacing: 'N' as const,
      plotStreet: 'Street 1',
    },
    {
      plotNo: 'A-002',
      plotBlockId: lookups.blockId,
      plotSizeId: lookups.sizes.fiveMarla,
      plotType: 'residential',
      plotCategoryId: lookups.categories.corner,
      plotLength: 25,
      plotWidth: 45,
      plotBasePrice: 6187500,
      salesStatusId: lookups.salesStatuses.available,
      surchargeAmount: 562500,
      plotFacing: 'NE' as const,
      plotStreet: 'Street 1',
      plotCornerNo: 1,
    },
    {
      plotNo: 'A-003',
      plotBlockId: lookups.blockId,
      plotSizeId: lookups.sizes.tenMarla,
      plotType: 'residential',
      plotCategoryId: lookups.categories.standard,
      plotLength: 30,
      plotWidth: 75,
      plotBasePrice: 10125000,
      salesStatusId: lookups.salesStatuses.booked,
      plotFacing: 'E' as const,
      plotStreet: 'Street 2',
    },
    {
      plotNo: 'A-004',
      plotBlockId: lookups.blockId,
      plotSizeId: lookups.sizes.tenMarla,
      plotType: 'residential',
      plotCategoryId: lookups.categories.standard,
      plotLength: 30,
      plotWidth: 75,
      plotBasePrice: 10125000,
      salesStatusId: lookups.salesStatuses.sold,
      plotFacing: 'W' as const,
      plotStreet: 'Street 2',
    },
    {
      plotNo: 'A-005',
      plotBlockId: lookups.blockId,
      plotSizeId: lookups.sizes.oneKanal,
      plotType: 'residential',
      plotCategoryId: lookups.categories.corner,
      plotLength: 50,
      plotWidth: 90,
      plotBasePrice: 18000000,
      salesStatusId: lookups.salesStatuses.available,
      surchargeAmount: 1800000,
      plotFacing: 'S' as const,
      plotStreet: 'Main Boulevard',
      plotCornerNo: 2,
    },
  ];

  let created = 0;
  for (const def of plotDefs) {
    const exists = await Plot.findOne({ projectId, plotNo: def.plotNo, isDeleted: false });
    if (exists) continue;

    await Plot.create({
      projectId,
      societyId,
      ...def,
      plotArea: def.plotLength * def.plotWidth,
      plotAreaUnit: 'sqft',
      plotTotalAmount: def.plotBasePrice + (def.surchargeAmount || 0),
      surchargeAmount: def.surchargeAmount || 0,
      discountAmount: 0,
      isPossessionReady: false,
      createdBy,
      isDeleted: false,
    });
    created++;
  }

  return created;
}

// ---------------------------------------------------------------------------
// Helper: seed sample Members linked to member-role users
// ---------------------------------------------------------------------------
async function seedMembers(
  userMap: Map<string, mongoose.Types.ObjectId>,
  societyId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
): Promise<number> {
  const memberDefs = [
    {
      email: 'member@societysphere.com',
      memName: 'Ayesha Malik',
      memNic: '61101-1234567-8',
      memAddr1: 'House 12, Street 5, DHA Phase 5',
      memContMob: '+923045678901',
      memContEmail: 'member@societysphere.com',
      gender: 'female' as const,
      memFHName: 'Tariq Malik',
      memFHRelation: 'father' as const,
    },
    {
      email: 'member2@societysphere.com',
      memName: 'Zainab Hussain',
      memNic: '61101-2345678-9',
      memAddr1: 'House 24, Street 8, DHA Phase 5',
      memContMob: '+923067890123',
      memContEmail: 'member2@societysphere.com',
      gender: 'female' as const,
      memFHName: 'Ali Hussain',
      memFHRelation: 'father' as const,
    },
    {
      email: 'member3@societysphere.com',
      memName: 'Bilal Ahmad',
      memNic: '61101-3456789-0',
      memAddr1: 'House 36, Street 12, DHA Phase 5',
      memContMob: '+923078901234',
      memContEmail: 'member3@societysphere.com',
      gender: 'male' as const,
      memFHName: 'Rashid Ahmad',
      memFHRelation: 'father' as const,
    },
  ];

  let created = 0;
  for (const def of memberDefs) {
    const existing = await Member.findOne({ memNic: def.memNic, isDeleted: false });
    if (existing) continue;

    const userId = userMap.get(def.email);

    await Member.create({
      memName: def.memName,
      memNic: def.memNic,
      memAddr1: def.memAddr1,
      memContMob: def.memContMob,
      memContEmail: def.memContEmail,
      memIsOverseas: false,
      memCountry: 'Pakistan',
      gender: def.gender,
      memFHName: def.memFHName,
      memFHRelation: def.memFHRelation,
      isActive: true,
      emailVerified: true,
      loginAttempts: 0,
      societyId,
      createdBy: userId || createdBy,
      isDeleted: false,
    });
    created++;
  }

  return created;
}

// ---------------------------------------------------------------------------
// Main: seedUsers
// ---------------------------------------------------------------------------
export async function seedUsers(): Promise<void> {
  console.log('[seed-users] Starting user seeding...');

  // 1. Create all users
  const userMap = new Map<string, mongoose.Types.ObjectId>();
  let usersCreated = 0;
  let usersExisted = 0;

  for (const userData of TEST_USERS) {
    const existingCheck = await User.findOne({ email: userData.email, isDeleted: false });
    if (existingCheck) {
      userMap.set(userData.email, existingCheck._id as mongoose.Types.ObjectId);
      usersExisted++;
      continue;
    }

    const userId = await seedUser(userData);
    if (userId) {
      userMap.set(userData.email, userId);
      usersCreated++;
    }
  }

  console.log(`[seed-users] Users: ${usersCreated} created, ${usersExisted} already existed`);

  // Use the super admin as the createdBy for subsequent records
  const superAdminId = userMap.get('superadmin@societysphere.com') || SYSTEM_USER_ID;

  // 2. Seed Society
  let societyId: mongoose.Types.ObjectId;
  try {
    societyId = await seedSociety(superAdminId);
    console.log('[seed-users] Society seeded');
  } catch (err: any) {
    console.warn('[seed-users] Society seeding skipped:', err.message);
    societyId = new mongoose.Types.ObjectId();
  }

  // 3. Seed City & State (needed for Project)
  let cityId: mongoose.Types.ObjectId;
  try {
    const geo = await seedCityAndState(superAdminId);
    cityId = geo.cityId;
    console.log('[seed-users] City & State seeded');
  } catch (err: any) {
    console.warn('[seed-users] City/State seeding skipped:', err.message);
    cityId = new mongoose.Types.ObjectId();
  }

  // 4. Seed Project
  let projectId: mongoose.Types.ObjectId;
  try {
    projectId = await seedProject(societyId, cityId, superAdminId);
    console.log('[seed-users] Project seeded');
  } catch (err: any) {
    console.warn('[seed-users] Project seeding skipped:', err.message);
    projectId = new mongoose.Types.ObjectId();
  }

  // 5. Seed Plots (with required lookup records)
  try {
    const lookups = await seedPlotLookups(projectId, superAdminId);
    const plotsCreated = await seedPlots(projectId, societyId, superAdminId, lookups);
    console.log(`[seed-users] Plots: ${plotsCreated} created`);
  } catch (err: any) {
    console.warn('[seed-users] Plot seeding skipped:', err.message);
  }

  // 6. Seed Members linked to member-role users
  try {
    const membersCreated = await seedMembers(userMap, societyId, superAdminId);
    console.log(`[seed-users] Members: ${membersCreated} created`);
  } catch (err: any) {
    console.warn('[seed-users] Member seeding skipped:', err.message);
  }

  // 7. Print credentials table
  printCredentials();
}

// ---------------------------------------------------------------------------
// Print credentials table
// ---------------------------------------------------------------------------
function printCredentials(): void {
  console.log('\n====================================');
  console.log('  HSMS Test User Credentials');
  console.log('====================================');
  console.log('  Role          | Email                         | Password');
  console.log('  --------------|-------------------------------|----------------');
  console.log('  Super Admin   | superadmin@societysphere.com  | SuperAdmin@123');
  console.log('  Admin         | admin@societysphere.com       | Admin@1234');
  console.log('  Moderator     | moderator@societysphere.com   | Moderator@123');
  console.log('  Accountant    | accountant@societysphere.com  | Accountant@123');
  console.log('  Member        | member@societysphere.com      | Member@1234');
  console.log('  User          | user@societysphere.com        | User@12345');
  console.log('  Member 2      | member2@societysphere.com     | Member@1234');
  console.log('  Member 3      | member3@societysphere.com     | Member@1234');
  console.log('====================================\n');
}
