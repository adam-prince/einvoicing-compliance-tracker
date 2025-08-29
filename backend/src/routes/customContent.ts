import { Router } from 'express';
import { customContentController } from '../controllers/customContentController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomFormat:
 *       type: object
 *       required:
 *         - id
 *         - countryCode
 *         - countryName
 *         - name
 *         - url
 *         - authority
 *         - type
 *         - createdAt
 *         - approved
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the custom format
 *         countryCode:
 *           type: string
 *           description: ISO 3166-1 alpha-3 country code
 *         countryName:
 *           type: string
 *           description: Human-readable country name
 *         name:
 *           type: string
 *           description: Format name
 *         version:
 *           type: string
 *           description: Format version
 *         url:
 *           type: string
 *           format: uri
 *           description: URL to format specification
 *         description:
 *           type: string
 *           description: Format description
 *         authority:
 *           type: string
 *           description: Issuing authority
 *         type:
 *           type: string
 *           enum: [specification, standard, schema]
 *           description: Type of format document
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         createdBy:
 *           type: string
 *           description: User ID who created this entry
 *         approved:
 *           type: boolean
 *           description: Whether this entry is approved for public visibility
 *         approvedBy:
 *           type: string
 *           description: User ID who approved this entry
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: Approval timestamp
 *     
 *     CustomLegislation:
 *       type: object
 *       required:
 *         - id
 *         - countryCode
 *         - countryName
 *         - name
 *         - url
 *         - jurisdiction
 *         - type
 *         - createdAt
 *         - approved
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the custom legislation
 *         countryCode:
 *           type: string
 *           description: ISO 3166-1 alpha-3 country code
 *         countryName:
 *           type: string
 *           description: Human-readable country name
 *         name:
 *           type: string
 *           description: Legislation name
 *         url:
 *           type: string
 *           format: uri
 *           description: URL to legislation document
 *         language:
 *           type: string
 *           description: Document language
 *         jurisdiction:
 *           type: string
 *           description: Legal jurisdiction
 *         type:
 *           type: string
 *           enum: [directive, regulation, law, decree, guideline]
 *           description: Type of legislation
 *         documentId:
 *           type: string
 *           description: Official document identifier
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         createdBy:
 *           type: string
 *           description: User ID who created this entry
 *         approved:
 *           type: boolean
 *           description: Whether this entry is approved for public visibility
 *         approvedBy:
 *           type: string
 *           description: User ID who approved this entry
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: Approval timestamp
 *     
 *     CreateCustomFormatRequest:
 *       type: object
 *       required:
 *         - countryCode
 *         - name
 *         - url
 *         - authority
 *         - type
 *       properties:
 *         countryCode:
 *           type: string
 *           description: ISO 3166-1 alpha-3 country code
 *         name:
 *           type: string
 *           description: Format name
 *         version:
 *           type: string
 *           description: Format version
 *         url:
 *           type: string
 *           format: uri
 *           description: URL to format specification
 *         description:
 *           type: string
 *           description: Format description
 *         authority:
 *           type: string
 *           description: Issuing authority
 *         type:
 *           type: string
 *           enum: [specification, standard, schema]
 *           description: Type of format document
 *     
 *     CreateCustomLegislationRequest:
 *       type: object
 *       required:
 *         - countryCode
 *         - name
 *         - url
 *         - jurisdiction
 *         - type
 *       properties:
 *         countryCode:
 *           type: string
 *           description: ISO 3166-1 alpha-3 country code
 *         name:
 *           type: string
 *           description: Legislation name
 *         url:
 *           type: string
 *           format: uri
 *           description: URL to legislation document
 *         language:
 *           type: string
 *           description: Document language
 *         jurisdiction:
 *           type: string
 *           description: Legal jurisdiction
 *         type:
 *           type: string
 *           enum: [directive, regulation, law, decree, guideline]
 *           description: Type of legislation
 *         documentId:
 *           type: string
 *           description: Official document identifier
 */

// Custom Formats Routes

/**
 * @swagger
 * /api/v1/custom-content/formats:
 *   get:
 *     summary: Get all custom formats
 *     tags: [Custom Content]
 *     parameters:
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Filter by country code (ISO 3166-1 alpha-3)
 *     responses:
 *       200:
 *         description: List of custom formats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomFormat'
 */
router.get('/formats', customContentController.getCustomFormats);

/**
 * @swagger
 * /api/v1/custom-content/formats/{id}:
 *   get:
 *     summary: Get custom format by ID
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Format ID
 *     responses:
 *       200:
 *         description: Custom format details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFormat'
 *       404:
 *         description: Format not found
 */
router.get('/formats/:id', customContentController.getCustomFormatById);

/**
 * @swagger
 * /api/v1/custom-content/formats:
 *   post:
 *     summary: Create a new custom format
 *     tags: [Custom Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomFormatRequest'
 *     responses:
 *       201:
 *         description: Custom format created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFormat'
 *       400:
 *         description: Validation error
 */
router.post('/formats', customContentController.createCustomFormat);

/**
 * @swagger
 * /api/v1/custom-content/formats/{id}:
 *   put:
 *     summary: Update custom format
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Format ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomFormatRequest'
 *     responses:
 *       200:
 *         description: Custom format updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFormat'
 *       404:
 *         description: Format not found
 */
router.put('/formats/:id', customContentController.updateCustomFormat);

/**
 * @swagger
 * /api/v1/custom-content/formats/{id}:
 *   delete:
 *     summary: Delete custom format
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Format ID
 *     responses:
 *       200:
 *         description: Custom format deleted successfully
 *       404:
 *         description: Format not found
 */
router.delete('/formats/:id', customContentController.deleteCustomFormat);

// Custom Legislation Routes

/**
 * @swagger
 * /api/v1/custom-content/legislation:
 *   get:
 *     summary: Get all custom legislation
 *     tags: [Custom Content]
 *     parameters:
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Filter by country code (ISO 3166-1 alpha-3)
 *     responses:
 *       200:
 *         description: List of custom legislation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomLegislation'
 */
router.get('/legislation', customContentController.getCustomLegislation);

/**
 * @swagger
 * /api/v1/custom-content/legislation/{id}:
 *   get:
 *     summary: Get custom legislation by ID
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legislation ID
 *     responses:
 *       200:
 *         description: Custom legislation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomLegislation'
 *       404:
 *         description: Legislation not found
 */
router.get('/legislation/:id', customContentController.getCustomLegislationById);

/**
 * @swagger
 * /api/v1/custom-content/legislation:
 *   post:
 *     summary: Create new custom legislation
 *     tags: [Custom Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomLegislationRequest'
 *     responses:
 *       201:
 *         description: Custom legislation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomLegislation'
 *       400:
 *         description: Validation error
 */
router.post('/legislation', customContentController.createCustomLegislation);

/**
 * @swagger
 * /api/v1/custom-content/legislation/{id}:
 *   put:
 *     summary: Update custom legislation
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legislation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomLegislationRequest'
 *     responses:
 *       200:
 *         description: Custom legislation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomLegislation'
 *       404:
 *         description: Legislation not found
 */
router.put('/legislation/:id', customContentController.updateCustomLegislation);

/**
 * @swagger
 * /api/v1/custom-content/legislation/{id}:
 *   delete:
 *     summary: Delete custom legislation
 *     tags: [Custom Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legislation ID
 *     responses:
 *       200:
 *         description: Custom legislation deleted successfully
 *       404:
 *         description: Legislation not found
 */
router.delete('/legislation/:id', customContentController.deleteCustomLegislation);

// Admin Routes for Approval Workflow

/**
 * @swagger
 * /api/v1/custom-content/admin/pending:
 *   get:
 *     summary: Get pending approvals (admin only)
 *     tags: [Custom Content - Admin]
 *     responses:
 *       200:
 *         description: Pending approvals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     formats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CustomFormat'
 *                     legislation:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CustomLegislation'
 */
router.get('/admin/pending', customContentController.getPendingApprovals);

/**
 * @swagger
 * /api/v1/custom-content/admin/formats/{id}/approve:
 *   post:
 *     summary: Approve custom format (admin only)
 *     tags: [Custom Content - Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Format ID
 *     responses:
 *       200:
 *         description: Format approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFormat'
 *       404:
 *         description: Format not found
 */
router.post('/admin/formats/:id/approve', customContentController.approveCustomFormat);

/**
 * @swagger
 * /api/v1/custom-content/admin/legislation/{id}/approve:
 *   post:
 *     summary: Approve custom legislation (admin only)
 *     tags: [Custom Content - Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legislation ID
 *     responses:
 *       200:
 *         description: Legislation approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomLegislation'
 *       404:
 *         description: Legislation not found
 */
router.post('/admin/legislation/:id/approve', customContentController.approveCustomLegislation);

export default router;