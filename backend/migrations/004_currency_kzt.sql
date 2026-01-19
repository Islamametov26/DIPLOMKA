ALTER TABLE bookings
  ALTER COLUMN currency SET DEFAULT 'KZT';

UPDATE bookings
SET currency = 'KZT'
WHERE currency = 'RUB';
