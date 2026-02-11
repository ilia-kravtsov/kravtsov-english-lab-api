import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LexicalUnitType, PartsOfSpeech } from '../entities/lexical-unit.entity';
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
  @IsString()
  antonyms?: string;

  @IsOptional()
  @IsString()
  synonyms?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEnum(PartsOfSpeech)
  partsOfSpeech?: PartsOfSpeech;

  @IsOptional()
  @IsString()
  examples?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
