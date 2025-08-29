import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { customContentService } from '../services/customContentService';
import {
  CreateCustomFormatRequest,
  CreateCustomLegislationRequest,
  UpdateCustomFormatRequest,
  UpdateCustomLegislationRequest
} from '../models/customContent';

export class CustomContentController {
  // Custom Formats endpoints
  async getCustomFormats(req: Request, res: Response): Promise<void> {
    try {
      const { countryCode } = req.query;
      const formats = await customContentService.getAllCustomFormats(
        countryCode as string | undefined
      );

      res.json({
        success: true,
        data: formats,
        meta: {
          total: formats.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching custom formats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch custom formats',
        },
      });
    }
  }

  async getCustomFormatById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const format = await customContentService.getCustomFormatById(id);

      if (!format) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FORMAT_NOT_FOUND',
            message: `Custom format with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: format,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching custom format:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch custom format',
        },
      });
    }
  }

  async createCustomFormat(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCustomFormatRequest = req.body;
      
      // Validation
      const requiredFields = ['countryCode', 'name', 'url', 'authority', 'type'];
      const missingFields = requiredFields.filter(field => !data[field as keyof CreateCustomFormatRequest]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        });
        return;
      }

      // Validate URL format
      try {
        new URL(data.url);
      } catch {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL format',
          },
        });
        return;
      }

      // Validate type
      if (!['specification', 'standard', 'schema'].includes(data.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be one of: specification, standard, schema',
          },
        });
        return;
      }

      // Future: Get user ID from authentication
      const createdBy = undefined; // req.user?.id;
      
      const format = await customContentService.createCustomFormat(data, createdBy);

      res.status(201).json({
        success: true,
        data: format,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error creating custom format:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create custom format',
        },
      });
    }
  }

  async updateCustomFormat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCustomFormatRequest = req.body;

      // Validate URL if provided
      if (data.url) {
        try {
          new URL(data.url);
        } catch {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid URL format',
            },
          });
          return;
        }
      }

      // Validate type if provided
      if (data.type && !['specification', 'standard', 'schema'].includes(data.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be one of: specification, standard, schema',
          },
        });
        return;
      }

      // Future: Get user ID from authentication
      const updatedBy = undefined; // req.user?.id;

      const format = await customContentService.updateCustomFormat(id, data, updatedBy);

      if (!format) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FORMAT_NOT_FOUND',
            message: `Custom format with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: format,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error updating custom format:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update custom format',
        },
      });
    }
  }

  async deleteCustomFormat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await customContentService.deleteCustomFormat(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FORMAT_NOT_FOUND',
            message: `Custom format with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error deleting custom format:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete custom format',
        },
      });
    }
  }

  // Custom Legislation endpoints
  async getCustomLegislation(req: Request, res: Response): Promise<void> {
    try {
      const { countryCode } = req.query;
      const legislation = await customContentService.getAllCustomLegislation(
        countryCode as string | undefined
      );

      res.json({
        success: true,
        data: legislation,
        meta: {
          total: legislation.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch custom legislation',
        },
      });
    }
  }

  async getCustomLegislationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const legislation = await customContentService.getCustomLegislationById(id);

      if (!legislation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LEGISLATION_NOT_FOUND',
            message: `Custom legislation with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: legislation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch custom legislation',
        },
      });
    }
  }

  async createCustomLegislation(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCustomLegislationRequest = req.body;
      
      // Validation
      const requiredFields = ['countryCode', 'name', 'url', 'jurisdiction', 'type'];
      const missingFields = requiredFields.filter(field => !data[field as keyof CreateCustomLegislationRequest]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        });
        return;
      }

      // Validate URL format
      try {
        new URL(data.url);
      } catch {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL format',
          },
        });
        return;
      }

      // Validate type
      if (!['directive', 'regulation', 'law', 'decree', 'guideline'].includes(data.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be one of: directive, regulation, law, decree, guideline',
          },
        });
        return;
      }

      // Future: Get user ID from authentication
      const createdBy = undefined; // req.user?.id;
      
      const legislation = await customContentService.createCustomLegislation(data, createdBy);

      res.status(201).json({
        success: true,
        data: legislation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error creating custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create custom legislation',
        },
      });
    }
  }

  async updateCustomLegislation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCustomLegislationRequest = req.body;

      // Validate URL if provided
      if (data.url) {
        try {
          new URL(data.url);
        } catch {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid URL format',
            },
          });
          return;
        }
      }

      // Validate type if provided
      if (data.type && !['directive', 'regulation', 'law', 'decree', 'guideline'].includes(data.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be one of: directive, regulation, law, decree, guideline',
          },
        });
        return;
      }

      // Future: Get user ID from authentication
      const updatedBy = undefined; // req.user?.id;

      const legislation = await customContentService.updateCustomLegislation(id, data, updatedBy);

      if (!legislation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LEGISLATION_NOT_FOUND',
            message: `Custom legislation with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: legislation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error updating custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update custom legislation',
        },
      });
    }
  }

  async deleteCustomLegislation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await customContentService.deleteCustomLegislation(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LEGISLATION_NOT_FOUND',
            message: `Custom legislation with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error deleting custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete custom legislation',
        },
      });
    }
  }

  // Admin endpoints for approval workflow
  async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const pending = await customContentService.getPendingApprovals();

      res.json({
        success: true,
        data: pending,
        meta: {
          totalFormats: pending.formats.length,
          totalLegislation: pending.legislation.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch pending approvals',
        },
      });
    }
  }

  async approveCustomFormat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Future: Get user ID from authentication
      const approvedBy = 'system'; // req.user?.id || 'system';

      const format = await customContentService.approveCustomFormat(id, approvedBy);

      if (!format) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FORMAT_NOT_FOUND',
            message: `Custom format with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: format,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error approving custom format:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve custom format',
        },
      });
    }
  }

  async approveCustomLegislation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Future: Get user ID from authentication
      const approvedBy = 'system'; // req.user?.id || 'system';

      const legislation = await customContentService.approveCustomLegislation(id, approvedBy);

      if (!legislation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LEGISLATION_NOT_FOUND',
            message: `Custom legislation with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: legislation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error approving custom legislation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve custom legislation',
        },
      });
    }
  }
}

export const customContentController = new CustomContentController();