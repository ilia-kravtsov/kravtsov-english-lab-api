import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {CardSetEntity, PresetCardSet} from './entities/card-set.entity';
import { CreateCardSetDto } from './dto/create-card-set.dto';
import { UpdateCardSetDto } from './dto/update-card-set.dto';
import { User } from "../users/entities/user.entity";
import {randomUUID} from "crypto";
import {PRESET_CARD_SETS} from "./presets/preset-card-sets";
import {LexicalUnitEntity} from "../lexical-units/entities/lexical-unit.entity";
import {CardEntity} from "../cards/entities/card.entity";
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import {
  buildExpressionsPresetAudioAssets,
} from "../lexical-units/utils/preset-audio-path.util";

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const UPLOADS_AUDIO_DIR = join(UPLOADS_DIR, 'lexical-audio');
const PRESET_AUDIO_ASSETS_DIR = join(UPLOADS_DIR, 'preset-lexical-audio');

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function setIfNull<T>(current: T | null | undefined, next: T | null | undefined): T | null {
  if (current !== null && current !== undefined) return current as any;
  return (next ?? null) as any;
}

function slugify(input: string) {
  const x = normalizeText(input).toLowerCase();
  const slug = x
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'set';
}

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8);
}

function buildKey(title: string, id: string) {
  return `${slugify(title)}-${shortId(id)}`.slice(0, 120);
}

@Injectable()
export class CardSetsService {
  constructor(
    @InjectRepository(CardSetEntity)
    private readonly repo: Repository<CardSetEntity>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(LexicalUnitEntity)
    private readonly lexicalRepo: Repository<LexicalUnitEntity>,
    @InjectRepository(CardEntity)
    private readonly cardsRepo: Repository<CardEntity>,
  ) {}

  private async isTitleTaken(userId: string, title: string, excludeId?: string) {
    const qb = this.repo
      .createQueryBuilder('cs')
      .where('cs.userId = :userId', { userId })
      .andWhere('LOWER(cs.title) = LOWER(:title)', { title });

    if (excludeId) qb.andWhere('cs.id <> :excludeId', { excludeId });

    return (await qb.getCount()) > 0;
  }

  private async ensureUploadsAudioDir(): Promise<void> {
    await fs.mkdir(UPLOADS_AUDIO_DIR, { recursive: true });
  }

  private async copyPresetAudioToUploads(assetRelPath: string | null | undefined): Promise<string | null> {
    if (!assetRelPath) return null;

    await this.ensureUploadsAudioDir();

    const srcAbs = join(PRESET_AUDIO_ASSETS_DIR, assetRelPath);
    const ext = (extname(assetRelPath) || '.webm').toLowerCase();
    const fileName = `${randomUUID()}${ext}`;
    const dstAbs = join(UPLOADS_AUDIO_DIR, fileName);

    try {
      await fs.copyFile(srcAbs, dstAbs);
      return `lexical-audio/${fileName}`;
    } catch {
      console.log(`Preset audio missing: ${assetRelPath}`);
      return null;
    }
  }

  async ensurePresetSetsOnce(userId: string): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const cardSetRepo = manager.getRepository(CardSetEntity);
      const lexicalRepo = manager.getRepository(LexicalUnitEntity);
      const cardsRepo = manager.getRepository(CardEntity);

      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');
      if (user.cardsInitialized) return;

      for (const preset of PRESET_CARD_SETS) {
        const title = normalizeText(preset.title);

        if (await cardSetRepo
          .createQueryBuilder('cs')
          .where('cs.userId = :userId', { userId })
          .andWhere('LOWER(cs.title) = LOWER(:title)', { title })
          .getCount()
        ) {
          continue;
        }

        const id = randomUUID();
        const key = buildKey(title, id);

        const entity = cardSetRepo.create({
          id,
          userId,
          key,
          title,
          description: preset.description ?? null,
          isPreset: true,
          sortOrder: preset.sortOrder ?? 0,
        });

        try {
          await cardSetRepo.save(entity);
          for (const pCard of preset.cards) {
            const value = normalizeText(pCard.value);

            let existing = await lexicalRepo
              .createQueryBuilder('lu')
              .where('lu.userId = :userId', { userId })
              .andWhere('LOWER(lu.value) = LOWER(:v)', { v: value })
              .getOne();

            if (preset.title === 'Expressions') {
              const a = buildExpressionsPresetAudioAssets(pCard.value);

              pCard.audioAsset = pCard.audioAsset ?? a.audioAsset;
              pCard.soundMeaningAsset = pCard.soundMeaningAsset ?? a.soundMeaningAsset;
              pCard.soundExampleAsset = pCard.soundExampleAsset ?? a.soundExampleAsset;
            }

            const audioPath = (!existing || !existing.audioPath)
              ? await this.copyPresetAudioToUploads(pCard.audioAsset)
              : null;
            const soundMeaningPath = (!existing || !existing.soundMeaningPath)
              ? await this.copyPresetAudioToUploads(pCard.soundMeaningAsset)
              : null;
            const soundExamplePath = (!existing || !existing.soundExamplePath)
              ? await this.copyPresetAudioToUploads(pCard.soundExampleAsset)
              : null;

            if (existing) {
              const nextTranslation = pCard.translation ?? null;
              const nextTranscription = pCard.transcription ?? null;
              const nextMeaning = pCard.meaning ?? null;
              const nextImageUrl = pCard.imageUrl ?? null;
              const nextSynonyms = pCard.synonyms ?? null;
              const nextAntonyms = pCard.antonyms ?? null;
              const nextExamples = pCard.examples ?? null;
              const nextParts = pCard.partsOfSpeech ?? null;
              const nextComment = pCard.comment ?? null;

              const prevSnapshot = {
                translation: existing.translation,
                transcription: existing.transcription,
                meaning: existing.meaning,
                imageUrl: existing.imageUrl,
                synonyms: existing.synonyms,
                antonyms: existing.antonyms,
                examples: existing.examples,
                partsOfSpeech: existing.partsOfSpeech,
                comment: existing.comment,
                audioPath: existing.audioPath,
                soundMeaningPath: existing.soundMeaningPath,
                soundExamplePath: existing.soundExamplePath,
              };

              existing.translation = setIfNull(existing.translation, nextTranslation);
              existing.transcription = setIfNull(existing.transcription, nextTranscription);
              existing.meaning = setIfNull(existing.meaning, nextMeaning);
              existing.imageUrl = setIfNull(existing.imageUrl, nextImageUrl);
              existing.synonyms = setIfNull(existing.synonyms, nextSynonyms);
              existing.antonyms = setIfNull(existing.antonyms, nextAntonyms);
              existing.examples = setIfNull(existing.examples, nextExamples);
              existing.partsOfSpeech = setIfNull(existing.partsOfSpeech, nextParts);
              existing.comment = setIfNull(existing.comment, nextComment);

              existing.audioPath = setIfNull(existing.audioPath, audioPath ?? null);
              existing.soundMeaningPath = setIfNull(existing.soundMeaningPath, soundMeaningPath ?? null);
              existing.soundExamplePath = setIfNull(existing.soundExamplePath, soundExamplePath ?? null);

              const changed =
                existing.translation !== prevSnapshot.translation ||
                existing.transcription !== prevSnapshot.transcription ||
                existing.meaning !== prevSnapshot.meaning ||
                existing.imageUrl !== prevSnapshot.imageUrl ||
                existing.comment !== prevSnapshot.comment ||
                existing.audioPath !== prevSnapshot.audioPath ||
                existing.soundMeaningPath !== prevSnapshot.soundMeaningPath ||
                existing.soundExamplePath !== prevSnapshot.soundExamplePath ||
                JSON.stringify(existing.synonyms) !== JSON.stringify(prevSnapshot.synonyms) ||
                JSON.stringify(existing.antonyms) !== JSON.stringify(prevSnapshot.antonyms) ||
                JSON.stringify(existing.examples) !== JSON.stringify(prevSnapshot.examples) ||
                JSON.stringify(existing.partsOfSpeech) !== JSON.stringify(prevSnapshot.partsOfSpeech);

              if (changed) {
                await lexicalRepo.save(existing);
              }
            }

            let lexicalId: string;

            if (existing) {
              lexicalId = existing.id;
            } else {
              const lexical = lexicalRepo.create({
                userId,
                type: pCard.type,
                value,
                translation: pCard.translation ?? null,
                transcription: pCard.transcription ?? null,
                meaning: pCard.meaning ?? null,
                imageUrl: pCard.imageUrl ?? null,
                synonyms: pCard.synonyms ?? null,
                antonyms: pCard.antonyms ?? null,
                examples: pCard.examples ?? null,
                partsOfSpeech: pCard.partsOfSpeech ?? null,
                comment: pCard.comment ?? null,
                audioPath: audioPath ?? null,
                soundMeaningPath: soundMeaningPath ?? null,
                soundExamplePath: soundExamplePath ?? null,
              });

              try {
                const savedLexical = await lexicalRepo.save(lexical);
                lexicalId = savedLexical.id;
              } catch (e: any) {
                if (e?.code !== '23505') {
                  throw e;
                }

                const retry = await lexicalRepo
                  .createQueryBuilder('lu')
                  .where('lu.userId = :userId', { userId })
                  .andWhere('LOWER(lu.value) = LOWER(:v)', { v: value })
                  .getOne();

                if (!retry) {
                  throw e;
                }

                lexicalId = retry.id;
              }
            }

            const cardExists = await cardsRepo
              .createQueryBuilder('c')
              .where('c.userId = :userId', { userId })
              .andWhere('c.cardSetId = :cardSetId', { cardSetId: entity.id })
              .andWhere('c.lexicalUnitId = :lexicalUnitId', { lexicalUnitId: lexicalId })
              .getCount();

            if (cardExists > 0) continue;

            const card = cardsRepo.create({
              userId,
              cardSetId: entity.id,
              lexicalUnitId: lexicalId,
              note: null,
              sortOrder: 0,
            });

            await cardsRepo.save(card);
          }
        } catch (e: any) {
          if (e?.code !== '23505') throw e;
        }
      }

      user.cardsInitialized = true;
      await userRepo.save(user);
    });
  }

  async list(userId: string): Promise<CardSetEntity[]> {
    await this.ensurePresetSetsOnce(userId);

    return this.repo.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async listWithCounts(userId: string) {
    await this.ensurePresetSetsOnce(userId);

    const sets = await this.repo
      .createQueryBuilder('cs')
      .where('cs.userId = :userId', { userId })
      .loadRelationCountAndMap('cs.cardsCount', 'cs.cards')
      .orderBy('cs.sortOrder', 'ASC')
      .addOrderBy('cs.createdAt', 'ASC')
      .getMany();

    return sets.map(s => this.toDto(s));
  }

  async getById(userId: string, id: string): Promise<CardSetEntity> {
    const entity = await this.repo.findOne({ where: { id, userId } });

    if (!entity) {
      throw new NotFoundException('Card set not found');
    }

    return entity;
  }

  async create(userId: string, dto: CreateCardSetDto): Promise<CardSetEntity> {
    const title = normalizeText(dto.title);

    if (await this.isTitleTaken(userId, title)) {
      throw new ConflictException('Card set title already exists');
    }

    const id = randomUUID();
    const key = buildKey(title, id);

    const entity = this.repo.create({
      id,
      userId,
      key,
      title,
      description: dto.description?.trim() || null,
      isPreset: false,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.repo.save(entity);
  }

  async update(userId: string, id: string, dto: UpdateCardSetDto): Promise<CardSetEntity> {
    const entity = await this.getById(userId, id);

    if (dto.title !== undefined) {
      const nextTitle = normalizeText(dto.title);

      if (await this.isTitleTaken(userId, nextTitle, entity.id)) {
        throw new ConflictException('Card set title already exists');
      }

      entity.title = nextTitle;
      entity.key = buildKey(nextTitle, entity.id);
    }

    if (dto.description !== undefined) {
      entity.description = dto.description?.trim() || null;
    }

    if (dto.sortOrder !== undefined) {
      entity.sortOrder = dto.sortOrder ?? 0;
    }

    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entity = await this.getById(userId, id);
    await this.repo.remove(entity);
  }

  toDto(entity: CardSetEntity) {
    return {
      id: entity.id,
      key: entity.key,
      title: entity.title,
      description: entity.description ?? null,
      isPreset: entity.isPreset,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      cardsCount: entity.cardsCount ?? 0,
    };
  }
}
