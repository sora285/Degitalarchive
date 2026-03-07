-- 認証用の最小スキーマ（MariaDB）
-- 既存 users テーブルを活かしつつ schoolId / role を追加する案

CREATE TABLE IF NOT EXISTS schools (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schools_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS school_id BIGINT UNSIGNED NULL AFTER email,
  ADD COLUMN IF NOT EXISTS role ENUM('admin','user') NOT NULL DEFAULT 'user' AFTER password;

CREATE INDEX idx_users_school_id ON users (school_id);
CREATE INDEX idx_users_email ON users (email);

ALTER TABLE users
  ADD CONSTRAINT fk_users_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

-- 既存データ向け: school_id が未設定のユーザーはログイン不可になるため、
-- 運用開始前に必ず school_id を割り当てること。
