import { pool } from '../config/db.js';

function keyOf(value) {
  return String(value);
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const sdgQueryCandidates = [
  `SELECT
    asg.activity_id,
    s.id AS sdg_id,
    s.name AS sdg_name,
    s.image AS sdg_image
  FROM activity_sdgs asg
  INNER JOIN sdgs s ON s.id = asg.sdg_id
  WHERE asg.activity_id IN (?)
  ORDER BY asg.id ASC`,
  `SELECT
    asg.activity_id,
    s.id AS sdg_id,
    s.name AS sdg_name,
    s.icon_path AS sdg_image
  FROM activity_sdgs asg
  INNER JOIN sdgs s ON s.id = asg.sdg_id
  WHERE asg.activity_id IN (?)
  ORDER BY asg.id ASC`,
  'SELECT activity_id, sdg_id FROM activity_sdgs WHERE activity_id IN (?) ORDER BY id ASC',
  'SELECT activity_id, goal_id AS sdg_id FROM activity_sdgs WHERE activity_id IN (?) ORDER BY id ASC',
];

const companyQueryCandidates = [
  `SELECT
    ac.activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.article_id AS activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.activity_id,
    c.name AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.companies_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.article_id AS activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.companies_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
];

const categoryQueryCandidates = [
  `SELECT
    ac.activity_id,
    c.name AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.article_id AS activity_id,
    c.name AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.activity_id,
    c.contents AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  `SELECT
    ac.article_id AS activity_id,
    c.contents AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
];

function formatSdgLabel(sdgId) {
  const num = Number(sdgId);
  if (!Number.isFinite(num)) {
    return '';
  }
  return `${num}. SDGs`;
}

async function getActivityPhotoMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  const [rows] = await pool.query(
    `SELECT activity_id, url
     FROM activity_images
     WHERE activity_id IN (?)
     ORDER BY id DESC`,
    [activityIds]
  );

  const photoMap = new Map();
  for (const row of rows) {
    const activityKey = keyOf(row.activity_id);
    if (!photoMap.has(activityKey) && row.url) {
      photoMap.set(activityKey, row.url);
    }
  }

  return photoMap;
}

async function getActivitySdgsMap(activityIds) {
  if (!activityIds.length) {
    return { sdgMap: new Map(), sdgItemsMap: new Map() };
  }

  for (const query of sdgQueryCandidates) {
    try {
      const [rows] = await pool.query(query, [activityIds]);
      const sdgMap = new Map();
      const sdgItemsMap = new Map();
      for (const row of rows) {
        const label = formatSdgLabel(row.sdg_id);
        if (!label) continue;
        const activityKey = keyOf(row.activity_id);

        if (!sdgMap.has(activityKey)) {
          sdgMap.set(activityKey, []);
        }
        sdgMap.get(activityKey).push(label);

        if (!sdgItemsMap.has(activityKey)) {
          sdgItemsMap.set(activityKey, []);
        }
        sdgItemsMap.get(activityKey).push({
          id: Number(row.sdg_id),
          label: row.sdg_name ? `${Number(row.sdg_id)}. ${row.sdg_name}` : label,
          imageUrl: row.sdg_image || '',
        });
      }
      return { sdgMap, sdgItemsMap };
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_FIELD_ERROR') {
        continue;
      }
      throw error;
    }
  }

  return { sdgMap: new Map(), sdgItemsMap: new Map() };
}

async function getActivityCompaniesMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  for (const query of companyQueryCandidates) {
    try {
      const [rows] = await pool.query(query, [activityIds]);
      if (!rows.length) {
        continue;
      }
      const companyMap = new Map();
      for (const row of rows) {
        if (!row.company_name) continue;
        const activityKey = keyOf(row.activity_id);
        if (!companyMap.has(activityKey)) {
          companyMap.set(activityKey, []);
        }
        companyMap.get(activityKey).push(String(row.company_name));
      }
      if (!companyMap.size) {
        continue;
      }
      return companyMap;
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_FIELD_ERROR') {
        continue;
      }
      throw error;
    }
  }

  return new Map();
}

async function getActivityCategoriesMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  for (const query of categoryQueryCandidates) {
    try {
      const [rows] = await pool.query(query, [activityIds]);
      if (!rows.length) {
        continue;
      }

      const categoryMap = new Map();
      for (const row of rows) {
        if (!row.category_name) continue;
        const activityKey = keyOf(row.activity_id);
        if (!categoryMap.has(activityKey)) {
          categoryMap.set(activityKey, []);
        }
        categoryMap.get(activityKey).push(String(row.category_name));
      }

      if (!categoryMap.size) {
        continue;
      }

      return categoryMap;
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_FIELD_ERROR') {
        continue;
      }
      throw error;
    }
  }

  return new Map();
}

function rowToArticle(row, imageUrl = null, sdgs = null, sdgItems = null, companyNames = null, categoryNames = null) {
  const names = companyNames || [];
  const categories = categoryNames || [];
  return {
    id: Number(row.id),
    title: row.title || '',
    content: row.content || '',
    sdgs: sdgs || parseJsonArray(row.sdgs),
    sdgItems: sdgItems || [],
    category: categories.length ? categories.join(' / ') : (row.category || ''),
    grade: row.grade || '',
    tags: parseJsonArray(row.tags),
    company: names.length ? names.join(' / ') : (row.company || ''),
    companyNames: names,
    date: row.date || '',
    imageUrl: imageUrl || '',
    location: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
      name: row.location_name || '',
    },
  };
}

export async function listArticlesBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.name AS title,
      a.contents AS content,
      NULL AS sdgs,
      NULL AS category,
      a.grade,
      NULL AS tags,
      NULL AS company,
      DATE_FORMAT(
        COALESCE(
          a.activity_date,
          STR_TO_DATE(CONCAT(a.activited_at, '-01'), '%Y-%m-%d'),
          DATE(a.created_at)
        ),
        '%Y/%m/%d'
      ) AS date,
      a.location_name,
      a.latitude,
      a.longitude
    FROM activities a
    INNER JOIN schools s ON s.id = a.school_id
    WHERE s.slug = ?
      AND a.deleted_at IS NULL
      AND (a.status = 'published' OR a.status = 'draft')
    ORDER BY COALESCE(
      a.activity_date,
      STR_TO_DATE(CONCAT(a.activited_at, '-01'), '%Y-%m-%d'),
      DATE(a.created_at)
    ) DESC, a.id DESC`,
    [schoolId]
  );

  const ids = rows.map((row) => row.id);
  const [photoMap, sdgBundle, companyMap, categoryMap] = await Promise.all([
    getActivityPhotoMap(ids),
    getActivitySdgsMap(ids),
    getActivityCompaniesMap(ids),
    getActivityCategoriesMap(ids),
  ]);
  const { sdgMap, sdgItemsMap } = sdgBundle;

  return rows.map((row) =>
    rowToArticle(
      row,
      photoMap.get(keyOf(row.id)),
      sdgMap.get(keyOf(row.id)) || [],
      sdgItemsMap.get(keyOf(row.id)) || [],
      companyMap.get(keyOf(row.id)) || [],
      categoryMap.get(keyOf(row.id)) || []
    )
  );
}

export async function getArticleById({ schoolId, articleId }) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.name AS title,
      a.contents AS content,
      NULL AS sdgs,
      NULL AS category,
      a.grade,
      NULL AS tags,
      NULL AS company,
      DATE_FORMAT(
        COALESCE(
          a.activity_date,
          STR_TO_DATE(CONCAT(a.activited_at, '-01'), '%Y-%m-%d'),
          DATE(a.created_at)
        ),
        '%Y/%m/%d'
      ) AS date,
      a.location_name,
      a.latitude,
      a.longitude
    FROM activities a
    INNER JOIN schools s ON s.id = a.school_id
    WHERE s.slug = ? AND a.id = ?
      AND a.deleted_at IS NULL
    LIMIT 1`,
    [schoolId, articleId]
  );

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  const [photoMap, sdgBundle, companyMap, categoryMap] = await Promise.all([
    getActivityPhotoMap([row.id]),
    getActivitySdgsMap([row.id]),
    getActivityCompaniesMap([row.id]),
    getActivityCategoriesMap([row.id]),
  ]);
  const { sdgMap, sdgItemsMap } = sdgBundle;
  return rowToArticle(
    row,
    photoMap.get(keyOf(row.id)),
    sdgMap.get(keyOf(row.id)) || [],
    sdgItemsMap.get(keyOf(row.id)) || [],
    companyMap.get(keyOf(row.id)) || [],
    categoryMap.get(keyOf(row.id)) || []
  );
}

export async function getArticleImageById({ schoolId, articleId }) {
  const [rows] = await pool.execute(
    `SELECT ai.url
     FROM activities a
     INNER JOIN schools s ON s.id = a.school_id
     INNER JOIN activity_images ai ON ai.activity_id = a.id
     WHERE s.slug = ? AND a.id = ?
       AND a.deleted_at IS NULL
     ORDER BY ai.id DESC
     LIMIT 1`,
    [schoolId, articleId]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0].url || null;
}
