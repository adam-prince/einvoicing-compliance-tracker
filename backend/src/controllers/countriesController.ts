import { Request, Response } from 'express';
import Joi from 'joi';
import { AppError } from '../middleware/errorHandler';
import { Country, FilterQuery, ApiResponse } from '../models/types';
import { logger } from '../utils/logger';

// Import the data (in a real application, this would come from a database)
import * as fs from 'fs';
import * as path from 'path';

// Load JSON data safely
const loadJsonData = (filePath: string) => {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return [];
  }
};

const countriesData = loadJsonData('../data/countries.json');
const complianceData = loadJsonData('../data/compliance-data.json');

// Validation schemas
const getCountriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  continent: Joi.string().valid('Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'),
  region: Joi.string(),
  search: Joi.string().min(1),
});

const getCountryByIdSchema = Joi.object({
  countryId: Joi.string().pattern(/^[A-Z]{3}$/).required().messages({
    'string.pattern.base': 'Country ID must be a 3-letter ISO code (e.g., DEU, USA, FRA)',
  }),
});

// Helper function to merge country data with compliance data
function mergeCountriesWithCompliance(): Country[] {
  const complianceByIso3 = new Map();
  (complianceData as any[]).forEach(c => {
    complianceByIso3.set(c.isoCode3 || c.name, c);
  });

  const countries: Country[] = (countriesData as any[])
    .filter(country => 
      country.continent && 
      typeof country.continent === 'string' && 
      country.continent.trim().length > 0 &&
      country.name.toLowerCase() !== country.continent.toLowerCase()
    )
    .map(country => {
      const compliance = complianceByIso3.get(country.isoCode3) || {};
      const eInvoicing = compliance.eInvoicing || {
        b2g: { status: 'none', formats: [], legislation: { name: '' } },
        b2b: { status: 'none', formats: [], legislation: { name: '' } },
        b2c: { status: 'none', formats: [], legislation: { name: '' } },
        lastUpdated: new Date().toISOString(),
      };

      // Normalize compliance data
      const normalizeStatus = (status: any) => ({
        status: status?.status ?? 'none',
        implementationDate: status?.implementationDate,
        formats: status?.formats ?? [],
        legislation: status?.legislation ?? { name: '' }
      });

      return {
        id: country.isoCode3,
        name: country.name,
        isoCode2: country.isoCode2,
        isoCode3: country.isoCode3,
        continent: country.continent,
        region: country.region,
        eInvoicing: {
          b2g: normalizeStatus(eInvoicing.b2g),
          b2b: normalizeStatus(eInvoicing.b2b),
          b2c: normalizeStatus(eInvoicing.b2c),
          lastUpdated: eInvoicing.lastUpdated ?? new Date().toISOString(),
        }
      };
    });

  // Add compliance-only countries that don't exist in the countries data
  (complianceData as any[]).forEach(c => {
    if (!countries.find(country => country.isoCode3 === c.isoCode3)) {
      const normalizeStatus = (status: any) => ({
        status: status?.status ?? 'none',
        implementationDate: status?.implementationDate,
        formats: status?.formats ?? [],
        legislation: status?.legislation ?? { name: '' }
      });

      countries.push({
        id: c.isoCode3,
        name: c.name,
        isoCode2: '',
        isoCode3: c.isoCode3,
        continent: c.continent || 'Unknown',
        region: c.region,
        eInvoicing: {
          b2g: normalizeStatus(c.eInvoicing?.b2g),
          b2b: normalizeStatus(c.eInvoicing?.b2b),
          b2c: normalizeStatus(c.eInvoicing?.b2c),
          lastUpdated: c.eInvoicing?.lastUpdated ?? new Date().toISOString(),
        }
      });
    }
  });

  return countries
    .filter(country => country.continent && country.name.toLowerCase() !== country.continent.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const getCountries = async (req: Request, res: Response): Promise<void> => {
  // Validate query parameters
  const { error, value } = getCountriesSchema.validate(req.query);
  if (error) {
    throw new AppError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      {
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        })),
      }
    );
  }

  const { page, limit, continent, region, search }: FilterQuery = value;

  try {
    // Get all countries with compliance data
    let countries = mergeCountriesWithCompliance();

    // Apply filters
    if (continent) {
      countries = countries.filter(country => 
        country.continent.toLowerCase() === continent.toLowerCase()
      );
    }

    if (region) {
      countries = countries.filter(country => 
        country.region?.toLowerCase().includes(region.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      countries = countries.filter(country =>
        country.name.toLowerCase().includes(searchLower) ||
        country.isoCode2.toLowerCase().includes(searchLower) ||
        country.isoCode3.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = countries.length;
    const startIndex = (page! - 1) * limit!;
    const endIndex = startIndex + limit!;
    const paginatedCountries = countries.slice(startIndex, endIndex);

    const response: ApiResponse<Country[]> = {
      success: true,
      data: paginatedCountries,
      meta: {
        total,
        page: page!,
        limit: limit!,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info(`Retrieved ${paginatedCountries.length} countries (page ${page}, total: ${total})`, {
      filters: { continent, region, search },
      requestId: req.headers['x-request-id'],
    });

    res.json(response);
  } catch (err) {
    logger.error('Error retrieving countries:', err);
    throw new AppError('Failed to retrieve countries', 500, 'INTERNAL_SERVER_ERROR');
  }
};

export const getCountryById = async (req: Request, res: Response): Promise<void> => {
  // Validate path parameters
  const { error, value } = getCountryByIdSchema.validate(req.params);
  if (error) {
    throw new AppError(
      'Invalid country ID format',
      400,
      'VALIDATION_ERROR',
      {
        field: 'countryId',
        message: error.details[0].message,
        value: req.params.countryId,
      }
    );
  }

  const { countryId } = value;

  try {
    // Get all countries with compliance data
    const countries = mergeCountriesWithCompliance();
    
    // Find the specific country
    const country = countries.find(c => c.isoCode3 === countryId.toUpperCase());

    if (!country) {
      throw new AppError(
        `Country with ID '${countryId}' not found`,
        404,
        'COUNTRY_NOT_FOUND',
        {
          field: 'countryId',
          value: countryId,
        }
      );
    }

    const response: ApiResponse<Country> = {
      success: true,
      data: country,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    logger.info(`Retrieved country details for ${countryId}`, {
      countryName: country.name,
      requestId: req.headers['x-request-id'],
    });

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(`Error retrieving country ${countryId}:`, err);
    throw new AppError('Failed to retrieve country', 500, 'INTERNAL_SERVER_ERROR');
  }
};