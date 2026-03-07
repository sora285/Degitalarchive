-- ユーザーの重複登録防止用（推奨）
-- 学校ごとに email の重複を禁止
ALTER TABLE users
  ADD UNIQUE KEY uq_users_school_email (school_id, email);
