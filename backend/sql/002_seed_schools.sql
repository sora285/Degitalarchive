INSERT INTO schools (slug, name)
VALUES
  ('minatomirai', 'みなとみらい小学校'),
  ('yokohama-port', '横浜港小学校'),
  ('akarenga', '赤レンガ小学校'),
  ('landmark', 'ランドマーク小学校'),
  ('pacifico', 'パシフィコ小学校')
ON DUPLICATE KEY UPDATE name = VALUES(name);
