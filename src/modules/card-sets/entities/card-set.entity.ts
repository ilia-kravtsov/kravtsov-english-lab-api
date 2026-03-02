import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {CardEntity} from "../../cards/entities/card.entity";

@Entity('card_sets')
@Index(['userId'])
@Index(['userId', 'key'], { unique: true })
export class CardSetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 120 })
  key: string;

  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  isPreset: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  presetKey: string | null;

  @OneToMany(() => CardEntity, card => card.cardSet)
  cards: CardEntity[];

  cardsCount?: number;
}

export type PartsOfSpeech =
  | 'noun'
  | 'pronoun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'interjunction'
  | 'article'
  | 'numeral'
  | 'particle';

export type PresetLexicalUnit = {
  type: 'word' | 'expression';
  value: string;
  translation?: string;
  transcription?: string;
  meaning?: string;
  examples?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  partsOfSpeech?: PartsOfSpeech[];
  comment?: string;
};

export type PresetCardSet = {
  presetKey: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  description: string;
  sortOrder: number;
  cards: PresetLexicalUnit[];
};
