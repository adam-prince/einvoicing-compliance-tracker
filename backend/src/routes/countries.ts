import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getCountries, getCountryById } from '../controllers/countriesController';

const router = Router();

/**
 * @swagger
 * /countries:
 *   get:
 *     tags: [Countries]
 *     summary: Get all countries
 *     description: Retrieve a list of all countries with their basic information and e-invoicing compliance data
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *         example: 50
 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *           enum: [Africa, Antarctica, Asia, Europe, North America, Oceania, South America]
 *         description: Filter countries by continent
 *         example: Europe
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter countries by region
 *         example: Western Europe
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search countries by name (case-insensitive, partial match)
 *         example: germany
 *     responses:
 *       200:
 *         description: Successful response with countries data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Country'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of countries
 *                           example: 195
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           description: Items per page
 *                           example: 50
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "DEU"
 *                       name: "Germany"
 *                       isoCode2: "DE"
 *                       isoCode3: "DEU"
 *                       continent: "Europe"
 *                       region: "Western Europe"
 *                       eInvoicing:
 *                         b2g:
 *                           status: "mandatory"
 *                           implementationDate: "2020-11-27"
 *                           formats:
 *                             - name: "XRechnung"
 *                               version: "2.3"
 *                               specification: "https://xeinkauf.de/xrechnung/"
 *                               authority: "German Government"
 *                           legislation:
 *                             name: "E-Rechnungsverordnung (ERechV)"
 *                             url: "https://www.gesetze-im-internet.de/erechv/"
 *                             language: "German"
 *                         b2b:
 *                           status: "permitted"
 *                           formats: []
 *                           legislation:
 *                             name: "Umsatzsteuergesetz (UStG)"
 *                             url: "https://www.gesetze-im-internet.de/ustg_1980/"
 *                             language: "German"
 *                         b2c:
 *                           status: "none"
 *                           formats: []
 *                           legislation:
 *                             name: ""
 *                         lastUpdated: "2024-08-15T10:30:00Z"
 *                   meta:
 *                     total: 195
 *                     page: 1
 *                     limit: 50
 *       400:
 *         description: Bad Request - Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "Invalid query parameters"
 *                 details:
 *                   errors:
 *                     - field: "limit"
 *                       message: "limit must be less than or equal to 100"
 *                       value: 200
 *               meta:
 *                 timestamp: "2024-08-15T10:30:00Z"
 *                 requestId: "req-12345"
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "RATE_LIMIT_EXCEEDED"
 *                 message: "Too many requests from this IP, please try again later."
 *               meta:
 *                 timestamp: "2024-08-15T10:30:00Z"
 *                 requestId: "req-12345"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', asyncHandler(getCountries));

/**
 * @swagger
 * /countries/{countryId}:
 *   get:
 *     tags: [Countries]
 *     summary: Get country by ID
 *     description: Retrieve detailed information about a specific country including comprehensive e-invoicing compliance data
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *         description: ISO 3166-1 alpha-3 country code
 *         example: DEU
 *     responses:
 *       200:
 *         description: Successful response with country details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Country'
 *             examples:
 *               germany:
 *                 summary: Germany details
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "DEU"
 *                     name: "Germany"
 *                     isoCode2: "DE"
 *                     isoCode3: "DEU"
 *                     continent: "Europe"
 *                     region: "Western Europe"
 *                     eInvoicing:
 *                       b2g:
 *                         status: "mandatory"
 *                         implementationDate: "2020-11-27"
 *                         formats:
 *                           - name: "XRechnung"
 *                             version: "2.3"
 *                             specification: "https://xeinkauf.de/xrechnung/"
 *                             authority: "German Government"
 *                           - name: "ZUGFeRD"
 *                             version: "2.1"
 *                             specification: "https://www.ferd-net.de/standards/zugferd-2.1.1/index.html"
 *                             authority: "FeRD e.V."
 *                         legislation:
 *                           name: "E-Rechnungsverordnung (ERechV)"
 *                           url: "https://www.gesetze-im-internet.de/erechv/"
 *                           language: "German"
 *                       b2b:
 *                         status: "permitted"
 *                         formats:
 *                           - name: "ZUGFeRD"
 *                             version: "2.1"
 *                             specification: "https://www.ferd-net.de/standards/zugferd-2.1.1/index.html"
 *                             authority: "FeRD e.V."
 *                         legislation:
 *                           name: "Umsatzsteuergesetz (UStG)"
 *                           url: "https://www.gesetze-im-internet.de/ustg_1980/"
 *                           language: "German"
 *                       b2c:
 *                         status: "none"
 *                         formats: []
 *                         legislation:
 *                           name: ""
 *                       lastUpdated: "2024-08-15T10:30:00Z"
 *                   meta:
 *                     timestamp: "2024-08-15T10:30:00Z"
 *                     requestId: "req-12345"
 *       400:
 *         description: Bad Request - Invalid country ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "Invalid country ID format"
 *                 details:
 *                   field: "countryId"
 *                   message: "Country ID must be a 3-letter ISO code"
 *                   value: "DE"
 *               meta:
 *                 timestamp: "2024-08-15T10:30:00Z"
 *                 requestId: "req-12345"
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "COUNTRY_NOT_FOUND"
 *                 message: "Country with ID 'XYZ' not found"
 *                 details:
 *                   field: "countryId"
 *                   value: "XYZ"
 *               meta:
 *                 timestamp: "2024-08-15T10:30:00Z"
 *                 requestId: "req-12345"
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:countryId', asyncHandler(getCountryById));

export default router;