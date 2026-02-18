import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardSetEntity } from '../../card-sets/entities/card-set.entity';
import { LexicalUnitEntity } from '../../lexical-units/entities/lexical-unit.entity';
import { User } from '../../users/entities/user.entity';

@Entity('cards')
@Index(['userId'])
@Index(['cardSetId'])
@Index(['lexicalUnitId'])
export class CardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  cardSetId: string;

  @ManyToOne(() => CardSetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardSetId' })
  cardSet: CardSetEntity;

  @Column({ type: 'uuid' })
  lexicalUnitId: string;

  @ManyToOne(() => LexicalUnitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lexicalUnitId' })
  lexicalUnit: LexicalUnitEntity;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
