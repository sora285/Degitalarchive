export interface CategoryOption {
  id: string;
  label: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = {};
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

export async function fetchCategories(schoolId: string): Promise<CategoryOption[]> {
  const response = await fetch(`${apiBaseUrl}/api/categories?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await parseResponse<{ categories: CategoryOption[] }>(response);
  return data.categories;
}

export async function createCategory(schoolId: string, label: string): Promise<CategoryOption> {
  const response = await fetch(`${apiBaseUrl}/api/categories?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label }),
  });

  const data = await parseResponse<{ category: CategoryOption }>(response);
  return data.category;
}
