/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, PromptHistoryItem, CustomTemplate } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'data-store.json');

interface GlobalConfig {
  siteName: string;
  monthlyCheckoutUrl: string;
  annualCheckoutUrl: string;
  address: string;
  phone: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  tokenJti: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
}

interface Schema {
  users: Array<User & { 
    passwordHash: string; 
    registrationIp?: string; 
    registrationIpHash?: string; 
  }>;
  prompts: PromptHistoryItem[];
  templates: CustomTemplate[];
  globalConfig?: GlobalConfig;
  activeSessions?: ActiveSession[];
}

function initializeDb(): Schema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      let modified = false;
      if (!loaded.globalConfig) {
        loaded.globalConfig = {
          siteName: "Cyber Hunt Lab",
          monthlyCheckoutUrl: "https://pay.hotmart.com/mock-monthly",
          annualCheckoutUrl: "https://pay.hotmart.com/mock-annual",
          address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
          phone: "+55 (11) 99999-8888"
        };
        modified = true;
      }
      if (!loaded.users) {
        loaded.users = [];
        modified = true;
      }
      if (!loaded.prompts) {
        loaded.prompts = [];
        modified = true;
      }
      if (!loaded.templates) {
        loaded.templates = [];
        modified = true;
      }
      if (!loaded.activeSessions) {
        loaded.activeSessions = [];
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(loaded, null, 2), 'utf-8');
      }
      return loaded;
    }
  } catch (err) {
    console.error('Falha ao carregar data-store.json, criando novo de backup:', err);
  }

  const defaultData: Schema = {
    users: [],
    prompts: [],
    templates: [],
    activeSessions: [],
    globalConfig: {
      siteName: "Cyber Hunt Lab",
      monthlyCheckoutUrl: "https://pay.hotmart.com/mock-monthly",
      annualCheckoutUrl: "https://pay.hotmart.com/mock-annual",
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
      phone: "+55 (11) 99999-8888"
    }
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Falha ao inicializar o banco de dados local:', err);
  }

  return defaultData;
}

let db = initializeDb();

function saveDb() {
  try {
    const backupFile = DB_FILE + '.tmp';
    fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf-8');
    try {
      fs.renameSync(backupFile, DB_FILE);
    } catch (renameErr) {
      // Dual-write fallback in case the filesystem restricts renameSync operations
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      if (fs.existsSync(backupFile)) {
        try {
          fs.unlinkSync(backupFile);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Erro ao persistir banco de dados local:', err);
  }
}

export function hashPassword(password: string): string {
  const salt = 'promptforge_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export const dbService = {
  getUsers() {
    return db.users;
  },

  getUserByEmail(email: string) {
    if (!email) return undefined;
    const targetEmail = String(email).toLowerCase();
    return db.users.find(u => u && u.email && String(u.email).toLowerCase() === targetEmail);
  },

  getUserById(id: string) {
    if (!id) return undefined;
    return db.users.find(u => u && u.id === id);
  },

  addUser(email: string, passwordHash: string, name: string, profession: string, role: 'user' | 'admin' = 'user', registrationIp?: string) {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('E-mail já registrado.');
    }

    const registrationIpHash = registrationIp 
      ? crypto.createHash('sha256').update(registrationIp).digest('hex') 
      : undefined;

    const newUser: User & { passwordHash: string; registrationIp?: string; registrationIpHash?: string } = {
      id: crypto.randomUUID(),
      email,
      name,
      profession,
      role,
      tier: 'free',
      createdAt: new Date().toISOString(),
      passwordHash,
      registrationIp,
      registrationIpHash
    };

    db.users.push(newUser);
    saveDb();

    // Clean user object for client
    const { passwordHash: _, ...cleanUser } = newUser;
    return cleanUser;
  },

  hasRegistrationFromIpIn24h(ip: string): boolean {
    if (!ip || ip === "127.0.0.1" || ip === "::1") return false;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return db.users.some(u => u && u.registrationIp === ip && u.createdAt && u.createdAt > oneDayAgo);
  },

  getActiveSessions() {
    if (!db.activeSessions) db.activeSessions = [];
    return db.activeSessions;
  },

  addSession(userId: string, tokenJti: string, ipAddress: string) {
    if (!db.activeSessions) db.activeSessions = [];
    
    const newSession: ActiveSession = {
      id: crypto.randomUUID(),
      userId,
      tokenJti,
      ipAddress,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    db.activeSessions.push(newSession);
    saveDb();
    return newSession;
  },

  getSession(tokenJti: string, userId: string) {
    if (!db.activeSessions) db.activeSessions = [];
    return db.activeSessions.find(s => s.tokenJti === tokenJti && s.userId === userId);
  },

  updateSessionActivity(tokenJti: string) {
    if (!db.activeSessions) db.activeSessions = [];
    const session = db.activeSessions.find(s => s.tokenJti === tokenJti);
    if (session) {
      session.lastActivity = new Date().toISOString();
      saveDb();
    }
  },

  deleteSession(tokenJti: string) {
    if (!db.activeSessions) db.activeSessions = [];
    const idx = db.activeSessions.findIndex(s => s.tokenJti === tokenJti);
    if (idx !== -1) {
      db.activeSessions.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  deleteUserSessions(userId: string) {
    if (!db.activeSessions) db.activeSessions = [];
    const initialLength = db.activeSessions.length;
    db.activeSessions = db.activeSessions.filter(s => s.userId !== userId);
    if (db.activeSessions.length !== initialLength) {
      saveDb();
    }
  },

  updateUserTier(userId: string, tier: 'free' | 'premium' | 'expert') {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.tier = tier;
      saveDb();
      const { passwordHash: _, ...cleanUser } = user;
      return cleanUser;
    }
    return null;
  },

  getPrompts(userId: string) {
    // Filter by user ID. Admins can see all if they want, but let's default to user's history
    return db.prompts
      .filter(p => p && p.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt || "";
        const dateB = b.createdAt || "";
        return dateB.localeCompare(dateA);
      });
  },

  addPrompt(userId: string, niche: string, profession: string, task: string, detailLevel: string, outputFormat: string, tone: string, prompt: string) {
    const newPrompt: PromptHistoryItem = {
      id: crypto.randomUUID(),
      userId,
      niche,
      profession,
      task,
      detailLevel,
      outputFormat,
      tone,
      prompt,
      createdAt: new Date().toISOString(),
      favorited: false
    };

    db.prompts.push(newPrompt);
    saveDb();
    return newPrompt;
  },

  toggleFavoritePrompt(promptId: string, userId: string) {
    const prompt = db.prompts.find(p => p.id === promptId && p.userId === userId);
    if (!prompt) {
      throw new Error('Prompt não encontrado ou sem autorização.');
    }
    prompt.favorited = !prompt.favorited;
    saveDb();
    return prompt;
  },

  ratePrompt(promptId: string, rating: number, userId: string) {
    const prompt = db.prompts.find(p => p.id === promptId && p.userId === userId);
    if (!prompt) {
      throw new Error('Prompt não encontrado ou sem autorização.');
    }
    prompt.rating = rating;
    saveDb();
    return prompt;
  },

  deletePrompt(promptId: string, userId: string) {
    const index = db.prompts.findIndex(p => p.id === promptId && p.userId === userId);
    if (index === -1) {
      throw new Error('Prompt não encontrado ou sem autorização.');
    }
    db.prompts.splice(index, 1);
    saveDb();
    return true;
  },

  getTemplates(userId: string) {
    // Return custom user templates
    return db.templates.filter(t => t.userId === userId);
  },

  addTemplate(userId: string, name: string, niche: string, profession: string, sections: string[]) {
    const newTemplate: CustomTemplate = {
      id: crypto.randomUUID(),
      userId,
      name,
      niche,
      profession,
      sections
    };
    db.templates.push(newTemplate);
    saveDb();
    return newTemplate;
  },

  deleteTemplate(templateId: string, userId: string) {
    const index = db.templates.findIndex(t => t.id === templateId && t.userId === userId);
    if (index === -1) {
      throw new Error('Template não encontrado ou sem autorização.');
    }
    db.templates.splice(index, 1);
    saveDb();
    return true;
  },

  getGlobalConfig() {
    if (!db.globalConfig) {
      db.globalConfig = {
        siteName: "Cyber Hunt Lab",
        monthlyCheckoutUrl: "https://pay.hotmart.com/mock-monthly",
        annualCheckoutUrl: "https://pay.hotmart.com/mock-annual",
        address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
        phone: "+55 (11) 99999-8888"
      };
      saveDb();
    }
    return db.globalConfig;
  },

  updateGlobalConfig(update: Partial<GlobalConfig>) {
    const current = this.getGlobalConfig();
    db.globalConfig = {
      ...current,
      ...update
    };
    saveDb();
    return db.globalConfig;
  }
};
