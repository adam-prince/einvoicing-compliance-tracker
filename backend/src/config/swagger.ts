import { SwaggerDefinition, Options } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-Invoicing Compliance Tracker API',
    version: '1.0.0',
    description: `
      A comprehensive RESTful API for tracking e-invoicing compliance requirements across different countries and regions.
      
      ## Features
      - **Country Management**: Get detailed information about countries and their e-invoicing requirements
      - **Compliance Data**: Access B2G, B2B, and B2C compliance status and implementation details
      - **News & Updates**: Stay informed about the latest changes in e-invoicing regulations
      - **Export Functionality**: Export compliance data in various formats (Excel, CSV, JSON)
      - **Advanced Search**: Search across countries, compliance data, and news
      - **Rate Limiting**: API usage is rate-limited to ensure fair usage
      
      ## Authentication
      Some endpoints require authentication using JWT tokens. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Rate Limits
      - Public endpoints: 100 requests/hour per IP
      - Authenticated endpoints: 1000 requests/hour per user
      - Admin endpoints: 5000 requests/hour per admin
      
      ## Error Handling
      All errors follow a consistent format with appropriate HTTP status codes and descriptive error messages.
    `,
    contact: {
      name: 'E-Invoicing Compliance Team',
      email: 'support@einvoicing-compliance.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.einvoicing-compliance.com/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Country: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ISO 3166-1 alpha-3 country code',
            example: 'DEU',
          },
          name: {
            type: 'string',
            description: 'Country name',
            example: 'Germany',
          },
          isoCode2: {
            type: 'string',
            description: 'ISO 3166-1 alpha-2 country code',
            example: 'DE',
          },
          isoCode3: {
            type: 'string',
            description: 'ISO 3166-1 alpha-3 country code',
            example: 'DEU',
          },
          continent: {
            type: 'string',
            description: 'Continent name',
            example: 'Europe',
          },
          region: {
            type: 'string',
            description: 'Region name',
            example: 'Western Europe',
          },
          eInvoicing: {
            $ref: '#/components/schemas/EInvoicingCompliance',
          },
        },
        required: ['id', 'name', 'isoCode3', 'continent', 'eInvoicing'],
      },
      EInvoicingCompliance: {
        type: 'object',
        properties: {
          b2g: {
            $ref: '#/components/schemas/ComplianceStatus',
          },
          b2b: {
            $ref: '#/components/schemas/ComplianceStatus',
          },
          b2c: {
            $ref: '#/components/schemas/ComplianceStatus',
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2024-08-15T10:30:00Z',
          },
        },
        required: ['b2g', 'b2b', 'b2c', 'lastUpdated'],
      },
      ComplianceStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['none', 'planned', 'permitted', 'mandatory'],
            description: 'Compliance status',
            example: 'mandatory',
          },
          implementationDate: {
            type: 'string',
            format: 'date',
            description: 'Implementation date (if applicable)',
            example: '2020-11-27',
            nullable: true,
          },
          formats: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EInvoiceFormat',
            },
            description: 'Supported e-invoice formats',
          },
          legislation: {
            $ref: '#/components/schemas/Legislation',
          },
        },
        required: ['status', 'formats', 'legislation'],
      },
      EInvoiceFormat: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Format name',
            example: 'XRechnung',
          },
          version: {
            type: 'string',
            description: 'Format version',
            example: '2.3',
          },
          specification: {
            type: 'string',
            format: 'uri',
            description: 'Specification URL',
            example: 'https://xeinkauf.de/xrechnung/',
          },
          authority: {
            type: 'string',
            description: 'Issuing authority',
            example: 'German Government',
          },
        },
        required: ['name'],
      },
      Legislation: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Legislation name',
            example: 'E-Rechnungsverordnung (ERechV)',
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Legislation URL',
            example: 'https://www.gesetze-im-internet.de/erechv/',
          },
          language: {
            type: 'string',
            description: 'Document language',
            example: 'German',
          },
        },
        required: ['name'],
      },
      NewsItem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique news item identifier',
            example: 'news-123',
          },
          title: {
            type: 'string',
            description: 'News title',
            example: 'Germany Updates XRechnung to Version 2.3',
          },
          summary: {
            type: 'string',
            description: 'News summary',
            example: 'The German government has released version 2.3 of the XRechnung standard...',
          },
          source: {
            type: 'string',
            enum: ['official', 'gena', 'government', 'consulting', 'vatcalc', 'industry'],
            description: 'News source type',
            example: 'official',
          },
          sourceUrl: {
            type: 'string',
            format: 'uri',
            description: 'Source URL',
            example: 'https://xeinkauf.de/xrechnung/versionen/',
          },
          publishedDate: {
            type: 'string',
            format: 'date-time',
            description: 'Publication date',
            example: '2024-08-10T09:00:00Z',
          },
          relevantCountries: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Relevant country codes',
            example: ['DEU'],
          },
          relevance: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'News relevance level',
            example: 'high',
          },
          type: {
            type: 'string',
            description: 'News type',
            example: 'format_update',
          },
        },
        required: ['id', 'title', 'source', 'publishedDate', 'relevance'],
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Request success status',
            example: true,
          },
          data: {
            description: 'Response data',
          },
          meta: {
            type: 'object',
            description: 'Response metadata',
            properties: {
              total: {
                type: 'integer',
                description: 'Total number of items',
                example: 195,
              },
              page: {
                type: 'integer',
                description: 'Current page number',
                example: 1,
              },
              limit: {
                type: 'integer',
                description: 'Items per page',
                example: 50,
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Response timestamp',
                example: '2024-08-15T10:30:00Z',
              },
            },
          },
        },
        required: ['success'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Request success status',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code',
                example: 'COUNTRY_NOT_FOUND',
              },
              message: {
                type: 'string',
                description: 'Error message',
                example: 'Country with ID "XYZ" not found',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
            required: ['code', 'message'],
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Error timestamp',
                example: '2024-08-15T10:30:00Z',
              },
              requestId: {
                type: 'string',
                description: 'Request identifier',
                example: 'req-12345',
              },
            },
            required: ['timestamp', 'requestId'],
          },
        },
        required: ['success', 'error', 'meta'],
      },
    },
  },
  tags: [
    {
      name: 'Countries',
      description: 'Country information and management',
    },
    {
      name: 'Compliance',
      description: 'E-invoicing compliance data',
    },
    {
      name: 'News',
      description: 'News and updates about e-invoicing compliance',
    },
    {
      name: 'Export',
      description: 'Data export functionality',
    },
    {
      name: 'Search',
      description: 'Search and filtering capabilities',
    },
  ],
};

export const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API files
};