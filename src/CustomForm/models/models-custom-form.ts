import { Document, Model, Schema, Types, model } from 'mongoose';

export const FieldTypes = [
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'file',
  'boolean',
  'textarea',
  'email',
  'phone',
  'url',
] as const;

export type FieldTypeEnum = (typeof FieldTypes)[number];

export const WidthOptions = ['full', 'half', 'third'] as const;

export type WidthEnum = (typeof WidthOptions)[number];

export const EntityTypes = [
  'member',
  'plot',
  'complaint',
  'application',
  'visitor',
] as const;

export type EntityTypeEnum = (typeof EntityTypes)[number];

export interface IFieldOption {
  value: string;
  label: string;
}

export interface IVisibility {
  dependsOn: string;
  value: any;
}

export interface IValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  [key: string]: any;
}

export interface ICustomForm extends Document {
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldTypeEnum;
  options: IFieldOption[];
  isRequired: boolean;
  defaultValue: any;
  validationRules: IValidationRules;
  placeholder: string;
  helpText: string;
  order: number;
  section: string;
  visibility: IVisibility;
  width: WidthEnum;
  societyId: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomFormModel extends Model<ICustomForm> {
  getByEntity(
    societyId: string | Types.ObjectId,
    entityType: string,
    activeOnly?: boolean
  ): Promise<ICustomForm[]>;
  getFieldsBySection(
    societyId: string | Types.ObjectId,
    entityType: string
  ): Promise<Record<string, ICustomForm[]>>;
}

const customFormSchema = new Schema<ICustomForm>(
  {
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
      index: true,
    },

    fieldName: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
    },

    fieldLabel: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
    },

    fieldType: {
      type: String,
      enum: {
        values: FieldTypes,
        message: 'Field type must be one of: ' + FieldTypes.join(', '),
      },
      required: [true, 'Field type is required'],
    },

    options: {
      type: [
        {
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [],
    },

    isRequired: {
      type: Boolean,
      default: false,
    },

    defaultValue: {
      type: Schema.Types.Mixed,
    },

    validationRules: {
      type: Schema.Types.Mixed,
    },

    placeholder: {
      type: String,
      trim: true,
    },

    helpText: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      trim: true,
    },

    visibility: {
      type: Schema.Types.Mixed,
    },

    width: {
      type: String,
      enum: {
        values: WidthOptions,
        message: 'Width must be one of: ' + WidthOptions.join(', '),
      },
      default: 'full',
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    modifiedBy: {
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
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Compound indexes
customFormSchema.index(
  { societyId: 1, entityType: 1, fieldName: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
customFormSchema.index({ societyId: 1, entityType: 1, isActive: 1, order: 1 });
customFormSchema.index({ entityType: 1, isDeleted: 1 });

// Static: get all custom fields for an entity type
customFormSchema.statics.getByEntity = async function (
  societyId: string | Types.ObjectId,
  entityType: string,
  activeOnly: boolean = true
): Promise<ICustomForm[]> {
  const query: any = {
    societyId: new Types.ObjectId(societyId.toString()),
    entityType,
    isDeleted: false,
  };

  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query).sort({ order: 1 }).exec();
};

// Static: group fields by section
customFormSchema.statics.getFieldsBySection = async function (
  societyId: string | Types.ObjectId,
  entityType: string
): Promise<Record<string, ICustomForm[]>> {
  const fields = await this.find({
    societyId: new Types.ObjectId(societyId.toString()),
    entityType,
    isDeleted: false,
    isActive: true,
  })
    .sort({ section: 1, order: 1 })
    .exec();

  const grouped: Record<string, ICustomForm[]> = {};
  for (const field of fields) {
    const sectionKey = field.section || 'General';
    if (!grouped[sectionKey]) {
      grouped[sectionKey] = [];
    }
    grouped[sectionKey].push(field);
  }

  return grouped;
};

const CustomForm = model<ICustomForm, ICustomFormModel>('CustomForm', customFormSchema);

export default CustomForm;
