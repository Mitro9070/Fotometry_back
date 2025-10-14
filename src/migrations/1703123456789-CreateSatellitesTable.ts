import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSatellitesTable1703123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем таблицу спутников
    await queryRunner.query(`
      CREATE TABLE photometry.satellites (
        id SERIAL PRIMARY KEY,
        norad_id VARCHAR(20) UNIQUE NOT NULL,
        international_code VARCHAR(20),
        satellite_name VARCHAR(255),
        common_name VARCHAR(255),
        launch_date DATE,
        status VARCHAR(50),
        country VARCHAR(100),
        owner VARCHAR(100),
        category VARCHAR(100),
        apogee_km DECIMAL(10,2),
        perigee_km DECIMAL(10,2),
        inclination_deg DECIMAL(8,4),
        period_min DECIMAL(8,2),
        eccentricity DECIMAL(8,6),
        semi_major_axis_km DECIMAL(10,2),
        mass_kg DECIMAL(10,2),
        power_w DECIMAL(10,2),
        mission_description TEXT,
        last_updated TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Добавляем колонку satellite_id в таблицу observations
    await queryRunner.query(`
      ALTER TABLE photometry.observations 
      ADD COLUMN satellite_id INTEGER;
    `);

    // Создаем внешний ключ
    await queryRunner.query(`
      ALTER TABLE photometry.observations 
      ADD CONSTRAINT fk_observations_satellite 
      FOREIGN KEY (satellite_id) 
      REFERENCES photometry.satellites(id) 
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем внешний ключ
    await queryRunner.query(`
      ALTER TABLE photometry.observations 
      DROP CONSTRAINT IF EXISTS fk_observations_satellite;
    `);

    // Удаляем колонку satellite_id
    await queryRunner.query(`
      ALTER TABLE photometry.observations 
      DROP COLUMN IF EXISTS satellite_id;
    `);

    // Удаляем таблицу спутников
    await queryRunner.query(`
      DROP TABLE IF EXISTS photometry.satellites;
    `);
  }
}
