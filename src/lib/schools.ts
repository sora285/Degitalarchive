export interface SchoolItem {
  id: number;
  slug: string;
  name: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.message || "APIエラーが発生しました。");
  }

  return data as T;
}

export async function fetchSchools(): Promise<SchoolItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/schools`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseResponse<{ schools: SchoolItem[] }>(response);
  return data.schools;
}

export async function fetchSchoolBySlug(schoolId: string): Promise<SchoolItem | null> {
  const schools = await fetchSchools();
  return schools.find((school) => school.slug === schoolId) || null;
}
