# E-Invoicing Compliance Tracker API Architecture

## Overview

This document outlines the RESTful API architecture for the E-Invoicing Compliance Tracker application, designed to separate frontend and backend concerns while providing a robust, scalable, and secure API.

## Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi or Zod
- **Testing**: Jest + Supertest
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Security**: Helmet.js, CORS

## API Base URL

```
Production: https://api.einvoicing-compliance.com/v1
Development: http://localhost:3000/api/v1
```

## Core API Endpoints

### 1. Countries Management

#### GET /api/v1/countries
Get all countries with their basic information.

```json
{
  "success": true,
  "data": [
    {
      "id": "DEU",
      "name": "Germany",
      "isoCode2": "DE",
      "isoCode3": "DEU",
      "continent": "Europe",
      "region": "Western Europe"
    }
  ],
  "meta": {
    "total": 195,
    "page": 1,
    "limit": 50
  }
}
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `continent` (string): Filter by continent
- `region` (string): Filter by region
- `search` (string): Search by country name

#### GET /api/v1/countries/{countryId}
Get detailed information about a specific country.

```json
{
  "success": true,
  "data": {
    "id": "DEU",
    "name": "Germany",
    "isoCode2": "DE",
    "isoCode3": "DEU",
    "continent": "Europe",
    "region": "Western Europe",
    "eInvoicing": {
      "b2g": {
        "status": "mandatory",
        "implementationDate": "2020-11-27",
        "formats": [
          {
            "name": "XRechnung",
            "version": "2.3",
            "specification": "https://xeinkauf.de/xrechnung/",
            "authority": "German Government"
          }
        ],
        "legislation": {
          "name": "E-Rechnungsverordnung (ERechV)",
          "url": "https://www.gesetze-im-internet.de/erechv/",
          "language": "German"
        }
      },
      "b2b": {
        "status": "permitted",
        "implementationDate": null,
        "formats": [],
        "legislation": {
          "name": "Umsatzsteuergesetz (UStG)",
          "url": "https://www.gesetze-im-internet.de/ustg_1980/",
          "language": "German"
        }
      },
      "b2c": {
        "status": "none",
        "implementationDate": null,
        "formats": [],
        "legislation": {
          "name": "",
          "url": "",
          "language": ""
        }
      },
      "lastUpdated": "2024-08-15T10:30:00Z"
    }
  }
}
```

### 2. Compliance Data Management

#### GET /api/v1/compliance
Get comprehensive compliance data for all countries.

```json
{
  "success": true,
  "data": [
    {
      "countryId": "DEU",
      "countryName": "Germany",
      "b2gStatus": "mandatory",
      "b2bStatus": "permitted",
      "b2cStatus": "none",
      "hasPeriodicReporting": true,
      "lastUpdated": "2024-08-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 195,
    "lastGlobalUpdate": "2024-08-15T10:30:00Z"
  }
}
```

**Query Parameters:**
- `status` (string): Filter by compliance status (mandatory, planned, permitted, none)
- `type` (string): Filter by transaction type (b2g, b2b, b2c)
- `hasPeriodicReporting` (boolean): Filter countries with periodic reporting
- `continent` (string): Filter by continent
- `updatedSince` (ISO date): Get countries updated since date

#### PUT /api/v1/compliance/{countryId}
Update compliance data for a specific country (Admin only).

```json
{
  "b2g": {
    "status": "mandatory",
    "implementationDate": "2020-11-27",
    "formats": [
      {
        "name": "XRechnung",
        "version": "2.3",
        "specification": "https://xeinkauf.de/xrechnung/",
        "authority": "German Government"
      }
    ],
    "legislation": {
      "name": "E-Rechnungsverordnung (ERechV)",
      "url": "https://www.gesetze-im-internet.de/erechv/",
      "language": "German"
    }
  }
}
```

### 3. News and Updates

#### GET /api/v1/news
Get latest news and updates about e-invoicing compliance.

```json
{
  "success": true,
  "data": [
    {
      "id": "news-123",
      "title": "Germany Updates XRechnung to Version 2.3",
      "summary": "The German government has released version 2.3 of the XRechnung standard...",
      "source": "official",
      "sourceUrl": "https://xeinkauf.de/xrechnung/versionen/",
      "publishedDate": "2024-08-10T09:00:00Z",
      "relevantCountries": ["DEU"],
      "relevance": "high",
      "type": "format_update"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

**Query Parameters:**
- `countryId` (string): Filter news for specific country
- `source` (string): Filter by source type (official, gena, government, consulting, vatcalc, industry)
- `relevance` (string): Filter by relevance (high, medium, low)
- `type` (string): Filter by news type (format_update, legislation_change, deadline_change, etc.)
- `since` (ISO date): Get news since date

#### POST /api/v1/news
Create new news item (Admin only).

### 4. Export Functionality

#### POST /api/v1/export/excel
Export compliance data to Excel format.

```json
{
  "filters": {
    "countries": ["DEU", "FRA", "ITA"],
    "status": "mandatory",
    "type": "b2g"
  },
  "format": "detailed"
}
```

Response: Binary Excel file

#### POST /api/v1/export/csv
Export compliance data to CSV format.

#### POST /api/v1/export/json
Export compliance data to JSON format.

### 5. Search and Filtering

#### GET /api/v1/search
Advanced search across countries and compliance data.

```json
{
  "success": true,
  "data": {
    "countries": [
      {
        "id": "DEU",
        "name": "Germany",
        "matchScore": 0.95,
        "matchReason": "Country name exact match"
      }
    ],
    "compliance": [
      {
        "countryId": "DEU",
        "field": "b2g.legislation.name",
        "value": "E-Rechnungsverordnung",
        "matchScore": 0.87
      }
    ]
  },
  "meta": {
    "query": "germany e-rechnung",
    "totalResults": 2,
    "searchTime": "12ms"
  }
}
```

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string): Limit search to specific type (countries, compliance, news)
- `fuzzy` (boolean): Enable fuzzy matching (default: true)

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "COUNTRY_NOT_FOUND",
    "message": "Country with ID 'XYZ' not found",
    "details": {
      "field": "countryId",
      "value": "XYZ"
    }
  },
  "meta": {
    "timestamp": "2024-08-15T10:30:00Z",
    "requestId": "req-12345"
  }
}
```

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `COUNTRY_NOT_FOUND` - Country not found
- `COMPLIANCE_DATA_NOT_FOUND` - Compliance data not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Authentication & Authorization

### JWT Authentication

```http
Authorization: Bearer <jwt-token>
```

### User Roles

- `public` - Read-only access to public data
- `user` - Read access to all data + export functionality
- `admin` - Full CRUD access
- `system` - Internal system access

### Rate Limiting

- Public endpoints: 100 requests/hour per IP
- Authenticated endpoints: 1000 requests/hour per user
- Admin endpoints: 5000 requests/hour per admin

## Data Models

### Country Model

```typescript
interface Country {
  id: string;           // ISO 3166-1 alpha-3 code
  name: string;
  isoCode2: string;     // ISO 3166-1 alpha-2 code
  isoCode3: string;     // ISO 3166-1 alpha-3 code
  continent: string;
  region?: string;
  eInvoicing: EInvoicingCompliance;
  createdAt: Date;
  updatedAt: Date;
}
```

### E-Invoicing Compliance Model

```typescript
interface EInvoicingCompliance {
  b2g: ComplianceStatus;
  b2b: ComplianceStatus;
  b2c: ComplianceStatus;
  lastUpdated: Date;
}

interface ComplianceStatus {
  status: 'none' | 'planned' | 'permitted' | 'mandatory';
  implementationDate?: Date;
  formats: EInvoiceFormat[];
  legislation: Legislation;
}

interface EInvoiceFormat {
  name: string;
  version?: string;
  specification?: string;
  authority?: string;
}

interface Legislation {
  name: string;
  url?: string;
  language?: string;
}
```

## Security Considerations

### Data Protection

- All data transmission over HTTPS only
- Sensitive data encrypted at rest
- Regular security audits and penetration testing
- GDPR compliance for EU data

### Input Validation

- All inputs validated using Joi/Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization
- CSRF protection for state-changing operations

### Infrastructure Security

- API Gateway with DDoS protection
- Web Application Firewall (WAF)
- Regular dependency updates
- Security headers via Helmet.js
- CORS properly configured

## Performance Considerations

### Caching Strategy

- Redis for session data and frequently accessed data
- CDN for static assets
- HTTP caching headers for appropriate responses
- Database query optimization

### Monitoring and Logging

- Application performance monitoring (APM)
- Structured logging with Winston
- Error tracking and alerting
- API usage analytics

### Scalability

- Horizontal scaling with load balancers
- Database read replicas for read-heavy operations
- Microservices architecture consideration for future growth

## API Versioning

- URL-based versioning (`/api/v1/`, `/api/v2/`)
- Semantic versioning for API releases
- Backward compatibility maintenance
- Deprecation notices with migration guides

## Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Generate API documentation
npm run docs:generate

# Validate API schema
npm run validate:openapi
```

### API Documentation

- Interactive Swagger UI at `/api/docs`
- OpenAPI 3.0 specification at `/api/openapi.json`
- Postman collection available
- Code examples in multiple languages

## Deployment Strategy

### Environments

- **Development**: Latest changes, frequent deployments
- **Staging**: Production-like testing environment
- **Production**: Stable releases with rollback capability

### CI/CD Pipeline

1. Code commit triggers automated tests
2. API schema validation
3. Security scanning
4. Deployment to staging
5. Automated integration tests
6. Manual approval for production
7. Blue-green deployment to production
8. Post-deployment verification

This API architecture provides a solid foundation for separating the frontend and backend while maintaining high performance, security, and scalability standards.