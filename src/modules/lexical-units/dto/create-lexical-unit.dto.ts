import {IsArray, IsEnum, IsOptional, IsString, IsUrl, MinLength} from 'class-validator';
import {LexicalUnitType, PartsOfSpeech} from '../entities/lexical-unit.entity';
import {Transform} from "class-transformer";

export class CreateLexicalUnitDto {
  @IsEnum(LexicalUnitType)
  type: LexicalUnitType;

  @IsString()
  @MinLength(1)
  value: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  transcription?: string;

  @IsOptional()
  @IsString()
  meaning?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;

    const toList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.flatMap(toList);
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const list = toList(value).map(s => s.trim()).filter(Boolean);
    return list.length ? list : undefined;
  })
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;

    const toList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.flatMap(toList);
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const list = toList(value).map(s => s.trim()).filter(Boolean);
    return list.length ? list : undefined;
  })
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;

    const toList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.flatMap(toList);

      if (typeof v === 'string') {
        return v.split(',').map(s => s.trim()).filter(Boolean);
      }

      return [];
    };

    const list = toList(value);

    return list.length ? list : undefined;
  })
  @IsArray()
  @IsEnum(PartsOfSpeech, { each: true })
  partsOfSpeech?: PartsOfSpeech[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;

    const toList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.flatMap(toList);

      if (typeof v === 'string') {
        const x = v.trim();
        return x ? [x] : [];
      }

      return [];
    };

    const list = toList(value)
      .map(s => s.trim())
      .filter(Boolean);

    return list.length ? list : undefined;
  })
  @IsArray()
  @IsString({ each: true })
  examples?: string[];

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'imageUrl must be a valid URL with http/https' })
  imageUrl?: string;
}