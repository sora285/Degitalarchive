export interface ImageLibraryItem {
  id: string;
  name: string;
  className: string;
  url: string;
  comment: string;
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

export async function fetchImageLibrary(schoolId: string): Promise<ImageLibraryItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/image-library?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await parseResponse<{ images: ImageLibraryItem[] }>(response);
  return data.images;
}
