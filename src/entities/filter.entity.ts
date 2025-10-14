import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Observation } from './observation.entity';
import { FilterExperiment } from './filter-experiment.entity';
import { SpectralPeak } from './spectral-peak.entity';
import { RawSignal } from './raw-signal.entity';
import { InstrumentalMagnitude } from './instrumental-magnitude.entity';
import { AveragedMagnitude } from './averaged-magnitude.entity';
import { SummaryStat } from './summary-stat.entity';

@Entity('photometry.filters')
export class Filter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'observation_id' })
  observationId: number;

  @Column({ name: 'filter_code' })
  filterCode: string;

  @Column({ type: 'double precision', nullable: true })
  magnitude?: number;

  @Column({ name: 'a_ext', type: 'double precision', nullable: true })
  aExt?: number;

  @Column({ name: 'b_ext', type: 'double precision', nullable: true })
  bExt?: number;

  @Column({ type: 'double precision', nullable: true })
  ext?: number;

  @Column({ type: 'double precision', nullable: true })
  sigma?: number;

  @ManyToOne(() => Observation, observation => observation.filters)
  @JoinColumn({ name: 'observation_id' })
  observation: Observation;

  @OneToMany(() => FilterExperiment, experiment => experiment.filter, { cascade: true })
  experiments: FilterExperiment[];

  @OneToMany(() => SpectralPeak, peak => peak.filter, { cascade: true })
  spectralPeaks: SpectralPeak[];

  @OneToMany(() => RawSignal, signal => signal.filter, { cascade: true })
  rawSignals: RawSignal[];

  @OneToMany(() => InstrumentalMagnitude, mag => mag.filter, { cascade: true })
  instrumentalMagnitudes: InstrumentalMagnitude[];

  @OneToMany(() => AveragedMagnitude, avg => avg.filter, { cascade: true })
  averagedMagnitudes: AveragedMagnitude[];

  @OneToMany(() => SummaryStat, stat => stat.filter, { cascade: true })
  summaryStats: SummaryStat[];
}
