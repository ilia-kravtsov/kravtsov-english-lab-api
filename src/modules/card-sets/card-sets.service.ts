import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardSetEntity } from './entities/card-set.entity';
import { CreateCardSetDto } from './dto/create-card-set.dto';
import { UpdateCardSetDto } from './dto/update-card-set.dto';
import { User } from "../users/entities/user.entity";
import {randomUUID} from "crypto";

type PresetCardSet = {
  title: string;
  description?: string | null;
  sortOrder?: number;
};

const PRESET_CARD_SETS: PresetCardSet[] = [
  { title: 'A1', description: "Standard cards set", sortOrder: 0 },
  { title: 'A2', description: "Standard cards set", sortOrder: 10 },
  { title: 'B1', description: "Standard cards set", sortOrder: 20 },
  { title: 'B2', description: "Standard cards set", sortOrder: 30 },
  { title: 'C1', description: "Standard cards set", sortOrder: 40 },
  { title: 'C2', description: "Standard cards set", sortOrder: 50 },
];

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
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
  ) {}

  private async isTitleTaken(userId: string, title: string, excludeId?: string) {
    const qb = this.repo
      .createQueryBuilder('cs')
      .where('cs.userId = :userId', { userId })
      .andWhere('LOWER(cs.title) = LOWER(:title)', { title });

    if (excludeId) qb.andWhere('cs.id <> :excludeId', { excludeId });

    return (await qb.getCount()) > 0;
  }

  async ensurePresetSetsOnce(userId: string): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const cardSetRepo = manager.getRepository(CardSetEntity);

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

  async getById(userId: string, id: string): Promise<CardSetEntity> {
    const set = await this.repo.findOne({
      where: { id, userId },
    });

    if (!set) {
      throw new NotFoundException('Card set not found');
    }

    return set;
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
    };
  }
}
