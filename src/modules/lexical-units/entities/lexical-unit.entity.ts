import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
export class LexicalUnitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LexicalUnitType })
  type: LexicalUnitType;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  translation?: string;

  @Column({ type: 'text', nullable: true })
  transcription?: string;

  @Column({ type: 'text', nullable: true })
  meaning?: string;

  @Column({ type: 'text', nullable: true })
  antonyms?: string;

  @Column({ type: 'text', nullable: true })
  synonyms?: string;

  @Column({ type: 'enum', enum: PartsOfSpeech, nullable: true })
  partsOfSpeech?: PartsOfSpeech;

  @Column({ type: 'text', nullable: true })
  examples?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', nullable: true })
  audioPath: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
