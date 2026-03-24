export interface CompanyOption {
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

export async function fetchCompanies(schoolId: string): Promise<CompanyOption[]> {
  const response = await fetch(`${apiBaseUrl}/api/companies?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await parseResponse<{ companies: CompanyOption[] }>(response);
  return data.companies;
}

export async function deleteCompany(schoolId: string, companyId: string): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/companies/${encodeURIComponent(companyId)}?schoolId=${encodeURIComponent(schoolId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  await parseResponse<{ success: true }>(response);
}

export async function createCompany(schoolId: string, label: string): Promise<CompanyOption> {
  const response = await fetch(`${apiBaseUrl}/api/companies?schoolId=${encodeURIComponent(schoolId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label }),
  });

  const data = await parseResponse<{ company: CompanyOption }>(response);
  return data.company;
}
