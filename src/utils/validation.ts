import { Types } from 'mongoose';
import { z, ZodError, ZodObject, ZodRawShape, ZodSchema, ZodTypeAny } from 'zod';

// Type-safe validation options
interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  strict?: boolean;
  partial?: boolean;
  requiredFields?: string[];
}

// Common validation schemas (keep as is)
export const objectIdSchema = z
  .string()
  .refine(val => Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' });

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ... other schemas remain the same

// Type guard for ZodObject
function isZodObject(schema: ZodTypeAny): schema is ZodObject<any> {
  return 'shape' in schema && typeof schema.shape === 'object';
}

// Create validation schema with options
export function createValidationSchema<T extends ZodSchema<any>>(
  schema: T,
  options?: {
    strict?: boolean;
    partial?: boolean;
    requiredFields?: string[];
  }
): ZodSchema<z.infer<T>> {
  let validationSchema: ZodSchema<z.infer<T>> = schema;

  // Handle partial option
  if (options?.partial && isZodObject(validationSchema)) {
    validationSchema = validationSchema.partial() as ZodSchema<z.infer<T>>;
  }

  // Handle required fields option
  if (
    options?.requiredFields &&
    options.requiredFields.length > 0 &&
    isZodObject(validationSchema)
  ) {
    const shape = validationSchema.shape;
    const newShape: ZodRawShape = {};

    Object.keys(shape).forEach(key => {
      const field = shape[key];
      if (options.requiredFields?.includes(key)) {
        newShape[key] = field;
      } else {
        newShape[key] = field.optional();
      }
    });

    validationSchema = z.object(newShape) as ZodSchema<z.infer<T>>;
  }

  // Handle strict option
  if (options?.strict && isZodObject(validationSchema) && 'strict' in validationSchema) {
    validationSchema = validationSchema.strict() as ZodSchema<z.infer<T>>;
  }

  return validationSchema;
}

// Fixed validateData function
export async function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options?: {
    abortEarly?: boolean;
    stripUnknown?: boolean;
  }
): Promise<{ success: true; data: T } | { success: false; errors: ZodError }> {
  try {
    // Create safe parse options
    const parseOptions: Record<string, any> = {};

    // Check which options are supported by this Zod version
    // Older versions might not support abortEarly or stripUnknown
    const schemaDef = schema._def as any;

    // Try to use available options
    if (schemaDef?.errorMap || typeof schemaDef?.errorMap === 'function') {
      // This is a newer Zod version that supports errorMap
      if (options?.abortEarly !== undefined) {
        parseOptions.abortEarly = options.abortEarly;
      }
    }

    // For stripUnknown, check if it exists
    if (options?.stripUnknown !== undefined) {
      // Try stripUnknown first (newer versions)
      if ('stripUnknown' in parseOptions || typeof (schema as any).stripUnknown === 'function') {
        parseOptions.stripUnknown = options.stripUnknown;
      }
      // Try strip as fallback (older versions)
      else if ('strip' in parseOptions || typeof (schema as any).strip === 'function') {
        parseOptions.strip = options.stripUnknown;
      }
    }

    // Use safeParseAsync with available options
    const result =
      Object.keys(parseOptions).length > 0
        ? await schema.safeParseAsync(data, parseOptions)
        : await schema.safeParseAsync(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Simpler version - works with all Zod versions
export async function validateDataSimple<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: ZodError }> {
  try {
    const result = await schema.safeParseAsync(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Parse with custom error handling
export async function parseWithOptions<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options?: {
    abortEarly?: boolean;
    errorMap?: z.ZodErrorMap;
  }
): Promise<T> {
  return schema.parseAsync(data, options);
}

// Check if value is a ZodSchema
export function isZodSchema(value: unknown): value is ZodSchema<any> {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, any>;
  return '_def' in obj && typeof obj._def === 'object';
}

// Check Zod version compatibility
export function getZodVersionInfo() {
  const version = (z as any).version || 'unknown';
  const hasAbortEarly = 'abortEarly' in (z.ZodSchema.prototype as any);
  const hasStripUnknown = 'stripUnknown' in (z.ZodSchema.prototype as any);
  const hasStrip = 'strip' in (z.ZodSchema.prototype as any);

  return {
    version,
    hasAbortEarly,
    hasStripUnknown,
    hasStrip,
    supportsOptions: hasAbortEarly || hasStripUnknown || hasStrip,
  };
}

// Alternative: Use a wrapper that handles different Zod versions
class ZodValidator {
  constructor(private schema: ZodSchema<any>) {}

  async validate(data: unknown, options?: ValidationOptions) {
    try {
      let result: z.SafeParseReturnType<any, any>;

      // Handle different Zod versions
      const zodInfo = getZodVersionInfo();

      if (zodInfo.supportsOptions) {
        const parseOptions: any = {};

        if (options?.abortEarly !== undefined && zodInfo.hasAbortEarly) {
          parseOptions.abortEarly = options.abortEarly;
        }

        if (options?.stripUnknown !== undefined) {
          if (zodInfo.hasStripUnknown) {
            parseOptions.stripUnknown = options.stripUnknown;
          } else if (zodInfo.hasStrip) {
            parseOptions.strip = options.stripUnknown;
          }
        }

        result =
          Object.keys(parseOptions).length > 0
            ? await this.schema.safeParseAsync(data, parseOptions)
            : await this.schema.safeParseAsync(data);
      } else {
        result = await this.schema.safeParseAsync(data);
      }

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, errors: result.error };
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }
}

// Usage example
export function createValidator<T>(schema: ZodSchema<T>) {
  return new ZodValidator(schema);
}
