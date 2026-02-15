import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LexicalUnitEntity } from './entities/lexical-unit.entity';
import { CreateLexicalUnitDto } from './dto/create-lexical-unit.dto';
import { ConflictException } from '@nestjs/common';
import { promises as fs } from 'fs';
import {join} from "path";

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

async function safeUnlink(filePathAbs: string) {
  try {
    await fs.unlink(filePathAbs);
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
    if (!entity) throw new NotFoundException('Lexical unit not found');

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

    if (newAudioPath) {
      const old = entity.audioPath;
      entity.audioPath = newAudioPath;

      if (old) {
        const abs = join(process.cwd(), 'uploads', old);
        await safeUnlink(abs);
      }
    }

    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id, userId } });
    if (!entity) throw new NotFoundException('Lexical unit not found');

    if (entity.audioPath) {
      const abs = join(process.cwd(), 'uploads', entity.audioPath);
      await safeUnlink(abs);
    }

    await this.repo.remove(entity);
  }
}
