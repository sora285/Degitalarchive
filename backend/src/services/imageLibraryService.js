import { pool } from '../config/db.js';
import { env } from '../config/env.js';

function getExtension(fileName) {
  const value = String(fileName || '').trim();
  const lastDotIndex = value.lastIndexOf('.');
  if (lastDotIndex <= -1 || lastDotIndex === value.length - 1) {
    return '';
  }
  return value.slice(lastDotIndex);
}

export async function listImageLibraryBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    `SELECT
      p.school_id,
      p.photoNo,
      p.classNo,
      p.name,
      p.uuid,
      p.fileName,
      p.comment,
      p.registDateTime,
      c.className
     FROM t_digitalArchive_photos p
     INNER JOIN schools s ON s.id = p.school_id
     LEFT JOIN t_digitalArchive_classes c ON c.classNo = p.classNo
     WHERE p.removeFlag = b'0'
       AND s.slug = ?
     ORDER BY p.registDateTime DESC, p.photoNo DESC
     LIMIT 60`,
    [schoolId]
  );

  const baseUrl = env.imageLibraryBaseUrl.replace(/\/+$/, '');

  return rows
    .filter((row) => row.uuid && row.fileName)
    .map((row) => ({
      id: String(row.photoNo),
      name: String(row.name || row.className || 'ライブラリ画像'),
      className: String(row.className || ''),
      url: `${baseUrl}/${encodeURIComponent(String(row.uuid))}${getExtension(row.fileName)}`,
      comment: String(row.comment || '').slice(0, 120),
    }));
}
