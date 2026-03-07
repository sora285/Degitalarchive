# digitalarchive-api

Express + MariaDB 認証APIです。

## セットアップ

1. `cp .env.example .env`
2. `npm install`
3. `npm run dev`

`.env` の `DB_HOST=127.0.0.1` で接続できない場合は、`DB_SOCKET_PATH` を指定してください（例: `/tmp/mysql.sock`）。

## エンドポイント

- `GET /api/health`
- `POST /api/auth/login`
  - body: `{ "username": "...", "password": "...", "schoolId": "minatomirai" }`
  - 成功時: `Set-Cookie: auth_token=...` と `user` を返却
- `POST /api/auth/register`
  - body: `{ "name": "...", "email": "...", "password": "...", "schoolId": "minatomirai" }`
  - 成功時: `Set-Cookie: auth_token=...` と `user` を返却
- `POST /api/auth/logout`
- `GET /api/articles?schoolId=minatomirai`
- `GET /api/articles/:id?schoolId=minatomirai`

## DB準備

1. `backend/sql/001_auth_schema.sql` を適用
2. `backend/sql/002_seed_schools.sql` を適用
3. `backend/sql/003_user_constraints.sql` を適用（推奨）
4. `backend/sql/004_articles_schema.sql` を適用
5. `backend/sql/005_seed_articles.sql` を適用（表示確認用）
6. `users.password` は bcrypt ハッシュを保存

## 注意

- 本番では `COOKIE_SECURE=true` と HTTPS が必須です。
- JWT秘密鍵は十分長いランダム値にしてください。
