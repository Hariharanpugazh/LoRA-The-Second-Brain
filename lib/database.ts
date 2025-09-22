import Dexie, { Table } from 'dexie';

export interface User {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: any[]; // CoreMessage[] from ai package
  model: string;
  createdAt: string;
  updatedAt: string;
}

export class LoRADatabase extends Dexie {
  users!: Table<User>;
  conversations!: Table<Conversation>;

  constructor() {
    super('LoRADatabase');

    this.version(1).stores({
      users: 'id, name, createdAt',
      conversations: 'id, userId, title, createdAt, updatedAt'
    });
  }
}

export const db = new LoRADatabase();

// Database operations
export class DatabaseService {
  // User operations
  static async createUser(name: string, password: string): Promise<User | null> {
    try {
      const existingUser = await db.users.where('name').equalsIgnoreCase(name).first();
      if (existingUser) {
        return null; // User already exists
      }

      const user: User = {
        id: Date.now().toString(),
        name: name.trim(),
        password: password.trim(),
        createdAt: new Date().toISOString()
      };

      await db.users.add(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      return await db.users.toArray();
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    try {
      return await db.users.get(id);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  static async getUserByName(name: string): Promise<User | undefined> {
    try {
      return await db.users.where('name').equalsIgnoreCase(name).first();
    } catch (error) {
      console.error('Error getting user by name:', error);
      return undefined;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      await db.users.update(id, updates);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await db.users.delete(id);
      // Also delete all conversations for this user
      await db.conversations.where('userId').equals(id).delete();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  // Conversation operations
  static async createConversation(userId: string, title: string, messages: any[], model: string): Promise<Conversation | null> {
    try {
      const conversation: Conversation = {
        id: Date.now().toString(),
        userId,
        title,
        messages,
        model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.conversations.add(conversation);
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  static async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    try {
      return await db.conversations.where('userId').equals(userId).reverse().sortBy('updatedAt');
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  static async getConversationById(id: string): Promise<Conversation | undefined> {
    try {
      return await db.conversations.get(id);
    } catch (error) {
      console.error('Error getting conversation:', error);
      return undefined;
    }
  }

  static async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    try {
      await db.conversations.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  static async deleteConversation(id: string): Promise<void> {
    try {
      await db.conversations.delete(id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  // Utility methods
  static async clearAllData(): Promise<void> {
    try {
      await db.users.clear();
      await db.conversations.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  static async exportData(): Promise<{ users: User[], conversations: Conversation[] }> {
    try {
      const users = await db.users.toArray();
      const conversations = await db.conversations.toArray();
      return { users, conversations };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { users: [], conversations: [] };
    }
  }

  static async importData(data: { users: User[], conversations: Conversation[] }): Promise<void> {
    try {
      await db.users.bulkAdd(data.users);
      await db.conversations.bulkAdd(data.conversations);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }
}