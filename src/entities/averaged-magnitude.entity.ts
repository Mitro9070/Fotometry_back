import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity('photometry.averaged_magnitudes')
export class AveragedMagnitude {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_id' })
  filterId: number;

  @Column({ name: 'index_pos' })
  indexPos: number;

  @Column({ type: 'timestamp', nullable: true })
  time: Date | null;

  @Column({ type: 'double precision' })
  mag: number;

  @Column({ name: 'hour_angle', type: 'double precision', nullable: true })
  hourAngle?: number;

  @Column({ type: 'double precision', nullable: true })
  alpha?: number;

  @Column({ type: 'double precision', nullable: true })
  delta?: number;

  @Column({ type: 'double precision', nullable: true })
  zenith?: number;

  @Column({ type: 'double precision', nullable: true })
  azimuth?: number;

  @Column({ name: 'phase_angle', type: 'double precision', nullable: true })
  phaseAngle?: number;

  @Column({ name: 'star_time', type: 'double precision', nullable: true })
  starTime?: number;

  @ManyToOne(() => Filter, filter => filter.averagedMagnitudes)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}
