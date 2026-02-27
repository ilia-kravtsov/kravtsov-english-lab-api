import { LexicalUnitType, PartsOfSpeech } from '../../lexical-units/entities/lexical-unit.entity';

export type PresetLexicalUnit = {
  type: LexicalUnitType;
  value: string;
  translation?: string | null;
  transcription?: string | null;
  meaning?: string | null;
  imageUrl?: string | null
  examples?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  partsOfSpeech?: PartsOfSpeech[] | null;
  comment?: string | null;
  audioAsset?: string | null;
  soundMeaningAsset?: string | null;
  soundExampleAsset?: string | null;
};

export type PresetCardSet = {
  title: string;
  description?: string | null;
  sortOrder?: number;
  cards: PresetLexicalUnit[];
};

export const PRESET_CARD_SETS: PresetCardSet[] = [
  {
    title: 'A1',
    description: 'Standard cards set',
    sortOrder: 0,
    cards: [
      {
        type: LexicalUnitType.WORD,
        value: 'hello',
        translation: 'привет',
        examples: ['Hello, John.'],
        synonyms: ['hi'],
        antonyms: null,
        partsOfSpeech: [PartsOfSpeech.INTERJUNCTION],
      },
    ],
  },
];