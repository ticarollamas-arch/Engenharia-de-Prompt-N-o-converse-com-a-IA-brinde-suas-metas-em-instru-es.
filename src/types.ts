/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  profession: string;
  role: 'user' | 'admin';
  tier: 'free' | 'premium' | 'expert';
  createdAt: string;
}

export interface PromptMetadata {
  niche: string;
  profession: string;
  task: string;
  detailLevel: string;
  outputFormat: string;
  tone: string;
  tokensCount?: number;
}

export interface PromptHistoryItem {
  id: string;
  userId: string;
  niche: string;
  profession: string;
  task: string;
  detailLevel: string;
  outputFormat: string;
  tone: string;
  prompt: string;
  createdAt: string;
  favorited: boolean;
  rating?: number;
}

export interface CustomTemplate {
  id: string;
  userId: string;
  name: string;
  niche: string;
  profession: string;
  sections: string[];
}

export interface Category {
  name: string;
  icon: string;
  description: string;
  professions: string[];
}

export interface GlobalConfig {
  siteName: string;
  monthlyCheckoutUrl: string;
  annualCheckoutUrl: string;
  address: string;
  phone: string;
}

