/* noinspection SqlDialectInspection,SqlNoDataSourceInspection,JSCheckFunctionSignatures,ExceptionCaughtLocallyJS */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const s3Client = new S3Client({
  region: env.s3.region,
  credentials:
    env.s3.accessKeyId && env.s3.secretAccessKey
      ? {
          accessKeyId: env.s3.accessKeyId,
          secretAccessKey: env.s3.secretAccessKey,
        }
      : undefined,
});

const CURRENT_FISCAL_YEAR_OVERRIDE = 2025;
const CURRENT_FISCAL_YEAR_OVERRIDE_START = new Date('2026-04-01T00:00:00+09:00');

function keyOf(value) {
  return String(value);
}

function getFiscalYearFromDate(date) {
  const year = date.getFullYear();
  return date.getMonth() >= 3 ? year : year - 1;
}

function getCurrentOperationalFiscalYear(now = new Date()) {
  if (now >= CURRENT_FISCAL_YEAR_OVERRIDE_START) {
    return CURRENT_FISCAL_YEAR_OVERRIDE;
  }

  return getFiscalYearFromDate(now);
}

function getPostingDateForFiscalYear(now = new Date()) {
  const fiscalYear = getCurrentOperationalFiscalYear(now);
  return new Date(Date.UTC(fiscalYear, 3, 1, 0, 0, 0));
}

function formatFiscalYearLabel(fiscalYear) {
  const normalizedYear = Number(fiscalYear);
  return Number.isFinite(normalizedYear) ? `${normalizedYear}年度` : '';
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
  /* language=MySQL */
  `SELECT
    asg.activity_id,
    s.id AS sdg_id,
    s.name AS sdg_name,
    s.image AS sdg_image
  FROM activity_sdgs asg
  INNER JOIN sdgs s ON s.id = asg.sdg_id
  WHERE asg.activity_id IN (?)
  ORDER BY asg.id ASC`,
  /* language=MySQL */
  `SELECT
    asg.activity_id,
    s.id AS sdg_id,
    s.name AS sdg_name,
    s.icon_path AS sdg_image
  FROM activity_sdgs asg
  INNER JOIN sdgs s ON s.id = asg.sdg_id
  WHERE asg.activity_id IN (?)
  ORDER BY asg.id ASC`,
  /* language=MySQL */ 'SELECT activity_id, sdg_id FROM activity_sdgs WHERE activity_id IN (?) ORDER BY id ASC',
  /* language=MySQL */ 'SELECT activity_id, goal_id AS sdg_id FROM activity_sdgs WHERE activity_id IN (?) ORDER BY id ASC',
];

const companyQueryCandidates = [
  /* language=MySQL */
  `SELECT
    ac.activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.article_id AS activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.activity_id,
    c.name AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.company_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.companies_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.article_id AS activity_id,
    c.contents AS company_name
  FROM activity_companies ac
  INNER JOIN companies c ON c.id = ac.companies_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
];

const categoryQueryCandidates = [
  /* language=MySQL */
  `SELECT
    ac.activity_id,
    c.name AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.article_id AS activity_id,
    c.name AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.article_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
  `SELECT
    ac.activity_id,
    c.contents AS category_name
  FROM activity_categories ac
  INNER JOIN categories c ON c.id = ac.category_id
  WHERE ac.activity_id IN (?)
  ORDER BY ac.id ASC`,
  /* language=MySQL */
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
    /* language=MySQL */
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

async function getActivityPhotoUrlsMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  const [rows] = await pool.query(
    /* language=MySQL */
    `SELECT activity_id, url
     FROM activity_images
     WHERE activity_id IN (?)
     ORDER BY id ASC`,
    [activityIds]
  );

  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row.activity_id);
    if (!map.has(key)) {
      map.set(key, []);
    }
    if (row.url) {
      map.get(key).push(String(row.url));
    }
  }
  return map;
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

async function getActivitySdgIdsMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  const [rows] = await pool.query(
    /* language=MySQL */
    `SELECT activity_id, sdg_id
     FROM activity_sdgs
     WHERE activity_id IN (?)
     ORDER BY id ASC`,
    [activityIds]
  );

  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row.activity_id);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(Number(row.sdg_id));
  }
  return map;
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

async function getActivityCompanyIdsMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  const [rows] = await pool.query(
    /* language=MySQL */
    `SELECT activity_id, company_id
     FROM activity_companies
     WHERE activity_id IN (?)
     ORDER BY id ASC`,
    [activityIds]
  );

  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row.activity_id);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(Number(row.company_id));
  }
  return map;
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

async function getActivityCategoryIdsMap(activityIds) {
  if (!activityIds.length) {
    return new Map();
  }

  const [rows] = await pool.query(
    /* language=MySQL */
    `SELECT activity_id, category_id
     FROM activity_categories
     WHERE activity_id IN (?)
     ORDER BY id ASC`,
    [activityIds]
  );

  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row.activity_id);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(Number(row.category_id));
  }
  return map;
}

function rowToArticle(
  row,
  imageUrl = null,
  sdgs = null,
  sdgItems = null,
  companyNames = null,
  categoryNames = null,
  categoryIds = null,
  companyIds = null,
  sdgIds = null,
  imageUrls = null
) {
  const names = companyNames || [];
  const categories = categoryNames || [];
  const articleDate = row.date ? new Date(String(row.date).replace(/\//g, '-')) : null;
  return {
    id: Number(row.id),
    authorUserId: row.author_user_id == null ? null : Number(row.author_user_id),
    isChildActivity: row.parent_id != null,
    isParentActivity: Boolean(row.has_child_activities),
    title: row.title || '',
    content: row.content || '',
    status: normalizeArticleStatus(row.status, 'published'),
    sdgs: sdgs || parseJsonArray(row.sdgs),
    sdgItems: sdgItems || [],
    category: categories.length ? categories.join(' / ') : (row.category || ''),
    grade: row.grade || '',
    tags: parseJsonArray(row.tags),
    company: names.length ? names.join(' / ') : (row.company || ''),
    companyNames: names,
    categoryIds: categoryIds || [],
    companyIds: companyIds || [],
    sdgIds: sdgIds || [],
    date: row.date || '',
    fiscalYear: articleDate && !Number.isNaN(articleDate.getTime())
      ? formatFiscalYearLabel(getFiscalYearFromDate(articleDate))
      : '',
    imageUrl: imageUrl || '',
    imageUrls: imageUrls || (imageUrl ? [imageUrl] : []),
    location: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
      name: row.location_name || '',
    },
  };
}

function normalizeNumericList(values) {
  return values
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isFinite(value) && value > 0 && array.indexOf(value) === index);
}

function normalizeOptionalNumericValue(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function normalizeArticleStatus(status, fallback = 'pending') {
  if (status === 'private_draft' || status === 'pending' || status === 'published' || status === 'archived') {
    return status;
  }

  if (status === 'draft') {
    return 'pending';
  }

  return fallback;
}

function serializeArticleStatusForStorage(status) {
  const normalized = normalizeArticleStatus(status, 'pending');

  // DB schema compatibility: old environments still persist "pending" as "draft".
  if (normalized === 'pending') {
    return 'draft';
  }

  return normalized;
}

function parseDataUrl(dataUrl) {
  const matched = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matched) {
    return null;
  }

  return {
    mimeType: matched[1],
    buffer: Buffer.from(matched[2], 'base64'),
  };
}

function extensionFromMimeType(mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}

async function persistUploadedImages(uploadedImages) {
  if (!uploadedImages.length) {
    return [];
  }

  const savedUrls = [];
  for (const item of uploadedImages) {
    const parsed = parseDataUrl(item);
    if (!parsed) {
      continue;
    }

    const extension = extensionFromMimeType(parsed.mimeType);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    const key = `${env.s3.articleImagePrefix.replace(/^\/+|\/+$/g, '')}/${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
        Body: parsed.buffer,
        ContentType: parsed.mimeType,
      })
    );

    savedUrls.push(`https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com/${key}`);
  }

  return savedUrls;
}

async function hydrateArticles(rows) {
  const ids = rows.map((row) => row.id);
  const [photoMap, photoUrlsMap, sdgBundle, companyMap, categoryMap] = await Promise.all([
    getActivityPhotoMap(ids),
    getActivityPhotoUrlsMap(ids),
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
      categoryMap.get(keyOf(row.id)) || [],
      [],
      [],
      [],
      photoUrlsMap.get(keyOf(row.id)) || []
    )
  );
}

async function hydrateArticleRowsByIds(activityIds) {
  if (!activityIds.length) {
    return [];
  }

  const [rows] = await pool.query(
    /* language=MySQL */
    `SELECT
      a.id,
      a.author_user_id,
      a.parent_id,
      EXISTS(
        SELECT 1
        FROM activities child
        WHERE child.parent_id = a.id
          AND child.deleted_at IS NULL
      ) AS has_child_activities,
      a.name AS title,
      a.contents AS content,
      a.status,
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
    WHERE a.id IN (?)
      AND a.deleted_at IS NULL`,
    [activityIds]
  );

  const articles = await hydrateArticles(rows);
  const articleMap = new Map(articles.map((article) => [article.id, article]));
  return activityIds.map((activityId) => articleMap.get(Number(activityId))).filter(Boolean);
}

async function ensureActivityBelongsToSchool(connection, { activityId, schoolDbId, allowSameAsId = null }) {
  if (activityId == null) {
    return null;
  }

  if (allowSameAsId != null && activityId === allowSameAsId) {
    throw new Error('自分自身を親活動には設定できません。');
  }

  const [rows] = await connection.execute(
    /* language=MySQL */
    `SELECT id
     FROM activities
     WHERE id = ?
       AND school_id = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [activityId, schoolDbId]
  );

  if (!rows.length) {
    throw new Error('紐付け先の記事が見つかりません。');
  }

  return activityId;
}

export async function listArticlesBySchoolId(schoolId, options = {}) {
  const viewerUserId = Number(options.viewerUserId || 0);
  const [rows] = await pool.execute(
    /* language=MySQL */
    `SELECT
      a.id,
      a.author_user_id,
      a.parent_id,
      EXISTS(
        SELECT 1
        FROM activities child
        WHERE child.parent_id = a.id
          AND child.deleted_at IS NULL
      ) AS has_child_activities,
      a.name AS title,
      a.contents AS content,
      a.status,
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
      AND (
        a.status IN ('published', 'pending', 'draft')
        OR (a.status = 'private_draft' AND a.author_user_id = ?)
      )
    ORDER BY COALESCE(
      a.activity_date,
      STR_TO_DATE(CONCAT(a.activited_at, '-01'), '%Y-%m-%d'),
      DATE(a.created_at)
    ) DESC, a.id DESC`,
    [schoolId, viewerUserId]
  );

  return hydrateArticles(rows);
}

export async function getArticleById({ schoolId, articleId, includeDraftRelations = false, viewerUserId = 0 }) {
  const [rows] = await pool.execute(
    /* language=MySQL */
    `SELECT
      a.id,
      a.author_user_id,
      a.parent_id,
      EXISTS(
        SELECT 1
        FROM activities child
        WHERE child.parent_id = a.id
          AND child.deleted_at IS NULL
      ) AS has_child_activities,
      a.name AS title,
      a.contents AS content,
      a.status,
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
  const [article] = await hydrateArticles([row]);
  const [categoryIdsMap, companyIdsMap, sdgIdsMap] = await Promise.all([
    getActivityCategoryIdsMap([row.id]),
    getActivityCompanyIdsMap([row.id]),
    getActivitySdgIdsMap([row.id]),
  ]);
  const [childRows] = await pool.execute(
    /* language=MySQL */
    `SELECT
      a.id,
      a.author_user_id,
      a.parent_id,
      a.name AS title,
      a.contents AS content,
      a.status,
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
      AND a.parent_id = ?
      AND a.deleted_at IS NULL
      AND (
        a.status IN ('published', 'pending', 'draft')
        OR (${includeDraftRelations ? 'a.status = \'private_draft\' AND a.author_user_id = ?' : 'FALSE'})
      )
    ORDER BY COALESCE(
      a.activity_date,
      STR_TO_DATE(CONCAT(a.activited_at, '-01'), '%Y-%m-%d'),
      DATE(a.created_at)
    ) DESC, a.id DESC`,
    includeDraftRelations ? [schoolId, articleId, Number(viewerUserId || 0)] : [schoolId, articleId]
  );

  const childArticles = await hydrateArticles(childRows);
  let parentArticle = null;
  if (row.parent_id != null) {
    const [parent] = await hydrateArticleRowsByIds([Number(row.parent_id)]);
    if (
      parent &&
      (
        parent.status === 'published' ||
        parent.status === 'pending' ||
        (
          includeDraftRelations &&
          parent.status === 'private_draft' &&
          parent.authorUserId === Number(viewerUserId || 0)
        )
      )
    ) {
      parentArticle = parent;
    }
  }

  return {
    ...article,
    parentActivityId: row.parent_id == null ? null : Number(row.parent_id),
    childActivityIds: childArticles.map((childArticle) => childArticle.id),
    childArticles,
    parentArticle,
    categoryIds: categoryIdsMap.get(keyOf(row.id)) || [],
    companyIds: companyIdsMap.get(keyOf(row.id)) || [],
    sdgIds: sdgIdsMap.get(keyOf(row.id)) || [],
  };
}

export async function getArticleImageById({ schoolId, articleId }) {
  const [rows] = await pool.execute(
    /* language=MySQL */
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

export async function createArticle({
  schoolId,
  userId,
  status,
  title,
  content,
  grade,
  locationName,
  latitude,
  longitude,
  sdgIds,
  categoryIds,
  companyIds,
  libraryImageUrls,
  uploadedImages,
  parentActivityId,
  childActivityIds,
}) {
  if (!schoolId) {
    throw new Error('schoolId は必須です。');
  }

  if (!userId || !Number.isFinite(userId)) {
    throw new Error('userId は必須です。');
  }

  const normalizedStatus = normalizeArticleStatus(status, 'pending');
  const storageStatus = serializeArticleStatusForStorage(status);

  if (normalizedStatus === 'published' && !String(title || '').trim()) {
    throw new Error('タイトルは必須です。');
  }

  const [schoolRows] = await pool.execute(
    /* language=MySQL */ 'SELECT id FROM schools WHERE slug = ? LIMIT 1',
    [schoolId]
  );

  if (!schoolRows.length) {
    throw new Error('指定された学校が見つかりません。');
  }

  const schoolRow = schoolRows[0];
  const now = new Date();
  const postingDate = getPostingDateForFiscalYear(now);
  const yearMonth = `${postingDate.getUTCFullYear()}-${String(postingDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const postingDateString = `${postingDate.getUTCFullYear()}-${String(postingDate.getUTCMonth() + 1).padStart(2, '0')}-${String(postingDate.getUTCDate()).padStart(2, '0')}`;
  const uploadedImageUrls = await persistUploadedImages(uploadedImages);
  const imageUrls = [...libraryImageUrls, ...uploadedImageUrls].filter(Boolean);
  const uniqueImageUrls = [...new Set(imageUrls)];
  let normalizedParentActivityId = normalizeOptionalNumericValue(parentActivityId);
  const normalizedChildActivityIds = normalizeNumericList(childActivityIds);

  const connection = /** @type {import('mysql2/promise').PoolConnection} */ (await pool.getConnection());
  try {
    await connection.beginTransaction();

    if (normalizedParentActivityId != null) {
      normalizedParentActivityId = await ensureActivityBelongsToSchool(connection, {
        activityId: normalizedParentActivityId,
        schoolDbId: schoolRow.id,
      });
    }

    const [insertResult] = await connection.execute(
      /* language=MySQL */
      `INSERT INTO activities (
        user_id,
        school_id,
        author_user_id,
        latitude,
        longitude,
        location_name,
        grade,
        name,
        contents,
        activited_at,
        activity_date,
        created_at,
        updated_at,
        parent_id,
        is_public,
        status,
        published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?)`,
      [
        String(userId),
        schoolRow.id,
        userId,
        latitude === '' || latitude == null ? null : Number(latitude),
        longitude === '' || longitude == null ? null : Number(longitude),
        locationName || null,
        grade || null,
        String(title || '').trim(),
        String(content || '').trim(),
        yearMonth,
        postingDateString,
        normalizedParentActivityId,
        normalizedStatus === 'published' ? 1 : 0,
        storageStatus,
        normalizedStatus === 'published' ? now : null,
      ]
    );

    const activityId = insertResult.insertId;

    for (const imageUrl of uniqueImageUrls) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_images (school_id, activity_id, url, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolRow.id, activityId, imageUrl]
      );
    }

    for (const categoryId of normalizeNumericList(categoryIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_categories (school_id, activity_id, category_id, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolRow.id, activityId, categoryId]
      );
    }

    for (const companyId of normalizeNumericList(companyIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_companies (school_id, activity_id, company_id, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolRow.id, activityId, companyId]
      );
    }

    for (const sdgId of normalizeNumericList(sdgIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_sdgs (activity_id, sdg_id, created_at)
         VALUES (?, ?, NOW())`,
        [activityId, sdgId]
      );
    }

    if (normalizedChildActivityIds.length) {
      await connection.query(
        /* language=MySQL */
        `UPDATE activities
         SET parent_id = ?, updated_at = NOW()
         WHERE school_id = ?
           AND deleted_at IS NULL
           AND id IN (?)
           AND id <> ?`,
        [activityId, schoolRow.id, normalizedChildActivityIds, activityId]
      );
    }

    await connection.commit();

    return await getArticleById({
      schoolId,
      articleId: Number(activityId),
      includeDraftRelations: true,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateArticle({
  articleId,
  schoolId,
  userId,
  status,
  title,
  content,
  grade,
  locationName,
  latitude,
  longitude,
  sdgIds,
  categoryIds,
  companyIds,
  libraryImageUrls,
  uploadedImages,
  parentActivityId,
  childActivityIds,
}) {
  const normalizedStatus = normalizeArticleStatus(status, 'pending');
  const storageStatus = serializeArticleStatusForStorage(status);

  if (normalizedStatus === 'published' && !String(title || '').trim()) {
    throw new Error('タイトルは必須です。');
  }

  const uploadedImageUrls = await persistUploadedImages(uploadedImages);
  const uniqueImageUrls = [...new Set([...libraryImageUrls, ...uploadedImageUrls].filter(Boolean))];
  let normalizedParentActivityId = normalizeOptionalNumericValue(parentActivityId);
  const normalizedChildActivityIds = normalizeNumericList(childActivityIds).filter((value) => value !== articleId);
  const connection = /** @type {import('mysql2/promise').PoolConnection} */ (await pool.getConnection());

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      /* language=MySQL */
      `SELECT a.id, s.id AS school_db_id
       FROM activities a
       INNER JOIN schools s ON s.id = a.school_id
       WHERE a.id = ? AND s.slug = ? AND a.deleted_at IS NULL
       LIMIT 1`,
      [articleId, schoolId]
    );

    // noinspection ExceptionCaughtLocallyJS
    if (!rows.length) {
      throw new Error('記事が見つかりません。');
    }

    const schoolDbId = rows[0].school_db_id;

    if (normalizedParentActivityId != null) {
      normalizedParentActivityId = await ensureActivityBelongsToSchool(connection, {
        activityId: normalizedParentActivityId,
        schoolDbId,
        allowSameAsId: articleId,
      });
    }

    const now = new Date();

    await connection.execute(
      /* language=MySQL */
      `UPDATE activities
       SET user_id = ?,
           author_user_id = ?,
           latitude = ?,
           longitude = ?,
           location_name = ?,
           grade = ?,
           name = ?,
           contents = ?,
           parent_id = ?,
           is_public = ?,
           status = ?,
           published_at = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        String(userId),
        userId,
        latitude === '' || latitude == null ? null : Number(latitude),
        longitude === '' || longitude == null ? null : Number(longitude),
        locationName || null,
        grade || null,
        String(title || '').trim(),
        String(content || '').trim(),
        normalizedParentActivityId,
        normalizedStatus === 'published' ? 1 : 0,
        storageStatus,
        normalizedStatus === 'published' ? now : null,
        articleId,
      ]
    );

    await connection.execute(/* language=MySQL */ 'DELETE FROM activity_images WHERE activity_id = ?', [articleId]);
    await connection.execute(/* language=MySQL */ 'DELETE FROM activity_categories WHERE activity_id = ?', [articleId]);
    await connection.execute(/* language=MySQL */ 'DELETE FROM activity_companies WHERE activity_id = ?', [articleId]);
    await connection.execute(/* language=MySQL */ 'DELETE FROM activity_sdgs WHERE activity_id = ?', [articleId]);

    for (const imageUrl of uniqueImageUrls) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_images (school_id, activity_id, url, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolDbId, articleId, imageUrl]
      );
    }

    for (const categoryId of normalizeNumericList(categoryIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_categories (school_id, activity_id, category_id, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolDbId, articleId, categoryId]
      );
    }

    for (const companyId of normalizeNumericList(companyIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_companies (school_id, activity_id, company_id, created_at)
         VALUES (?, ?, ?, NOW())`,
        [schoolDbId, articleId, companyId]
      );
    }

    for (const sdgId of normalizeNumericList(sdgIds)) {
      await connection.execute(
        /* language=MySQL */
        `INSERT INTO activity_sdgs (activity_id, sdg_id, created_at)
         VALUES (?, ?, NOW())`,
        [articleId, sdgId]
      );
    }

    await connection.execute(
      /* language=MySQL */
      `UPDATE activities
       SET parent_id = NULL, updated_at = NOW()
       WHERE school_id = ?
         AND deleted_at IS NULL
         AND parent_id = ?`,
      [schoolDbId, articleId]
    );

    if (normalizedChildActivityIds.length) {
      await connection.query(
        /* language=MySQL */
        `UPDATE activities
         SET parent_id = ?, updated_at = NOW()
         WHERE school_id = ?
           AND deleted_at IS NULL
           AND id IN (?)
           AND id <> ?`,
        [articleId, schoolDbId, normalizedChildActivityIds, articleId]
      );
    }

    await connection.commit();
    return await getArticleById({ schoolId, articleId, includeDraftRelations: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeArticle({ schoolId, articleId }) {
  const [result] = await pool.execute(
    /* language=MySQL */
    `UPDATE activities a
     INNER JOIN schools s ON s.id = a.school_id
     SET a.deleted_at = NOW(),
         a.updated_at = NOW(),
         a.status = 'archived'
     WHERE a.id = ? AND s.slug = ? AND a.deleted_at IS NULL`,
    [articleId, schoolId]
  );

  if (!result.affectedRows) {
    throw new Error('記事が見つかりません。');
  }
}
