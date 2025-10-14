import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Observation } from './observation.entity';

@Entity('photometry.coordinates')
export class Coordinate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'observation_id' })
  observationId: number;

  @Column({ name: 'hour_angle', type: 'double precision' })
  hourAngle: number;

  @Column({ type: 'double precision' })
  delta: number;

  @Column({ type: 'timestamp', nullable: true })
  time: Date | null;

  @ManyToOne(() => Observation, observation => observation.coordinates)
  @JoinColumn({ name: 'observation_id' })
  observation: Observation;
}
