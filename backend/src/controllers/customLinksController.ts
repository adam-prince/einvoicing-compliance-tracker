import { Request, Response } from 'express';
import { customLinkService } from '../services/customLinkService';
import { CustomLinkRequest } from '../models/customLink';

export class CustomLinksController {
  
  // GET /api/custom-links
  async getAllLinks(req: Request, res: Response) {
    try {
      const links = await customLinkService.getAllLinks();
      res.json({
        success: true,
        data: links,
        meta: {
          total: links.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to get all custom links:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve custom links'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // GET /api/custom-links/country/:countryCode
  async getLinksByCountry(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;
      const links = await customLinkService.getLinksByCountry(countryCode.toUpperCase());
      
      res.json({
        success: true,
        data: links,
        meta: {
          total: links.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to get custom links by country:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve custom links for country'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // POST /api/custom-links
  async createOrUpdateLink(req: Request, res: Response) {
    try {
      const linkRequest: CustomLinkRequest = req.body;
      
      // Validate required fields
      if (!linkRequest.countryCode || !linkRequest.linkType || !linkRequest.originalUrl || !linkRequest.customUrl || !linkRequest.title) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: countryCode, linkType, originalUrl, customUrl, title'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Validate linkType
      const validLinkTypes = ['legislation', 'specification', 'news', 'standard'];
      if (!validLinkTypes.includes(linkRequest.linkType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid linkType. Must be one of: ' + validLinkTypes.join(', ')
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Normalize country code
      linkRequest.countryCode = linkRequest.countryCode.toUpperCase();

      const link = await customLinkService.createOrUpdateLink(linkRequest);
      
      res.json({
        success: true,
        data: link,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to create/update custom link:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create or update custom link'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // DELETE /api/custom-links/:id
  async deleteLink(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await customLinkService.deleteLink(id);
      
      if (deleted) {
        res.json({
          success: true,
          data: { deleted: true },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Custom link not found'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to delete custom link:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete custom link'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // GET /api/custom-links/resolve/:countryCode
  async resolveUrl(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;
      const { originalUrl, linkType, lastUpdated } = req.query;
      
      if (!originalUrl || !linkType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required query parameters: originalUrl, linkType'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const customUrl = await customLinkService.getCustomUrl(
        countryCode.toUpperCase(), 
        originalUrl as string, 
        linkType as string
      );
      
      const shouldUseCustom = customUrl ? await customLinkService.shouldUseCustomLink(
        countryCode.toUpperCase(),
        originalUrl as string,
        linkType as string,
        lastUpdated as string
      ) : false;

      res.json({
        success: true,
        data: {
          hasCustomLink: !!customUrl,
          customUrl: shouldUseCustom ? customUrl : null,
          shouldUseCustom
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to resolve URL:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resolve URL'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export const customLinksController = new CustomLinksController();