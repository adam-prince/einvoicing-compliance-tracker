import express from 'express';
import { customLinksController } from '../controllers/customLinksController';

const router = express.Router();

// GET /api/custom-links - Get all custom links
router.get('/', customLinksController.getAllLinks.bind(customLinksController));

// GET /api/custom-links/country/:countryCode - Get custom links for a specific country
router.get('/country/:countryCode', customLinksController.getLinksByCountry.bind(customLinksController));

// GET /api/custom-links/resolve/:countryCode - Resolve URL with custom link check
router.get('/resolve/:countryCode', customLinksController.resolveUrl.bind(customLinksController));

// POST /api/custom-links - Create or update a custom link
router.post('/', customLinksController.createOrUpdateLink.bind(customLinksController));

// DELETE /api/custom-links/:id - Delete (deactivate) a custom link
router.delete('/:id', customLinksController.deleteLink.bind(customLinksController));

export default router;