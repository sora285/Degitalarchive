export interface ArticleData {
  id: number;
  authorUserId?: number | null;
  isChildActivity?: boolean;
  isParentActivity?: boolean;
  parentActivityId?: number | null;
  childActivityIds?: number[];
  parentArticle?: ArticleData | null;
  childArticles?: ArticleData[];
  title: string;
  content: string;
  status?: 'draft' | 'published' | 'archived' | string;
  sdgs: string[];
  sdgIds?: number[];
  category: string;
  categoryIds?: number[];
  grade: string;
  tags: string[];
  company?: string;
  companyNames?: string[];
  companyIds?: number[];
  date: string;
  imageUrl?: string;
  imageUrls?: string[];
  sdgItems?: Array<{
    id: number;
    label: string;
    imageUrl?: string;
  }>;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

export interface CreateArticleInput {
  schoolId: string;
  userId: number;
  status: 'draft' | 'published';
  title: string;
  content: string;
  grade: string;
  locationName: string;
  latitude: string;
  longitude: string;
  sdgIds: string[];
  categoryIds: string[];
  companyIds: string[];
  libraryImageUrls: string[];
  uploadedImages: string[];
  parentActivityId?: number | null;
  childActivityIds?: number[];
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const fallbackArticles: ArticleData[] = [
  {
    id: 1,
    title: 'みなとみらいの環境保護活動',
    content: '地域清掃活動を通して海洋ごみ問題について学習しました。',
    sdgs: ['13. 気候変動に具体的な対策を', '11. 住み続けられるまちづくりを'],
    category: '環境',
    grade: '6年1組',
    tags: ['みなとみらい', '環境保護'],
    company: '企業A',
    date: '2024/01/15',
    location: { lat: 35.4593, lng: 139.6317, name: '横浜ランドマークタワー' },
  },
  {
    id: 2,
    title: 'SDGsを学ぶ地域貢献プロジェクト',
    content: '地域の方へのヒアリングで課題整理を行い、提案をまとめました。',
    sdgs: ['11. 住み続けられるまちづくりを', '4. 質の高い教育をみんなに'],
    category: '地域活動',
    grade: '6年2組',
    tags: ['SDGs', '地域貢献'],
    company: '企業B',
    date: '2024/01/18',
    location: { lat: 35.4537, lng: 139.638, name: 'パシフィコ横浜' },
  },
];

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.message || 'APIエラーが発生しました。');
  }

  return data as T;
}

export async function fetchArticles(schoolId: string): Promise<ArticleData[]> {
  const response = await fetch(
    `${apiBaseUrl}/api/articles?schoolId=${encodeURIComponent(schoolId)}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const data = await parseResponse<{ articles: ArticleData[] }>(response);
  return data.articles;
}

export async function fetchArticleById(schoolId: string, articleId: number): Promise<ArticleData> {
  const response = await fetch(
    `${apiBaseUrl}/api/articles/${articleId}?schoolId=${encodeURIComponent(schoolId)}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const data = await parseResponse<{ article: ArticleData }>(response);
  return data.article;
}

export async function createArticle(input: CreateArticleInput): Promise<ArticleData> {
  const response = await fetch(`${apiBaseUrl}/api/articles`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await parseResponse<{ article: ArticleData }>(response);
  return data.article;
}

export async function updateArticle(articleId: number, input: CreateArticleInput): Promise<ArticleData> {
  const response = await fetch(`${apiBaseUrl}/api/articles/${articleId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await parseResponse<{ article: ArticleData }>(response);
  return data.article;
}

export async function deleteArticle(schoolId: string, articleId: number): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/articles/${articleId}?schoolId=${encodeURIComponent(schoolId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  await parseResponse<{}>(response);
}
