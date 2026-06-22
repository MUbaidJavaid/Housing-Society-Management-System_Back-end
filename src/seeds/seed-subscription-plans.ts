import mongoose from 'mongoose';
import SubscriptionPackage from '../Subscription/models/models-subscription-package';

const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const DEFAULT_PLANS = [
  {
    packageName: 'Starter',
    packageCode: 'starter',
    description: 'Perfect for small housing societies just getting started.',
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    currency: 'PKR',
    features: {
      maxMembers: 50,
      maxProjects: 1,
      maxStaff: 5,
      maxPlots: 100,
      modules: [
        'members', 'plots', 'projects', 'installments',
        'complaints', 'announcements',
      ],
      storageGB: 2,
      supportLevel: 'email' as const,
      customBranding: false,
      apiAccess: false,
      visitorManagement: false,
      facilityBooking: false,
      advancedReporting: false,
    },
    isPopular: false,
    sortOrder: 1,
  },
  {
    packageName: 'Professional',
    packageCode: 'professional',
    description: 'For growing societies that need full management capabilities.',
    monthlyPrice: 14999,
    yearlyPrice: 149990,
    currency: 'PKR',
    features: {
      maxMembers: 500,
      maxProjects: 10,
      maxStaff: 25,
      maxPlots: 2000,
      modules: [
        'members', 'plots', 'projects', 'installments',
        'complaints', 'announcements', 'facilities', 'visitors',
        'payments', 'defaulters', 'meetings', 'polls',
        'maintenance', 'parking', 'attendance',
      ],
      storageGB: 20,
      supportLevel: 'priority' as const,
      customBranding: true,
      apiAccess: false,
      visitorManagement: true,
      facilityBooking: true,
      advancedReporting: true,
    },
    isPopular: true,
    sortOrder: 2,
  },
  {
    packageName: 'Enterprise',
    packageCode: 'enterprise',
    description: 'For large societies with advanced needs. Full platform access.',
    monthlyPrice: 49999,
    yearlyPrice: 499990,
    currency: 'PKR',
    features: {
      maxMembers: 5000,
      maxProjects: 50,
      maxStaff: 100,
      maxPlots: 20000,
      modules: [
        'members', 'plots', 'projects', 'installments',
        'complaints', 'announcements', 'facilities', 'visitors',
        'payments', 'defaulters', 'meetings', 'polls',
        'maintenance', 'parking', 'attendance', 'workflows',
        'custom-forms', 'privacy', 'ai', 'vendors',
        'gamification', 'plra', 'marketplace', 'forum',
        'staff-registry', 'gate-pass', 'emergency',
        'bulk-operations', 'pdf-generator', 'sms',
      ],
      storageGB: 100,
      supportLevel: 'dedicated' as const,
      customBranding: true,
      apiAccess: true,
      visitorManagement: true,
      facilityBooking: true,
      advancedReporting: true,
    },
    isPopular: false,
    sortOrder: 3,
  },
];

export async function seedSubscriptionPlans(createdBy?: mongoose.Types.ObjectId): Promise<void> {
  const creatorId = createdBy || SYSTEM_USER_ID;
  let created = 0;
  let existed = 0;

  for (const plan of DEFAULT_PLANS) {
    const existing = await SubscriptionPackage.findOne({
      packageCode: plan.packageCode,
      isDeleted: false,
    });

    if (existing) {
      existed++;
      continue;
    }

    await SubscriptionPackage.create({
      ...plan,
      createdBy: creatorId,
    });
    created++;
  }

  console.log(`[seed-plans] Subscription plans: ${created} created, ${existed} already existed`);
}
