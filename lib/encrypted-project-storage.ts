import { EncryptionService } from './encryption';

// Browser-compatible encrypted project storage using localStorage
export interface EncryptedProjectData {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  encryptedPath: string; // Storage key identifier
}

export class EncryptedProjectStorage {
  private static readonly STORAGE_PREFIX = 'lora_encrypted_projects_';
  private static readonly METADATA_PREFIX = 'lora_project_metadata_';

  /**
   * Generate a unique project ID
   */
  private static generateProjectId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save project data with encryption to localStorage
   */
  static async saveProject(
    userId: string,
    projectId: string,
    projectData: Omit<EncryptedProjectData, 'encryptedPath'>,
    password: string
  ): Promise<EncryptedProjectData> {
    try {
      // Convert project data to JSON string
      const jsonData = JSON.stringify(projectData);

      // Encrypt the project data
      const encryptedData = await EncryptionService.encrypt(jsonData, password);

      // Generate storage key
      const storageKey = this.STORAGE_PREFIX + projectId;
      const metadataKey = this.METADATA_PREFIX + projectId;

      // Store encrypted data
      localStorage.setItem(storageKey, encryptedData);

      // Store metadata
      const fullMetadata: EncryptedProjectData = {
        ...projectData,
        encryptedPath: projectId // Use projectId as the path identifier
      };
      localStorage.setItem(metadataKey, JSON.stringify(fullMetadata));

      return fullMetadata;
    } catch (error) {
      console.error('Failed to save encrypted project:', error);
      throw new Error('Failed to save project securely');
    }
  }

  /**
   * Load and decrypt project data from localStorage
   */
  static async loadProject(
    encryptedPath: string,
    password: string
  ): Promise<EncryptedProjectData> {
    try {
      const storageKey = this.STORAGE_PREFIX + encryptedPath;
      const encryptedData = localStorage.getItem(storageKey);

      if (!encryptedData) {
        throw new Error('Project not found');
      }

      // Decrypt the data
      const decryptedJson = await EncryptionService.decrypt(encryptedData, password);

      // Parse back to project data
      return JSON.parse(decryptedJson);
    } catch (error) {
      console.error('Failed to load encrypted project:', error);
      throw new Error('Failed to load project - invalid password or corrupted data');
    }
  }

  /**
   * Update project data (re-encrypt with new data)
   */
  static async updateProject(
    encryptedPath: string,
    updatedData: Partial<EncryptedProjectData>,
    password: string
  ): Promise<EncryptedProjectData> {
    try {
      // Load existing project
      const existingProject = await this.loadProject(encryptedPath, password);

      // Merge with updates
      const updatedProject = {
        ...existingProject,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // Delete old encrypted file
      await this.deleteProject(encryptedPath);

      // Save updated project with new encryption
      const newEncryptedFilename = this.generateProjectId();
      const newStorageKey = this.STORAGE_PREFIX + newEncryptedFilename;
      const newMetadataKey = this.METADATA_PREFIX + newEncryptedFilename;

      const jsonData = JSON.stringify(updatedProject);
      const encryptedData = await EncryptionService.encrypt(jsonData, password);

      localStorage.setItem(newStorageKey, encryptedData);
      localStorage.setItem(newMetadataKey, JSON.stringify({
        ...updatedProject,
        encryptedPath: newEncryptedFilename
      }));

      return {
        ...updatedProject,
        encryptedPath: newEncryptedFilename
      };
    } catch (error) {
      console.error('Failed to update encrypted project:', error);
      throw new Error('Failed to update project securely');
    }
  }

  /**
   * Delete an encrypted project from localStorage
   */
  static async deleteProject(encryptedPath: string): Promise<void> {
    try {
      const storageKey = this.STORAGE_PREFIX + encryptedPath;
      const metadataKey = this.METADATA_PREFIX + encryptedPath;

      localStorage.removeItem(storageKey);
      localStorage.removeItem(metadataKey);
    } catch (error) {
      console.warn('Failed to delete encrypted project:', error);
    }
  }

  /**
   * Check if a project exists in localStorage
   */
  static async projectExists(encryptedPath: string): Promise<boolean> {
    const storageKey = this.STORAGE_PREFIX + encryptedPath;
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Get project metadata from localStorage
   */
  static getProjectMetadata(encryptedPath: string): EncryptedProjectData | null {
    try {
      const metadataKey = this.METADATA_PREFIX + encryptedPath;
      const metadataJson = localStorage.getItem(metadataKey);
      return metadataJson ? JSON.parse(metadataJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get all projects for a user from localStorage
   */
  static getUserProjects(userId: string): EncryptedProjectData[] {
    const projects: EncryptedProjectData[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.METADATA_PREFIX)) {
        try {
          const metadata: EncryptedProjectData = JSON.parse(localStorage.getItem(key)!);
          if (metadata.userId === userId) {
            projects.push(metadata);
          }
        } catch {
          // Skip invalid metadata
        }
      }
    }

    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get total project storage usage for a user
   */
  static async getUserProjectStorageUsage(userId: string): Promise<number> {
    const userProjects = this.getUserProjects(userId);
    let totalSize = 0;

    for (const project of userProjects) {
      // Estimate size based on JSON string length
      const jsonSize = JSON.stringify(project).length;
      totalSize += jsonSize;
    }

    return totalSize;
  }
}