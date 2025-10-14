import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity('photometry.summary_stats')
export class SummaryStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_id' })
  filterId: number;

  @Column({ name: 'mag_min', type: 'double precision', nullable: true })
  magMin?: number;

  @Column({ name: 'mag_max', type: 'double precision', nullable: true })
  magMax?: number;

  @Column({ name: 'mag_avg', type: 'double precision', nullable: true })
  magAvg?: number;

  @ManyToOne(() => Filter, filter => filter.summaryStats)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}

