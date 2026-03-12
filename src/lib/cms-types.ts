/**
 * Strapi API レスポンス用の型定義（Payload 互換のフィールド名を維持）
 */

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  name?: string;
  width?: number;
  height?: number;
}

export interface StrapiSetting {
  id: number;
  site_title?: string | null;
  site_description?: string | null;
  site_logo?: StrapiMedia | null;
}

export interface StrapiGame {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_image?: StrapiMedia | null;
  createdAt: string;
  updatedAt: string;
}

/** Strapi Users & Permissions の User（作者として利用。name/avatar 等は register で拡張） */
export interface StrapiUser {
  id: number;
  username: string;
  email?: string | null;
  name?: string | null;
  avatar?: StrapiMedia | null;
  is_staff?: boolean;
  staff_title?: string | null;
  bio?: string | null;
  social_links?: { platform?: string; url?: string }[];
  playing_games?: { game: StrapiGame; skill_level?: string; impression?: string; recruitment?: string }[];
  finished_games?: { game: StrapiGame; skill_level?: string; impression?: string; recruitment?: string }[];
  createdAt: string;
  updatedAt: string;
}

/** 互換用エイリアス（作者 = User） */
export type StrapiAuthor = StrapiUser;

export interface StrapiPost {
  id: number;
  documentId?: string;
  title: string;
  slug?: string | null;
  content?: string | null;
  author?: StrapiUser | null;
  published_date?: string | null;
  category: string;
  tags?: { tag?: string }[] | null;
  image?: StrapiMedia | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiAnnouncement {
  id: number;
  documentId?: string;
  title: string;
  content?: string | null;
  published_date?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiGameServer {
  id: number;
  documentId?: string;
  name: string;
  type: 'minecraft' | 'web' | 'other';
  ip: string;
  port: number;
  protocol?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
