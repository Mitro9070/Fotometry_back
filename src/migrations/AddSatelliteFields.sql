-- Добавляем поля для поддержки партиций КА
ALTER TABLE photometry.observations 
ADD COLUMN IF NOT EXISTS satellite_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS partition_time_seconds INTEGER;

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_observations_satellite_number ON photometry.observations(satellite_number);
CREATE INDEX IF NOT EXISTS idx_observations_partition_time ON photometry.observations(partition_time_seconds);
CREATE INDEX IF NOT EXISTS idx_observations_satellite_date ON photometry.observations(satellite_number, date_obs);

