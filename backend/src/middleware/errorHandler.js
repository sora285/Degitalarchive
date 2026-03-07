const dbErrorCodes = new Set([
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_NO_SUCH_TABLE',
]);

export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (dbErrorCodes.has(err?.code)) {
    console.error(`[DB ERROR] code=${err.code} message=${err.message}`);
    res.status(503).json({
      message: 'データベースに接続できません。SSHトンネルとDB設定を確認してください。',
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    message: 'サーバー内部エラーが発生しました。',
  });
}
