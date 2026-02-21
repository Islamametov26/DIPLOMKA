-- Fix mojibake texts introduced by previous seed migrations.
-- Safe for repeated runs and partially modified data.

UPDATE venues
SET
  name = 'Кинотеатр Север',
  address = 'пр-т Мира, 24',
  updated_at = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE venues
SET
  name = 'Лекторий Фабрика',
  address = 'ул. Заводская, 7',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE venues
SET
  name = 'Центральный культурный центр',
  address = 'пр-т Абая, 125',
  updated_at = now()
WHERE id = '99999999-9999-9999-9999-999999999991';

UPDATE categories SET name = 'Кино', updated_at = now() WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE categories SET name = 'Лекции', updated_at = now() WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE categories SET name = 'Выставки', updated_at = now() WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE categories SET name = 'Фильмы', updated_at = now() WHERE id = '88888888-8888-8888-8888-888888888881';
UPDATE categories SET name = 'Мероприятия', updated_at = now() WHERE id = '88888888-8888-8888-8888-888888888882';
UPDATE categories SET name = 'Театры', updated_at = now() WHERE id = '88888888-8888-8888-8888-888888888883';
UPDATE categories SET name = 'Концерты', updated_at = now() WHERE id = '88888888-8888-8888-8888-888888888884';

-- Merge duplicate category IDs introduced by seed expansion (if they exist).
INSERT INTO event_categories (event_id, category_id)
SELECT event_id, '55555555-5555-5555-5555-555555555555'::uuid
FROM event_categories
WHERE category_id = '88888888-8888-8888-8888-888888888885'::uuid
ON CONFLICT DO NOTHING;

DELETE FROM event_categories
WHERE category_id = '88888888-8888-8888-8888-888888888885'::uuid;

DELETE FROM categories
WHERE id = '88888888-8888-8888-8888-888888888885'::uuid;

INSERT INTO event_categories (event_id, category_id)
SELECT event_id, '44444444-4444-4444-4444-444444444444'::uuid
FROM event_categories
WHERE category_id = '88888888-8888-8888-8888-888888888886'::uuid
ON CONFLICT DO NOTHING;

DELETE FROM event_categories
WHERE category_id = '88888888-8888-8888-8888-888888888886'::uuid;

DELETE FROM categories
WHERE id = '88888888-8888-8888-8888-888888888886'::uuid;

UPDATE events
SET
  title = 'Премьерный показ',
  description = 'Новый авторский фильм с обсуждением после сеанса.',
  updated_at = now()
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE events
SET
  title = 'Городская лекция: урбанистика',
  description = 'Разговор о развитии общественных пространств и новых кварталов.',
  updated_at = now()
WHERE id = '77777777-7777-7777-7777-777777777777';

UPDATE events
SET
  title = 'Ночной кинопоказ: Классика 90-х',
  description = 'Большой экран, живое обсуждение после сеанса и атмосфера ретро-кино.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE events
SET
  title = 'Весенний городской фестиваль',
  description = 'Уличные выступления, фудкорт, мастер-классы и музыкальная сцена в центре города.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000002';

UPDATE events
SET
  title = 'Театральная премьера: Гамлет',
  description = 'Современная постановка классической трагедии с камерным оркестром.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000003';

UPDATE events
SET
  title = 'Симфо-шоу саундтреков',
  description = 'Оркестр исполнит музыку из культовых фильмов и сериалов.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000004';

UPDATE events
SET
  title = 'Выставка цифрового искусства',
  description = 'Интерактивные инсталляции, мультимедиа и работы молодых художников.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000005';

UPDATE events
SET
  title = 'Лекторий: Искусственный интеллект в 2026',
  description = 'Практические кейсы внедрения ИИ в бизнес, образование и городские сервисы.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000006';

UPDATE events
SET
  title = 'Фестиваль короткометражного кино',
  description = 'Подборка короткого метра от молодых режиссеров из Центральной Азии.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000007';

UPDATE events
SET
  title = 'Осенний маркет креативных проектов',
  description = 'Локальные бренды, дизайн-ярмарка, живая музыка и открытые лекции.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000008';

UPDATE events
SET
  title = 'Новогодний гала-концерт',
  description = 'Праздничная программа с оркестром, солистами и световым шоу.',
  updated_at = now()
WHERE id = 'a1000000-0000-0000-0000-000000000009';
