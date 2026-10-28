export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: number;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  email: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  website_url: string;
  resume_url: string;
  skills: string[]; // JSON parsed
  education: EducationEntry[];
  certificates: Certificate[];
  updated_at?: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
  details: string;
}

export interface Certificate {
  title: string;
  issuer: string;
  year: string;
  description: string;
  credential_url: string;
}

export interface Project {
  id: number;
  title: string;
  short_description: string;
  detailed_description: string;
  tech_stack: string[]; // JSON parsed
  image_url: string;
  live_demo_url: string;
  github_url: string;
  is_published: boolean; // converted from 0/1
  is_featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  subject?: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  totalMessages: number;
  unreadMessages: number;
  profileStatus: {
    isConfigured: boolean;
    name: string;
    title: string;
    skillsCount: number;
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export type ThemeId = 'aurora' | 'cyberpunk' | 'neon-matrix' | 'electric-candy' | 'clean-vibrant';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  accentGradient: string;
  cardBg: string;
  bodyBg: string;
  textPrimary: string;
  textSecondary: string;
  orb1Color: string;
  orb2Color: string;
  orb3Color: string;
  glowColor: string;
}
