import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  CustomFormat,
  CustomLegislation,
  CreateCustomFormatRequest,
  CreateCustomLegislationRequest,
  UpdateCustomFormatRequest,
  UpdateCustomLegislationRequest
} from '../models/customContent';

export class CustomContentService {
  private customFormatsPath: string;
  private customLegislationPath: string;
  private customFormats: CustomFormat[] = [];
  private customLegislation: CustomLegislation[] = [];

  constructor() {
    // Store custom content in backend data directory
    const dataDir = path.join(__dirname, '..', 'data');
    this.customFormatsPath = path.join(dataDir, 'custom-formats.json');
    this.customLegislationPath = path.join(dataDir, 'custom-legislation.json');
    
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      // Load custom formats
      try {
        const formatsData = await fs.readFile(this.customFormatsPath, 'utf8');
        this.customFormats = JSON.parse(formatsData);
        logger.info(`Loaded ${this.customFormats.length} custom formats`);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
        this.customFormats = [];
        logger.info('No custom formats file found, starting with empty array');
      }

      // Load custom legislation
      try {
        const legislationData = await fs.readFile(this.customLegislationPath, 'utf8');
        this.customLegislation = JSON.parse(legislationData);
        logger.info(`Loaded ${this.customLegislation.length} custom legislation entries`);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
        this.customLegislation = [];
        logger.info('No custom legislation file found, starting with empty array');
      }
    } catch (error) {
      logger.error('Error loading custom content data:', error);
    }
  }

  private async saveFormats(): Promise<void> {
    try {
      await fs.writeFile(
        this.customFormatsPath, 
        JSON.stringify(this.customFormats, null, 2),
        'utf8'
      );
      logger.info(`Saved ${this.customFormats.length} custom formats`);
    } catch (error) {
      logger.error('Error saving custom formats:', error);
      throw new Error('Failed to save custom formats');
    }
  }

  private async saveLegislation(): Promise<void> {
    try {
      await fs.writeFile(
        this.customLegislationPath, 
        JSON.stringify(this.customLegislation, null, 2),
        'utf8'
      );
      logger.info(`Saved ${this.customLegislation.length} custom legislation entries`);
    } catch (error) {
      logger.error('Error saving custom legislation:', error);
      throw new Error('Failed to save custom legislation');
    }
  }

  // Custom Formats Methods
  async getAllCustomFormats(countryCode?: string): Promise<CustomFormat[]> {
    if (countryCode) {
      return this.customFormats.filter(format => 
        format.countryCode.toLowerCase() === countryCode.toLowerCase()
      );
    }
    return [...this.customFormats];
  }

  async getCustomFormatById(id: string): Promise<CustomFormat | null> {
    return this.customFormats.find(format => format.id === id) || null;
  }

  async createCustomFormat(data: CreateCustomFormatRequest, createdBy?: string): Promise<CustomFormat> {
    const customFormat: CustomFormat = {
      id: uuidv4(),
      countryCode: data.countryCode.toUpperCase(),
      countryName: data.countryCode, // Will be resolved from countries data
      name: data.name,
      version: data.version,
      url: data.url,
      description: data.description,
      authority: data.authority,
      type: data.type,
      createdAt: new Date().toISOString(),
      createdBy,
      approved: !createdBy, // Auto-approve if no user system, require approval if user system
    };

    // Resolve country name
    try {
      const countriesData = await this.loadCountriesData();
      const country = countriesData.find((c: any) => 
        c.isoCode3?.toLowerCase() === data.countryCode.toLowerCase()
      );
      if (country) {
        customFormat.countryName = country.name;
      }
    } catch (error) {
      logger.warn('Could not resolve country name for custom format');
    }

    this.customFormats.push(customFormat);
    await this.saveFormats();

    logger.info(`Created custom format: ${customFormat.name} for ${customFormat.countryName}`);
    return customFormat;
  }

  async updateCustomFormat(
    id: string, 
    data: UpdateCustomFormatRequest,
    updatedBy?: string
  ): Promise<CustomFormat | null> {
    const index = this.customFormats.findIndex(format => format.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.customFormats[index];
    const updated: CustomFormat = {
      ...existing,
      ...data,
      id: existing.id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      countryCode: data.countryCode ? data.countryCode.toUpperCase() : existing.countryCode,
    };

    // Handle approval
    if (data.approved !== undefined && data.approved !== existing.approved) {
      updated.approved = data.approved;
      updated.approvedBy = updatedBy;
      updated.approvedAt = new Date().toISOString();
    }

    // Update country name if country code changed
    if (data.countryCode && data.countryCode !== existing.countryCode) {
      try {
        const countriesData = await this.loadCountriesData();
        const country = countriesData.find((c: any) => 
          c.isoCode3?.toLowerCase() === data.countryCode!.toLowerCase()
        );
        if (country) {
          updated.countryName = country.name;
        }
      } catch (error) {
        logger.warn('Could not resolve country name for updated custom format');
      }
    }

    this.customFormats[index] = updated;
    await this.saveFormats();

    logger.info(`Updated custom format: ${updated.name} for ${updated.countryName}`);
    return updated;
  }

  async deleteCustomFormat(id: string): Promise<boolean> {
    const index = this.customFormats.findIndex(format => format.id === id);
    if (index === -1) {
      return false;
    }

    const deleted = this.customFormats.splice(index, 1)[0];
    await this.saveFormats();

    logger.info(`Deleted custom format: ${deleted.name} for ${deleted.countryName}`);
    return true;
  }

  // Custom Legislation Methods
  async getAllCustomLegislation(countryCode?: string): Promise<CustomLegislation[]> {
    if (countryCode) {
      return this.customLegislation.filter(legislation => 
        legislation.countryCode.toLowerCase() === countryCode.toLowerCase()
      );
    }
    return [...this.customLegislation];
  }

  async getCustomLegislationById(id: string): Promise<CustomLegislation | null> {
    return this.customLegislation.find(legislation => legislation.id === id) || null;
  }

  async createCustomLegislation(
    data: CreateCustomLegislationRequest,
    createdBy?: string
  ): Promise<CustomLegislation> {
    const customLegislation: CustomLegislation = {
      id: uuidv4(),
      countryCode: data.countryCode.toUpperCase(),
      countryName: data.countryCode, // Will be resolved from countries data
      name: data.name,
      url: data.url,
      language: data.language,
      jurisdiction: data.jurisdiction,
      type: data.type,
      documentId: data.documentId,
      createdAt: new Date().toISOString(),
      createdBy,
      approved: !createdBy, // Auto-approve if no user system, require approval if user system
    };

    // Resolve country name
    try {
      const countriesData = await this.loadCountriesData();
      const country = countriesData.find((c: any) => 
        c.isoCode3?.toLowerCase() === data.countryCode.toLowerCase()
      );
      if (country) {
        customLegislation.countryName = country.name;
      }
    } catch (error) {
      logger.warn('Could not resolve country name for custom legislation');
    }

    this.customLegislation.push(customLegislation);
    await this.saveLegislation();

    logger.info(`Created custom legislation: ${customLegislation.name} for ${customLegislation.countryName}`);
    return customLegislation;
  }

  async updateCustomLegislation(
    id: string, 
    data: UpdateCustomLegislationRequest,
    updatedBy?: string
  ): Promise<CustomLegislation | null> {
    const index = this.customLegislation.findIndex(legislation => legislation.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.customLegislation[index];
    const updated: CustomLegislation = {
      ...existing,
      ...data,
      id: existing.id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      countryCode: data.countryCode ? data.countryCode.toUpperCase() : existing.countryCode,
    };

    // Handle approval
    if (data.approved !== undefined && data.approved !== existing.approved) {
      updated.approved = data.approved;
      updated.approvedBy = updatedBy;
      updated.approvedAt = new Date().toISOString();
    }

    // Update country name if country code changed
    if (data.countryCode && data.countryCode !== existing.countryCode) {
      try {
        const countriesData = await this.loadCountriesData();
        const country = countriesData.find((c: any) => 
          c.isoCode3?.toLowerCase() === data.countryCode!.toLowerCase()
        );
        if (country) {
          updated.countryName = country.name;
        }
      } catch (error) {
        logger.warn('Could not resolve country name for updated custom legislation');
      }
    }

    this.customLegislation[index] = updated;
    await this.saveLegislation();

    logger.info(`Updated custom legislation: ${updated.name} for ${updated.countryName}`);
    return updated;
  }

  async deleteCustomLegislation(id: string): Promise<boolean> {
    const index = this.customLegislation.findIndex(legislation => legislation.id === id);
    if (index === -1) {
      return false;
    }

    const deleted = this.customLegislation.splice(index, 1)[0];
    await this.saveLegislation();

    logger.info(`Deleted custom legislation: ${deleted.name} for ${deleted.countryName}`);
    return true;
  }

  // Helper method to load countries data for name resolution
  private async loadCountriesData(): Promise<any[]> {
    try {
      const countriesPath = path.join(__dirname, '..', '..', '..', 'src', 'data', 'countries.json');
      const countriesData = await fs.readFile(countriesPath, 'utf8');
      return JSON.parse(countriesData);
    } catch (error) {
      logger.warn('Could not load countries data for name resolution');
      return [];
    }
  }

  // Admin methods for approval workflow
  async getPendingApprovals(): Promise<{
    formats: CustomFormat[];
    legislation: CustomLegislation[];
  }> {
    return {
      formats: this.customFormats.filter(f => !f.approved),
      legislation: this.customLegislation.filter(l => !l.approved)
    };
  }

  async approveCustomFormat(id: string, approvedBy: string): Promise<CustomFormat | null> {
    return this.updateCustomFormat(id, { approved: true }, approvedBy);
  }

  async approveCustomLegislation(id: string, approvedBy: string): Promise<CustomLegislation | null> {
    return this.updateCustomLegislation(id, { approved: true }, approvedBy);
  }
}

// Singleton instance
export const customContentService = new CustomContentService();