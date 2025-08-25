import { promises as fs } from 'fs';
import path from 'path';
import { CustomLink, CustomLinkRequest } from '../models/customLink';

class CustomLinkService {
  private dataDir = path.join(__dirname, '../data');
  private filePath = path.join(this.dataDir, 'custom-links.json');

  constructor() {
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Create empty file if it doesn't exist
      try {
        await fs.access(this.filePath);
      } catch {
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  private async readLinks(): Promise<CustomLink[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read custom links:', error);
      return [];
    }
  }

  private async writeLinks(links: CustomLink[]): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(links, null, 2));
    } catch (error) {
      console.error('Failed to write custom links:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getAllLinks(): Promise<CustomLink[]> {
    return this.readLinks();
  }

  async getLinksByCountry(countryCode: string): Promise<CustomLink[]> {
    const links = await this.readLinks();
    return links.filter(link => link.countryCode === countryCode && link.isActive);
  }

  async getCustomUrl(countryCode: string, originalUrl: string, linkType: string): Promise<string | null> {
    const links = await this.readLinks();
    const customLink = links.find(link => 
      link.countryCode === countryCode && 
      link.originalUrl === originalUrl && 
      link.linkType === linkType &&
      link.isActive
    );
    return customLink ? customLink.customUrl : null;
  }

  async createOrUpdateLink(request: CustomLinkRequest): Promise<CustomLink> {
    const links = await this.readLinks();
    const now = new Date().toISOString();
    
    // Check if link already exists for this country + original URL + type
    const existingIndex = links.findIndex(link => 
      link.countryCode === request.countryCode && 
      link.originalUrl === request.originalUrl &&
      link.linkType === request.linkType
    );

    let link: CustomLink;

    if (existingIndex >= 0) {
      // Update existing link
      link = {
        ...links[existingIndex],
        customUrl: request.customUrl,
        title: request.title,
        notes: request.notes,
        lastUpdated: now,
        isActive: true
      };
      links[existingIndex] = link;
    } else {
      // Create new link
      link = {
        id: this.generateId(),
        countryCode: request.countryCode,
        linkType: request.linkType,
        originalUrl: request.originalUrl,
        customUrl: request.customUrl,
        title: request.title,
        dateProvided: now,
        lastUpdated: now,
        notes: request.notes,
        isActive: true
      };
      links.push(link);
    }

    await this.writeLinks(links);
    return link;
  }

  async deleteLink(id: string): Promise<boolean> {
    const links = await this.readLinks();
    const index = links.findIndex(link => link.id === id);
    
    if (index >= 0) {
      links[index].isActive = false;
      links[index].lastUpdated = new Date().toISOString();
      await this.writeLinks(links);
      return true;
    }
    return false;
  }

  async shouldUseCustomLink(countryCode: string, originalUrl: string, linkType: string, lastUpdatedDate?: string): Promise<boolean> {
    const customLink = await this.getCustomUrl(countryCode, originalUrl, linkType);
    if (!customLink) return false;

    // If no update date provided, always use custom link
    if (!lastUpdatedDate) return true;

    // Find the custom link to get its date
    const links = await this.readLinks();
    const link = links.find(l => 
      l.countryCode === countryCode && 
      l.originalUrl === originalUrl && 
      l.linkType === linkType &&
      l.isActive
    );

    if (!link) return false;

    // Use custom link if it's newer than the last update
    return new Date(link.dateProvided) >= new Date(lastUpdatedDate);
  }
}

export const customLinkService = new CustomLinkService();