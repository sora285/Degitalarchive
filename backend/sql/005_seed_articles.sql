INSERT INTO articles (
  school_id,
  title,
  content,
  sdgs,
  category,
  grade,
  tags,
  company,
  article_date,
  location_name,
  latitude,
  longitude
)
SELECT
  s.id,
  'みなとみらいの環境保護活動',
  '地域の海岸清掃と分別回収を実施し、環境保全の大切さを学びました。',
  '["13. 気候変動に具体的な対策を","11. 住み続けられるまちづくりを"]',
  '環境',
  '6年1組',
  '["みなとみらい","環境保護"]',
  '企業A',
  '2024-01-15',
  '横浜ランドマークタワー',
  35.4593000,
  139.6317000
FROM schools s
WHERE s.slug = 'minatomirai'
  AND NOT EXISTS (
    SELECT 1 FROM articles a WHERE a.school_id = s.id AND a.title = 'みなとみらいの環境保護活動'
  );

INSERT INTO articles (
  school_id,
  title,
  content,
  sdgs,
  category,
  grade,
  tags,
  company,
  article_date,
  location_name,
  latitude,
  longitude
)
SELECT
  s.id,
  'SDGsを学ぶ地域貢献プロジェクト',
  '地域の方へのインタビューを通じて、持続可能なまちづくりの視点をまとめました。',
  '["11. 住み続けられるまちづくりを","4. 質の高い教育をみんなに"]',
  '地域活動',
  '6年2組',
  '["SDGs","地域貢献"]',
  '企業B',
  '2024-01-18',
  'パシフィコ横浜',
  35.4537000,
  139.6380000
FROM schools s
WHERE s.slug = 'minatomirai'
  AND NOT EXISTS (
    SELECT 1 FROM articles a WHERE a.school_id = s.id AND a.title = 'SDGsを学ぶ地域貢献プロジェクト'
  );
