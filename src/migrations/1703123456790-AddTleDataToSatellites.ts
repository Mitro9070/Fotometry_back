import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTleDataToSatellites1703123456790 implements MigrationInterface {
  name = 'AddTleDataToSatellites1703123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем TLE данные
    await queryRunner.query(`
      ALTER TABLE "photometry"."satellites" 
      ADD COLUMN "tle_line1" TEXT,
      ADD COLUMN "tle_line2" TEXT,
      ADD COLUMN "tle_epoch" TIMESTAMP
    `);

    // Добавляем орбитальные характеристики из TLE
    await queryRunner.query(`
      ALTER TABLE "photometry"."satellites" 
      ADD COLUMN "mean_motion" DECIMAL(12,8),
      ADD COLUMN "ra_of_asc_node" DECIMAL(8,4),
      ADD COLUMN "arg_of_pericenter" DECIMAL(8,4),
      ADD COLUMN "mean_anomaly" DECIMAL(8,4),
      ADD COLUMN "bstar" DECIMAL(12,10),
      ADD COLUMN "rev_at_epoch" INTEGER
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем TLE данные
    await queryRunner.query(`
      ALTER TABLE "photometry"."satellites" 
      DROP COLUMN "tle_line1",
      DROP COLUMN "tle_line2",
      DROP COLUMN "tle_epoch"
    `);

    // Удаляем орбитальные характеристики из TLE
    await queryRunner.query(`
      ALTER TABLE "photometry"."satellites" 
      DROP COLUMN "mean_motion",
      DROP COLUMN "ra_of_asc_node",
      DROP COLUMN "arg_of_pericenter",
      DROP COLUMN "mean_anomaly",
      DROP COLUMN "bstar",
      DROP COLUMN "rev_at_epoch"
    `);
  }
}
