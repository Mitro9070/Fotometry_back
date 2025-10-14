import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity('photometry.filter_experiments')
export class FilterExperiment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_id' })
  filterId: number;

  @Column({ name: 'start_exp', type: 'double precision' })
  startExp: number;

  @Column({ name: 'interval_min', type: 'double precision' })
  intervalMin: number;

  @Column({ name: 'step_sec', type: 'double precision' })
  stepSec: number;

  @Column({ name: 'background_30s', type: 'double precision' })
  background30s: number;

  @Column({ name: 'samples_count' })
  samplesCount: number;

  @ManyToOne(() => Filter, filter => filter.experiments)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}

