import {
  Column,
  CreateDateColumn,
  Entity, Index, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {User} from "../../users/entities/user.entity";

export enum LexicalUnitType {
  WORD = 'word',
  EXPRESSION = 'expression',
}

export enum PartsOfSpeech {
  NOUN = 'noun',
  PRONOUN = 'pronoun',
  VERB = 'verb',
  ADJECTIVE = 'adjective',
  ADVERB = 'adverb',
  PREPOSITION = 'preposition',
  CONJUNCTION = 'conjunction',
  INTERJUNCTION = 'interjunction',
  ARTICLE = 'article',
  NUMERAL = 'numeral',
  PARTICLE = 'particle',
}

@Entity('lexical_units')
@Index(['userId'])
export class LexicalUnitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LexicalUnitType })
  type: LexicalUnitType;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  translation?: string | null;

  @Column({ type: 'text', nullable: true })
  transcription?: string | null;

  @Column({ type: 'text', nullable: true })
  meaning?: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  antonyms?: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  synonyms?: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  partsOfSpeech: PartsOfSpeech[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  examples?: string[] | null;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ type: 'text', nullable: true })
  audioPath: string | null;

  @Column({ type: 'text', nullable: true })
  soundMeaningPath: string | null;

  @Column({ type: 'text', nullable: true })
  soundExamplePath: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
