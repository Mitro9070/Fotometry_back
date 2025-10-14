import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Coordinate } from './coordinate.entity';
import { Filter } from './filter.entity';
import { Satellite } from './satellite.entity';

@Entity('observations', { schema: 'photometry' })
export class Observation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'point_code', type: 'varchar', length: 10 })
  pointCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  altitude: number;

  @Column({ name: 'date_obs', type: 'date' })
  dateObs: Date;

  @Column({ name: 'obs_number', type: 'varchar', length: 20 })
  obsNumber: string;

  @Column({ name: 'time_offset_utc', type: 'integer' })
  timeOffsetUtc: number;

  @Column({ name: 'etalon_signal', type: 'decimal', precision: 10, scale: 2, nullable: true })
  etalonSignal: number | null;

  @Column({ name: 'etalon_duration', type: 'decimal', precision: 8, scale: 2, nullable: true })
  etalonDuration: number | null;

  @Column({ name: 'avg_period', type: 'decimal', precision: 8, scale: 2, nullable: true })
  avgPeriod: number | null;

  @Column({ name: 'satellite_number', type: 'varchar', length: 20, nullable: true })
  satelliteNumber: string | null;

  @Column({ name: 'partition_time_seconds', type: 'integer', nullable: true })
  partitionTimeSeconds: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Coordinate, coordinate => coordinate.observation)
  coordinates: Coordinate[];

  @OneToMany(() => Filter, filter => filter.observation)
  filters: Filter[];

  @ManyToOne(() => Satellite, satellite => satellite.observations, { nullable: true })
  @JoinColumn({ name: 'satellite_id' })
  satellite: Satellite;

  @Column({ name: 'satellite_id', nullable: true })
  satelliteId: number;
}
