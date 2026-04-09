export interface ClassOption {
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

export async function fetchClasses(schoolId: string): Promise<ClassOption[]> {
  const response = await fetch(`${apiBaseUrl}/api/classes?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await parseResponse<{ classes: ClassOption[] }>(response);
  return data.classes;
}
