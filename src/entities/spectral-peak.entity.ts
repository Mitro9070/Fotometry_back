import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity('photometry.spectral_peaks')
export class SpectralPeak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_id' })
  filterId: number;

  @Column()
  rank: number;

  @Column({ type: 'double precision' })
  amplitude: number;

  @Column()
  no: number;

  @Column({ name: 'p_percent', type: 'double precision' })
  pPercent: number;

  @Column({ name: 't_sec', type: 'double precision' })
  tSec: number;

  @ManyToOne(() => Filter, filter => filter.spectralPeaks)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}

