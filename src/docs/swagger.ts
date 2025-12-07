import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import packageJson from '../../package.json';
import config from '../config';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: packageJson.name || 'Express API',
    version: packageJson.version || '1.0.0',
    description: packageJson.description || 'Express TypeScript API with Swagger documentation',
    termsOfService: 'https://example.com/terms',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in format: Bearer <token>',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Enter your API key',
      },
    },
    schemas: {
      // Common schemas
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              code: {
                type: 'string',
                example: 'VALIDATION_FAILED',
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          path: {
            type: 'string',
            example: '/api/v1/users',
          },
          requestId: {
            type: 'string',
            example: 'abc123',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            additionalProperties: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 100 },
              pages: { type: 'integer', example: 10 },
            },
          },
        },
      },
      // User schemas
      User: {
        type: 'object',
        required: ['email', 'firstName', 'lastName'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'moderator'],
            default: 'user',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: 'active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateUser: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'Password123!',
          },
          firstName: {
            type: 'string',
            minLength: 2,
            example: 'John',
          },
          lastName: {
            type: 'string',
            minLength: 2,
            example: 'Doe',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'moderator'],
            default: 'user',
          },
        },
      },
      UpdateUser: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            minLength: 2,
            example: 'Jane',
          },
          lastName: {
            type: 'string',
            minLength: 2,
            example: 'Smith',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended'],
          },
        },
      },
      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!',
          },
          rememberMe: {
            type: 'boolean',
            default: false,
          },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
          expiresIn: {
            type: 'integer',
            description: 'Token expiration in seconds',
            example: 3600,
          },
          tokenType: {
            type: 'string',
            example: 'Bearer',
          },
        },
      },
      // Health schemas
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy', 'degraded'],
            example: 'healthy',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          uptime: {
            type: 'number',
            example: 12345.67,
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
          environment: {
            type: 'string',
            example: 'production',
          },
          responseTime: {
            type: 'number',
            example: 15.5,
          },
        },
      },
    },
    parameters: {
      // Common parameters
      PaginationPage: {
        in: 'query',
        name: 'page',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
        description: 'Page number',
      },
      PaginationLimit: {
        in: 'query',
        name: 'limit',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        description: 'Items per page',
      },
      SortBy: {
        in: 'query',
        name: 'sort',
        schema: {
          type: 'string',
        },
        description: 'Sort field (prefix with - for descending)',
      },
      SearchQuery: {
        in: 'query',
        name: 'search',
        schema: {
          type: 'string',
        },
        description: 'Search query',
      },
      UserId: {
        in: 'path',
        name: 'id',
        required: true,
        schema: {
          type: 'string',
        },
        description: 'User ID',
      },
    },
    responses: {
      // Common responses
      UnauthorizedError: {
        description: 'Authentication required or invalid credentials',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'AUTHENTICATION_ERROR',
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'AUTHORIZATION_ERROR',
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'NOT_FOUND_ERROR',
                message: 'User not found',
                code: 'USER_NOT_FOUND',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users/123',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'VALIDATION_ERROR',
                message: 'Validation failed',
                code: 'VALIDATION_FAILED',
                details: {
                  errors: [
                    {
                      field: 'email',
                      message: 'Invalid email address',
                      code: 'invalid_string',
                    },
                  ],
                },
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
      ConflictError: {
        description: 'Resource conflict',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'CONFLICT_ERROR',
                message: 'User already exists',
                code: 'USER_EXISTS',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'RATE_LIMIT_ERROR',
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                type: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong',
                code: 'INTERNAL_ERROR',
              },
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints',
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints (requires admin privileges)',
    },
  ],
  externalDocs: {
    description: 'Find more info here',
    url: 'https://example.com/docs',
  },
};

// Swagger options
const swaggerOptions = {
  swaggerDefinition,
  apis: [
    // API route files with JSDoc comments
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/*.ts',
  ],
};

// Generate swagger spec
export function generateSwaggerSpec() {
  return swaggerJSDoc(swaggerOptions);
}

// Setup Swagger UI
export function setupSwagger(app: Express) {
  const swaggerSpec = generateSwaggerSpec();

  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
      displayOperationId: true,
    },
  };

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  console.log(`📚 Swagger docs available at http://localhost:${config.port}/api-docs`);
}
