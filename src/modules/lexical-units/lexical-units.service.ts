import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LexicalUnitEntity } from './entities/lexical-unit.entity';
import { CreateLexicalUnitDto } from './dto/create-lexical-unit.dto';
import { ConflictException } from '@nestjs/common';
import { promises as fs } from 'fs';
import {join, normalize} from "path";

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeStoredPath(p: string) {
  let x = (p ?? '').replace(/\\/g, '/').trim();
  if (!x) return '';

  if (x.startsWith('/')) x = x.slice(1);
  if (x.startsWith('uploads/')) x = x.slice('uploads/'.length);
  if (x.startsWith('/uploads/')) x = x.slice('/uploads/'.length);

  x = normalize(x).replace(/\\/g, '/');

  if (x.startsWith('..')) {
    throw new Error('Invalid stored path');
  }

  return x;
}

const UPLOADS_DIR = join(process.cwd(), 'uploads');

async function safeUnlinkAbs(absPath: string) {
  try {
    await fs.unlink(absPath);
  } catch (error) {
    console.log(error);
  }
}

@Injectable()
export class LexicalUnitsService {
  constructor(
    @InjectRepository(LexicalUnitEntity)
    private readonly repo: Repository<LexicalUnitEntity>,
  ) {}

  async existsByValue(userId: string, value: string): Promise<boolean> {
    const v = normalizeValue(value);

    const count = await this.repo
      .createQueryBuilder('lu')
      .where('lu.userId = :userId', { userId })
      .andWhere('LOWER(lu.value) = LOWER(:v)', { v })
      .getCount();

    return count > 0;
  }

  async create(
    userId: string,
    dto: CreateLexicalUnitDto,
    audioPath?: string | null,
  ): Promise<LexicalUnitEntity> {
    const normalized = normalizeValue(dto.value);

    const exists = await this.existsByValue(userId, normalized);

    if (exists) {
      throw new ConflictException('Lexical unit already exists');
    }

    const entity = this.repo.create({
      ...dto,
      value: normalized,
      partsOfSpeech: dto.partsOfSpeech ?? null,
      audioPath: audioPath ?? null,
      imageUrl: dto.imageUrl?.trim() || null,
      userId,
    });

    return this.repo.save(entity);
  }

  async findByValue(userId: string, value: string): Promise<LexicalUnitEntity | null> {
    const v = normalizeValue(value);

    return this.repo
      .createQueryBuilder('lu')
      .where('lu.userId = :userId', { userId })
      .andWhere('LOWER(lu.value) = LOWER(:v)', { v })
      .getOne();
  }

  async update(
    userId: string,
    id: string,
    dto: CreateLexicalUnitDto,
    newAudioPath?: string | null,
  ): Promise<LexicalUnitEntity> {
    const entity = await this.repo.findOne({ where: { id, userId } });

    if (!entity) {
      throw new NotFoundException('Lexical unit not found');
    }

    const nextValue = normalizeValue(dto.value);

    const collision = await this.repo
      .createQueryBuilder('lu')
      .where('lu.userId = :userId', { userId })
      .andWhere('LOWER(lu.value) = LOWER(:v)', { v: nextValue })
      .andWhere('lu.id <> :id', { id })
      .getCount();

    if (collision > 0) {
      throw new ConflictException('Lexical unit already exists');
    }

    entity.type = dto.type;
    entity.value = nextValue;
    entity.translation = dto.translation ?? null;
    entity.transcription = dto.transcription ?? null;
    entity.meaning = dto.meaning ?? null;
    entity.antonyms = dto.antonyms ?? null;
    entity.synonyms = dto.synonyms ?? null;
    entity.partsOfSpeech = dto.partsOfSpeech ?? null;
    entity.examples = dto.examples ?? null;
    entity.comment = dto.comment ?? null;
    entity.imageUrl = dto.imageUrl?.trim() || null;

    if (newAudioPath) {
      const old = entity.audioPath;
      entity.audioPath = newAudioPath;

      if (old) {
        const rel = normalizeStoredPath(old);
        const abs = join(UPLOADS_DIR, rel);
        await safeUnlinkAbs(abs);
      }
    }

    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id, userId } });

    if (!entity) {
      throw new NotFoundException('Lexical unit not found');
    }

    if (entity.audioPath) {
      const rel = normalizeStoredPath(entity.audioPath);
      const abs = join(UPLOADS_DIR, rel);
      await safeUnlinkAbs(abs);
    }

    await this.repo.remove(entity);
  }

  toDto(entity: LexicalUnitEntity) {
    return {
      id: entity.id,
      type: entity.type,
      value: entity.value,
      translation: entity.translation ?? null,
      transcription: entity.transcription ?? null,
      meaning: entity.meaning ?? null,
      antonyms: entity.antonyms ?? null,
      synonyms: entity.synonyms ?? null,
      partsOfSpeech: entity.partsOfSpeech ?? null,
      examples: entity.examples ?? null,
      comment: entity.comment ?? null,
      audioUrl: entity.audioPath ? `/uploads/${entity.audioPath}` : null,
      imageUrl: entity.imageUrl ?? null,
    };
  }
}
