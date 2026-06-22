import mongoose from 'mongoose';

/**
 * Global Mongoose plugin that adds automatic tenant isolation.
 *
 * For any schema that has a `societyId` path, this plugin:
 * 1. Auto-excludes soft-deleted documents (isDeleted: true)
 * 2. Adds compound index on { societyId, isDeleted } for performance
 *
 * Tenant filtering by societyId is done at the service/controller level
 * by passing societyId from the request context. This plugin ensures
 * soft-delete filtering is always applied.
 *
 * Usage: Call registerTenantPlugin() once during app initialization,
 * BEFORE any models are compiled.
 */
export function registerTenantPlugin(): void {
  mongoose.plugin(function tenantIsolationPlugin(schema: mongoose.Schema) {
    // Only apply to schemas that have societyId
    if (!schema.path('societyId')) return;

    // Add compound index for performance if not already present
    const indexes = schema.indexes();
    const hasCompoundIndex = indexes.some(
      ([fields]) =>
        fields &&
        typeof fields === 'object' &&
        'societyId' in fields &&
        'isDeleted' in fields,
    );

    if (!hasCompoundIndex && schema.path('isDeleted')) {
      schema.index({ societyId: 1, isDeleted: 1 });
    }

    // Auto-exclude soft-deleted documents on all find operations
    const findOps = [
      'find',
      'findOne',
      'findOneAndUpdate',
      'findOneAndDelete',
      'findOneAndReplace',
      'countDocuments',
    ] as const;

    for (const op of findOps) {
      schema.pre(op, function (this: any) {
        const conditions = this.getFilter?.() || {};
        // Only auto-add isDeleted filter if not explicitly set in the query
        if (
          schema.path('isDeleted') &&
          conditions.isDeleted === undefined &&
          !this.getOptions?.().includeDeleted
        ) {
          this.where({ isDeleted: { $ne: true } });
        }
      });
    }
  });
}
