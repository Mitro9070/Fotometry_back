import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Observation } from './observation.entity';

@Entity('satellites', { schema: 'photometry' })
export class Satellite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'norad_id', type: 'varchar', length: 20, unique: true })
  noradId: string;

  @Column({ name: 'international_code', type: 'varchar', length: 20, nullable: true })
  internationalCode: string;

  @Column({ name: 'satellite_name', type: 'varchar', length: 255, nullable: true })
  satelliteName: string;

  @Column({ name: 'common_name', type: 'varchar', length: 255, nullable: true })
  commonName: string;

  @Column({ name: 'launch_date', type: 'date', nullable: true })
  launchDate: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'country', type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ name: 'owner', type: 'varchar', length: 100, nullable: true })
  owner: string;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category: string;

  // TLE данные
  @Column({ name: 'tle_line1', type: 'text', nullable: true })
  tleLine1: string;

  @Column({ name: 'tle_line2', type: 'text', nullable: true })
  tleLine2: string;

  @Column({ name: 'tle_epoch', type: 'timestamp', nullable: true })
  tleEpoch: Date;

  // Орбитальные характеристики (из TLE)
  @Column({ name: 'mean_motion', type: 'decimal', precision: 12, scale: 8, nullable: true })
  meanMotion: number;

  @Column({ name: 'eccentricity', type: 'decimal', precision: 8, scale: 6, nullable: true })
  eccentricity: number;

  @Column({ name: 'inclination_deg', type: 'decimal', precision: 8, scale: 4, nullable: true })
  inclinationDeg: number;

  @Column({ name: 'ra_of_asc_node', type: 'decimal', precision: 8, scale: 4, nullable: true })
  raOfAscNode: number;

  @Column({ name: 'arg_of_pericenter', type: 'decimal', precision: 8, scale: 4, nullable: true })
  argOfPericenter: number;

  @Column({ name: 'mean_anomaly', type: 'decimal', precision: 8, scale: 4, nullable: true })
  meanAnomaly: number;

  @Column({ name: 'bstar', type: 'decimal', precision: 12, scale: 10, nullable: true })
  bstar: number;

  @Column({ name: 'rev_at_epoch', type: 'integer', nullable: true })
  revAtEpoch: number;

  // Вычисленные орбитальные характеристики
  @Column({ name: 'apogee_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  apogeeKm: number;

  @Column({ name: 'perigee_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  perigeeKm: number;

  @Column({ name: 'period_min', type: 'decimal', precision: 8, scale: 2, nullable: true })
  periodMin: number;

  @Column({ name: 'semi_major_axis_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  semiMajorAxisKm: number;

  // Дополнительные данные
  @Column({ name: 'mass_kg', type: 'decimal', precision: 10, scale: 2, nullable: true })
  massKg: number;

  @Column({ name: 'power_w', type: 'decimal', precision: 10, scale: 2, nullable: true })
  powerW: number;

  @Column({ name: 'mission_description', type: 'text', nullable: true })
  missionDescription: string;

  @Column({ name: 'last_updated', type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Связи
  @OneToMany(() => Observation, observation => observation.satellite)
  observations: Observation[];
}
