import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity('photometry.instrumental_magnitudes')
export class InstrumentalMagnitude {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_id' })
  filterId: number;

  @Column({ name: 'index_pos' })
  indexPos: number;

  @Column({ type: 'double precision' })
  value: number;

  @ManyToOne(() => Filter, filter => filter.instrumentalMagnitudes)
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}

