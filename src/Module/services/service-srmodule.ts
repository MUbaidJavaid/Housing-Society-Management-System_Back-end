import { Types } from 'mongoose';
import SrModule from '../models/models-srmodule';
import {
  BulkStatusUpdateDto,
  CreateSrModuleDto,
  GetSrModulesResult,
  ImportModulesResult,
  ModuleCode,
  ModuleDropdownItem,
  ModuleHierarchyItem,
  ModulePermission,
  ModuleStatistics,
  SrModuleQueryParams,
  SrModuleType,
  UpdateSrModuleDto,
} from '../types/types-srmodule';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): SrModuleType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as SrModuleType;
};

export const srModuleService = {
  /**
   * Create new module
   */
  async createSrModule(data: CreateSrModuleDto, userId: Types.ObjectId): Promise<SrModuleType> {
    // Check if module code already exists
    const existingCode = await SrModule.findOne({
      moduleCode: data.moduleCode.toUpperCase(),
      isDeleted: false,
    });

    if (existingCode) {
      throw new Error(`Module with code ${data.moduleCode} already exists`);
    }

    // Check if module name already exists
    const existingName = await SrModule.findOne({
      moduleName: { $regex: new RegExp(`^${data.moduleName}$`, 'i') },
      isDeleted: false,
    });

    if (existingName) {
      throw new Error(`Module with name ${data.moduleName} already exists`);
    }

    // Validate parent module if provided
    if (data.parentModuleId) {
      const parentModule = await SrModule.findOne({
        _id: new Types.ObjectId(data.parentModuleId),
        isDeleted: false,
      });

      if (!parentModule) {
        throw new Error('Parent module not found');
      }

      // Prevent circular reference (parent cannot be child of itself)
      if (parentModule.parentModuleId) {
        throw new Error('Cannot assign to a submodule. Only main modules can have submodules.');
      }
    }

    // Set default display order if not provided
    let displayOrder = data.displayOrder || 1;
    if (!data.displayOrder) {
      const maxOrder = await SrModule.findOne({ isDeleted: false })
        .sort({ displayOrder: -1 })
        .select('displayOrder');
      displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 1;
    }

    const moduleData = {
      ...data,
      moduleCode: data.moduleCode.toUpperCase(),
      displayOrder,
      permissions: data.permissions || [ModulePermission.VIEW],
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDefault: data.isDefault !== undefined ? data.isDefault : false,
      iconName: data.iconName || 'FolderIcon',
      parentModuleId: data.parentModuleId ? new Types.ObjectId(data.parentModuleId) : undefined,
      createdBy: userId,
      updatedBy: userId,
    };

    const srModule = await SrModule.create(moduleData);

    // Populate and return the created module
    const createdModule = await SrModule.findById(srModule._id)
      .populate('parentModuleId', 'moduleName moduleCode iconName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!createdModule) {
      throw new Error('Failed to create module');
    }

    return toPlainObject(createdModule);
  },

  /**
   * Get module by ID
   */
  async getModuleById(id: string): Promise<SrModuleType | null> {
    try {
      const module = await SrModule.findById(id)
        .populate('parentModuleId', 'moduleName moduleCode iconName')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!module || module.isDeleted) return null;
      return toPlainObject(module);
    } catch (error) {
      throw new Error('Invalid module ID');
    }
  },

  /**
   * Get module by code
   */
  async getModuleByCode(moduleCode: string): Promise<SrModuleType | null> {
    const module = await SrModule.findOne({
      moduleCode: moduleCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('parentModuleId', 'moduleName moduleCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!module) return null;
    return toPlainObject(module);
  },

  /**
   * Get all modules with pagination
   */
  async getSrModules(params: SrModuleQueryParams): Promise<GetSrModulesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
      parentModuleId,
      isDefault,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by name or code
    if (search) {
      query.$or = [
        { moduleName: { $regex: search, $options: 'i' } },
        { moduleCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Parent module filter
    if (parentModuleId === 'null' || parentModuleId === '') {
      query.parentModuleId = null;
    } else if (parentModuleId) {
      query.parentModuleId = new Types.ObjectId(parentModuleId);
    }

    // Default modules filter
    if (isDefault !== undefined) {
      query.isDefault = isDefault;
    }

    // Execute queries
    const [modules, total] = await Promise.all([
      SrModule.find(query)
        .populate('parentModuleId', 'moduleName moduleCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrModule.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalModules: modules.length,
      activeModules: modules.filter(module => module.isActive).length,
      mainModules: modules.filter(module => !module.parentModuleId).length,
      submodules: modules.filter(module => module.parentModuleId).length,
      defaultModules: modules.filter(module => module.isDefault).length,
    };

    return {
      modules,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update module
   */
  async updateSrModule(
    id: string,
    data: UpdateSrModuleDto,
    userId: Types.ObjectId
  ): Promise<SrModuleType | null> {
    // Check if module exists
    const existingModule = await SrModule.findById(id);
    if (!existingModule || existingModule.isDeleted) {
      throw new Error('Module not found');
    }

    // Check if module code is being updated and if it already exists
    if (data.moduleCode) {
      const existingCode = await SrModule.findOne({
        moduleCode: data.moduleCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingCode) {
        throw new Error(`Module with code ${data.moduleCode} already exists`);
      }
    }

    // Check if module name is being updated and if it already exists
    if (data.moduleName) {
      const existingName = await SrModule.findOne({
        moduleName: { $regex: new RegExp(`^${data.moduleName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingName) {
        throw new Error(`Module with name ${data.moduleName} already exists`);
      }
    }

    // Validate parent module if being updated
    if (data.parentModuleId !== undefined) {
      if (data.parentModuleId === null || data.parentModuleId === '') {
        data.parentModuleId = undefined;
      } else {
        const parentModule = await SrModule.findOne({
          _id: new Types.ObjectId(data.parentModuleId),
          isDeleted: false,
        });

        if (!parentModule) {
          throw new Error('Parent module not found');
        }

        // Prevent self-referencing
        if (data.parentModuleId === id) {
          throw new Error('Module cannot be its own parent');
        }
        // Prevent circular reference
        if (data.parentModuleId) {
          let currentParent: any = parentModule;
          while (currentParent && currentParent.parentModuleId) {
            if (currentParent.parentModuleId.toString() === id) {
              throw new Error('Circular reference detected');
            }
            currentParent = await SrModule.findById(currentParent.parentModuleId);
          }
        }
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Convert module code to uppercase if provided
    if (data.moduleCode) {
      updateObj.moduleCode = data.moduleCode.toUpperCase();
    }

    // Convert parentModuleId to ObjectId if provided
    if (data.parentModuleId) {
      updateObj.parentModuleId = new Types.ObjectId(data.parentModuleId);
    } else if (data.parentModuleId === null) {
      updateObj.parentModuleId = null;
    }

    const module = await SrModule.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('parentModuleId', 'moduleName moduleCode iconName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return module ? toPlainObject(module) : null;
  },

  /**
   * Delete module (soft delete)
   */
  async deleteSrModule(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if module exists and is not deleted
    const existingModule = await SrModule.findById(id);
    if (!existingModule || existingModule.isDeleted) {
      throw new Error('Module not found');
    }

    // Check if module has submodules
    const hasSubmodules = await SrModule.countDocuments({
      parentModuleId: id,
      isDeleted: false,
    });

    if (hasSubmodules > 0) {
      throw new Error('Cannot delete module that has submodules. Delete submodules first.');
    }

    // Check if module is default
    if (existingModule.isDefault) {
      throw new Error('Cannot delete default module. Mark as non-default first.');
    }

    const result = await SrModule.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get active modules
   */
  async getActiveSrModules(): Promise<SrModuleType[]> {
    const modules = await SrModule.find({
      isActive: true,
      isDeleted: false,
      parentModuleId: null, // Only main modules
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ displayOrder: 1, moduleName: 1 });

    return modules.map(module => toPlainObject(module));
  },

  /**
   * Get sidebar modules (hierarchical structure)
   */
  async getSidebarModules(): Promise<ModuleHierarchyItem[]> {
    const modules = await SrModule.find({
      isActive: true,
      isDeleted: false,
    })
      .sort({ displayOrder: 1, moduleName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    // Build hierarchical structure
    const mainModules = modules.filter(module => !module.parentModuleId);
    const submodules = modules.filter(module => module.parentModuleId);

    const hierarchy: ModuleHierarchyItem[] = mainModules.map(mainModule => ({
      id: mainModule._id.toString(),
      name: mainModule.moduleName,
      code: mainModule.moduleCode,
      displayOrder: mainModule.displayOrder,
      iconName: mainModule.iconName,
      routePath: mainModule.routePath,
      isActive: mainModule.isActive,
      children: submodules
        .filter(submodule => submodule.parentModuleId?.toString() === mainModule._id.toString())
        .map(submodule => ({
          id: submodule._id.toString(),
          name: submodule.moduleName,
          code: submodule.moduleCode,
          displayOrder: submodule.displayOrder,
          children: [],
          iconName: submodule.iconName,
          routePath: submodule.routePath,
          isActive: submodule.isActive,
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    }));

    return hierarchy.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  /**
   * Get modules for dropdown
   */
  async getModulesForDropdown(includeSubmodules: boolean = false): Promise<ModuleDropdownItem[]> {
    const query: any = {
      isActive: true,
      isDeleted: false,
    };

    if (!includeSubmodules) {
      query.parentModuleId = null;
    }

    const modules = await SrModule.find(query)
      .select('_id moduleName moduleCode parentModuleId')
      .sort({ moduleName: 1 });

    return modules.map(module => ({
      value: module._id.toString(),
      label: module.parentModuleId
        ? `  ${module.moduleName} (${module.moduleCode})`
        : `${module.moduleName} (${module.moduleCode})`,
      code: module.moduleCode,
      isParent: !module.parentModuleId,
    }));
  },

  /**
   * Toggle module active status
   */
  async toggleModuleStatus(id: string, userId: Types.ObjectId): Promise<SrModuleType | null> {
    const module = await SrModule.findById(id);

    if (!module || module.isDeleted) {
      throw new Error('Module not found');
    }

    // If deactivating a main module, check if it has active submodules
    if (module.isActive && !module.parentModuleId) {
      const activeSubmodules = await SrModule.countDocuments({
        parentModuleId: id,
        isActive: true,
        isDeleted: false,
      });

      if (activeSubmodules > 0) {
        throw new Error(
          'Cannot deactivate module that has active submodules. Deactivate submodules first.'
        );
      }
    }

    const updatedModule = await SrModule.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !module.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('parentModuleId', 'moduleName moduleCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedModule ? toPlainObject(updatedModule) : null;
  },

  /**
   * Bulk update module statuses
   */
  async bulkUpdateModuleStatus(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!data.moduleIds || !Array.isArray(data.moduleIds) || data.moduleIds.length === 0) {
      throw new Error('Module IDs must be a non-empty array');
    }

    const objectIds = data.moduleIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid module ID: ${id}`);
      }
    });

    // Check if any main module being deactivated has active submodules
    if (!data.isActive) {
      const mainModules = await SrModule.find({
        _id: { $in: objectIds },
        parentModuleId: null,
        isDeleted: false,
      });

      for (const mainModule of mainModules) {
        const activeSubmodules = await SrModule.countDocuments({
          parentModuleId: mainModule._id,
          isActive: true,
          isDeleted: false,
        });

        if (activeSubmodules > 0) {
          throw new Error(
            `Cannot deactivate module "${mainModule.moduleName}" that has active submodules. Deactivate submodules first.`
          );
        }
      }
    }

    const result = await SrModule.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive: data.isActive,
          updatedBy: userId,
        },
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Get module statistics
   */
  async getSrModuleStatistics(): Promise<ModuleStatistics> {
    const stats = await SrModule.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalModules: { $sum: 1 },
          activeModules: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          mainModules: {
            $sum: { $cond: [{ $eq: ['$parentModuleId', null] }, 1, 0] },
          },
          submodules: {
            $sum: { $cond: [{ $ne: ['$parentModuleId', null] }, 1, 0] },
          },
          defaultModules: {
            $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] },
          },
          modulesWithPermissions: {
            $sum: { $cond: [{ $gt: [{ $size: '$permissions' }, 0] }, 1, 0] },
          },
          modulesWithoutRoute: {
            $sum: {
              $cond: [{ $or: [{ $eq: ['$routePath', null] }, { $eq: ['$routePath', ''] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    const parentStats = await SrModule.aggregate([
      {
        $match: {
          isDeleted: false,
          parentModuleId: { $ne: null },
        },
      },
      {
        $lookup: {
          from: 'srmodules',
          localField: 'parentModuleId',
          foreignField: '_id',
          as: 'parent',
        },
      },
      { $unwind: '$parent' },
      {
        $group: {
          _id: '$parent.moduleName',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const baseStats = stats[0] || {
      totalModules: 0,
      activeModules: 0,
      mainModules: 0,
      submodules: 0,
      defaultModules: 0,
      modulesWithPermissions: 0,
      modulesWithoutRoute: 0,
    };

    const byParent: Record<string, number> = {};
    parentStats.forEach(stat => {
      byParent[stat._id] = stat.count;
    });

    return {
      ...baseStats,
      inactiveModules: baseStats.totalModules - baseStats.activeModules,
      byParent,
    };
  },

  /**
   * Get default modules
   */
  async getDefaultModules(): Promise<SrModuleType[]> {
    const modules = await SrModule.find({
      isDefault: true,
      isActive: true,
      isDeleted: false,
    })
      .populate('parentModuleId', 'moduleName moduleCode')
      .sort({ displayOrder: 1, moduleName: 1 });

    return modules.map(module => toPlainObject(module));
  },

  /**
   * Get submodules by parent module
   */
  async getSubmodulesByParent(parentModuleId: string): Promise<SrModuleType[]> {
    const modules = await SrModule.find({
      parentModuleId: new Types.ObjectId(parentModuleId),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ displayOrder: 1, moduleName: 1 });

    return modules.map(module => toPlainObject(module));
  },

  /**
   * Validate module data
   */
  validateModuleData(data: CreateSrModuleDto | UpdateSrModuleDto): string[] {
    const errors: string[] = [];

    if ('moduleName' in data && data.moduleName !== undefined) {
      if (!data.moduleName || data.moduleName.trim().length < 2) {
        errors.push('Module Name must be at least 2 characters');
      }
      if (data.moduleName.trim().length > 100) {
        errors.push('Module Name cannot exceed 100 characters');
      }
    }

    if ('moduleCode' in data && data.moduleCode !== undefined) {
      if (!data.moduleCode || data.moduleCode.trim().length < 2) {
        errors.push('Module Code must be at least 2 characters');
      }
      if (data.moduleCode.trim().length > 20) {
        errors.push('Module Code cannot exceed 20 characters');
      }
      if (!/^[A-Z0-9_]+$/.test(data.moduleCode.toUpperCase())) {
        errors.push('Module Code must contain only uppercase letters, numbers, and underscores');
      }
    }

    if ('displayOrder' in data && data.displayOrder !== undefined) {
      if (data.displayOrder < 1) {
        errors.push('Display Order must be at least 1');
      }
    }

    if ('permissions' in data && data.permissions) {
      if (!Array.isArray(data.permissions)) {
        errors.push('Permissions must be an array');
      } else {
        data.permissions.forEach((permission, index) => {
          if (!permission || permission.trim().length === 0) {
            errors.push(`Permission at index ${index} cannot be empty`);
          }
        });
      }
    }

    return errors;
  },

  /**
   * Search modules with filters
   */
  async searchModules(
    searchTerm?: string,
    isActive?: boolean,
    isDefault?: boolean,
    hasParent?: boolean
  ): Promise<SrModuleType[]> {
    const query: any = { isDeleted: false };

    if (searchTerm) {
      query.$or = [
        { moduleName: { $regex: searchTerm, $options: 'i' } },
        { moduleCode: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isDefault !== undefined) {
      query.isDefault = isDefault;
    }

    if (hasParent !== undefined) {
      if (hasParent) {
        query.parentModuleId = { $ne: null };
      } else {
        query.parentModuleId = null;
      }
    }

    const modules = await SrModule.find(query)
      .populate('parentModuleId', 'moduleName moduleCode')
      .sort({ displayOrder: 1, moduleName: 1 })
      .limit(100);

    return modules.map(module => toPlainObject(module));
  },

  /**
   * Import multiple modules
   */
  async importModules(
    modules: CreateSrModuleDto[],
    userId: Types.ObjectId
  ): Promise<ImportModulesResult> {
    const errors: string[] = [];
    const successful: SrModuleType[] = [];

    for (const [index, module] of modules.entries()) {
      try {
        // Validate module
        const validationErrors = this.validateModuleData(module);
        if (validationErrors.length > 0) {
          errors.push(`Row ${index + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        // Check for duplicates
        const existingCode = await SrModule.findOne({
          moduleCode: module.moduleCode.toUpperCase(),
          isDeleted: false,
        });

        const existingName = await SrModule.findOne({
          moduleName: { $regex: new RegExp(`^${module.moduleName}$`, 'i') },
          isDeleted: false,
        });

        if (existingCode || existingName) {
          errors.push(`Row ${index + 1}: Module already exists`);
          continue;
        }

        // Create module
        const createdModule = await this.createSrModule(module, userId);
        successful.push(createdModule);
      } catch (error: any) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    return {
      success: successful.length,
      failed: modules.length - successful.length,
      errors,
    };
  },

  /**
   * Check if module exists by name and code
   */
  async checkModuleExists(
    moduleName: string,
    moduleCode: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      $or: [
        { moduleName: { $regex: new RegExp(`^${moduleName}$`, 'i') } },
        { moduleCode: moduleCode.toUpperCase() },
      ],
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await SrModule.countDocuments(query);
    return count > 0;
  },

  /**
   * Get modules by permission
   */
  async getModulesByPermission(permission: string): Promise<SrModuleType[]> {
    const modules = await SrModule.find({
      permissions: { $in: [permission.toUpperCase()] },
      isActive: true,
      isDeleted: false,
    })
      .populate('parentModuleId', 'moduleName moduleCode')
      .sort({ displayOrder: 1, moduleName: 1 });

    return modules.map(module => toPlainObject(module));
  },

  /**
   * Update module permissions
   */
  async updateModulePermissions(
    id: string,
    permissions: string[],
    userId: Types.ObjectId
  ): Promise<SrModuleType | null> {
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }

    // Validate permissions
    const validPermissions = permissions.map(p => p.trim().toUpperCase()).filter(p => p.length > 0);

    const module = await SrModule.findByIdAndUpdate(
      id,
      {
        $set: {
          permissions: validPermissions,
          updatedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('parentModuleId', 'moduleName moduleCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return module ? toPlainObject(module) : null;
  },

  /**
   * Get module hierarchy tree
   */
  async getModuleHierarchy(): Promise<ModuleHierarchyItem[]> {
    return this.getSidebarModules();
  },

  /**
   * Reorder modules
   */
  async reorderModules(
    moduleOrders: Array<{ id: string; displayOrder: number }>,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const bulkOps = moduleOrders.map(order => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(order.id), isDeleted: false },
        update: {
          $set: {
            displayOrder: order.displayOrder,
            updatedBy: userId,
          },
        },
      },
    }));

    const result = await SrModule.bulkWrite(bulkOps);
    return result.modifiedCount > 0;
  },

  /**
   * Set module as default/non-default
   */
  async setModuleDefaultStatus(
    id: string,
    isDefault: boolean,
    userId: Types.ObjectId
  ): Promise<SrModuleType | null> {
    const module = await SrModule.findByIdAndUpdate(
      id,
      {
        $set: {
          isDefault,
          updatedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('parentModuleId', 'moduleName moduleCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return module ? toPlainObject(module) : null;
  },

  /**
   * Initialize default modules
   */
  async initializeDefaultModules(
    userId: Types.ObjectId
  ): Promise<{ created: number; updated: number }> {
    const defaultModules: CreateSrModuleDto[] = [
      {
        moduleName: 'Dashboard',
        moduleCode: ModuleCode.DASHBOARD,
        description: 'System Dashboard',
        displayOrder: 1,
        iconName: 'DashboardIcon',
        routePath: '/dashboard',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Member Management',
        moduleCode: ModuleCode.MEMBER_MANAGEMENT,
        description: 'Manage members and their information',
        displayOrder: 2,
        iconName: 'PeopleIcon',
        routePath: '/members',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Plot Inventory',
        moduleCode: ModuleCode.PLOT_INVENTORY,
        description: 'Manage plots and inventory',
        displayOrder: 3,
        iconName: 'MapIcon',
        routePath: '/inventory',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Accounts',
        moduleCode: ModuleCode.ACCOUNTS,
        description: 'Financial accounts and transactions',
        displayOrder: 4,
        iconName: 'AccountBalanceIcon',
        routePath: '/accounts',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Transfers',
        moduleCode: ModuleCode.TRANSFERS,
        description: 'Plot transfer management',
        displayOrder: 5,
        iconName: 'SwapHorizIcon',
        routePath: '/transfers',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Possession',
        moduleCode: ModuleCode.POSSESSION,
        description: 'Possession management',
        displayOrder: 6,
        iconName: 'KeyIcon',
        routePath: '/possession',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Complaints',
        moduleCode: ModuleCode.COMPLAINTS,
        description: 'Complaint management system',
        displayOrder: 7,
        iconName: 'ReportProblemIcon',
        routePath: '/complaints',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Reports',
        moduleCode: ModuleCode.REPORTS,
        description: 'System reports and analytics',
        displayOrder: 8,
        iconName: 'AssessmentIcon',
        routePath: '/reports',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
      {
        moduleName: 'Administration',
        moduleCode: ModuleCode.ADMINISTRATION,
        description: 'System administration',
        displayOrder: 9,
        iconName: 'SettingsIcon',
        routePath: '/admin',
        isDefault: true,
        permissions: Object.values(ModulePermission),
      },
    ];

    let created = 0;
    let updated = 0;

    for (const moduleData of defaultModules) {
      try {
        const existingModule = await SrModule.findOne({
          moduleCode: moduleData.moduleCode,
          isDeleted: false,
        });

        if (existingModule) {
          // Update existing module
          await SrModule.findByIdAndUpdate(
            existingModule._id,
            {
              $set: {
                ...moduleData,
                updatedBy: userId,
              },
            },
            { new: true, runValidators: true }
          );
          updated++;
        } else {
          // Create new module
          await this.createSrModule(moduleData, userId);
          created++;
        }
      } catch (error) {
        console.error(`Error initializing module ${moduleData.moduleCode}:`, error);
      }
    }

    return { created, updated };
  },
};
