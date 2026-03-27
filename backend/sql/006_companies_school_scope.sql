ALTER TABLE companies
  ADD COLUMN school_id BIGINT UNSIGNED NULL AFTER contents,
  ADD KEY idx_companies_school_id (school_id),
  ADD CONSTRAINT fk_companies_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- 既存データに学校を紐付けてください。
-- 例:
-- UPDATE companies
-- SET school_id = (SELECT id FROM schools WHERE slug = 'minatomirai')
-- WHERE id IN (1, 2, 3);
