import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISrModule extends Document {
  moduleName: string;
  moduleCode: string;
  description?: string;
  displayOrder: number;
  iconName?: string;
  routePath?: string;
  parentModuleId?: Types.ObjectId;
  isActive: boolean;
  permissions: string[];
  isDefault: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const srModuleSchema = new Schema<ISrModule>(
  {
    moduleName: {
      type: String,
      required: [true, 'Module Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Module Name must be at least 2 characters'],
      maxlength: [100, 'Module Name cannot exceed 100 characters'],
      index: true,
    },

    moduleCode: {
      type: String,
      required: [true, 'Module Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Module Code must be at least 2 characters'],
      maxlength: [20, 'Module Code cannot exceed 20 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    displayOrder: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      index: true,
    },

    iconName: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon name cannot exceed 50 characters'],
      default: 'FolderIcon',
    },

    routePath: {
      type: String,
      trim: true,
      maxlength: [200, 'Route path cannot exceed 200 characters'],
    },

    parentModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'SrModule',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    permissions: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
srModuleSchema.index({ isActive: 1, isDeleted: 1 });
srModuleSchema.index({ displayOrder: 1, isActive: 1 });
srModuleSchema.index({ parentModuleId: 1, displayOrder: 1 });

// Text index for search
srModuleSchema.index(
  { moduleName: 'text', moduleCode: 'text', description: 'text' },
  {
    weights: { moduleName: 10, moduleCode: 8, description: 5 },
    name: 'srmodule_text_search',
  }
);

// Virtual for module type (parent or child)
srModuleSchema.virtual('moduleType').get(function () {
  return this.parentModuleId ? 'Submodule' : 'Main Module';
});

// Virtual for full path
srModuleSchema.virtual('fullPath').get(function () {
  if (!this.routePath) return this.moduleName;
  return `${this.moduleName} (${this.routePath})`;
});

// Virtual for icon class (for UI)
srModuleSchema.virtual('iconClass').get(function () {
  const icons: Record<string, string> = {
    MEM: 'fas fa-users',
    INV: 'fas fa-map-marked-alt',
    ACC: 'fas fa-calculator',
    TRF: 'fas fa-exchange-alt',
    POS: 'fas fa-key',
    REP: 'fas fa-chart-bar',
    COMP: 'fas fa-exclamation-circle',
    ADM: 'fas fa-cog',
    SET: 'fas fa-sliders-h',
    DASH: 'fas fa-tachometer-alt',
  };
  return icons[this.moduleCode] || 'fas fa-folder';
});

// Virtual for badge color (for UI)
srModuleSchema.virtual('badgeColor').get(function () {
  const colors: Record<string, string> = {
    MEM: 'primary',
    INV: 'success',
    ACC: 'warning',
    TRF: 'info',
    POS: 'danger',
    REP: 'dark',
    COMP: 'secondary',
    ADM: 'light',
    SET: 'dark',
    DASH: 'primary',
  };
  return colors[this.moduleCode] || 'secondary';
});

// Static method to get active modules
srModuleSchema.statics.getActiveModules = function (): Promise<ISrModule[]> {
  return this.find({
    isActive: true,
    isDeleted: false,
    parentModuleId: null, // Only main modules
  }).sort({ displayOrder: 1, moduleName: 1 });
};

// Static method to get modules for sidebar
srModuleSchema.statics.getSidebarModules = function (): Promise<ISrModule[]> {
  return this.find({
    isActive: true,
    isDeleted: false,
  })
    .sort({ displayOrder: 1, moduleName: 1 })
    .populate('parentModuleId', 'moduleName moduleCode');
};

// Static method to get modules by code
srModuleSchema.statics.getModuleByCode = function (moduleCode: string): Promise<ISrModule | null> {
  return this.findOne({
    moduleCode: moduleCode.toUpperCase(),
    isDeleted: false,
  });
};

// Static method to get default modules
srModuleSchema.statics.getDefaultModules = function (): Promise<ISrModule[]> {
  return this.find({
    isDefault: true,
    isActive: true,
    isDeleted: false,
  }).sort({ displayOrder: 1 });
};

const SrModule: Model<ISrModule> = model<ISrModule>('SrModule', srModuleSchema);

export default SrModule;
