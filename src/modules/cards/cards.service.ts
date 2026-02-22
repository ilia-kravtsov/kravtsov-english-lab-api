import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEntity } from './entities/card.entity';
import { CardSetEntity } from '../card-sets/entities/card-set.entity';
import { LexicalUnitEntity } from '../lexical-units/entities/lexical-unit.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardsRepo: Repository<CardEntity>,
    @InjectRepository(CardSetEntity)
    private readonly cardSetsRepo: Repository<CardSetEntity>,
    @InjectRepository(LexicalUnitEntity)
    private readonly lexicalRepo: Repository<LexicalUnitEntity>,
  ) {}

  private async getOwnedCardSetOrThrow(userId: string, cardSetId: string): Promise<CardSetEntity> {
    const set = await this.cardSetsRepo.findOne({ where: { id: cardSetId, userId } });

    if (!set) {
      throw new NotFoundException('Card set not found');
    }

    return set;
  }

  private async getOwnedLexicalUnitOrThrow(userId: string, lexicalUnitId: string): Promise<LexicalUnitEntity> {
    const lu = await this.lexicalRepo.findOne({ where: { id: lexicalUnitId, userId } });

    if (!lu) {
      throw new NotFoundException('Lexical unit not found');
    }

    return lu;
  }

  async list(userId: string, cardSetId: string): Promise<CardEntity[]> {
    await this.getOwnedCardSetOrThrow(userId, cardSetId);

    return this.cardsRepo.find({
      where: { userId, cardSetId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async listWithLexicalUnit(userId: string, cardSetId: string): Promise<CardEntity[]> {
    await this.getOwnedCardSetOrThrow(userId, cardSetId);

    return this.cardsRepo.find({
      where: { userId, cardSetId },
      relations: { lexicalUnit: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getById(userId: string, cardSetId: string, cardId: string): Promise<CardEntity> {
    await this.getOwnedCardSetOrThrow(userId, cardSetId);

    const card = await this.cardsRepo.findOne({
      where: { id: cardId, userId, cardSetId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async create(userId: string, cardSetId: string, dto: CreateCardDto): Promise<CardEntity> {
    await this.getOwnedCardSetOrThrow(userId, cardSetId);
    await this.getOwnedLexicalUnitOrThrow(userId, dto.lexicalUnitId);

    const entity = this.cardsRepo.create({
      userId,
      cardSetId,
      lexicalUnitId: dto.lexicalUnitId,
      note: dto.note?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.cardsRepo.save(entity);
  }

  async update(userId: string, cardSetId: string, cardId: string, dto: UpdateCardDto): Promise<CardEntity> {
    const card = await this.getById(userId, cardSetId, cardId);

    if (dto.lexicalUnitId !== undefined) {
      await this.getOwnedLexicalUnitOrThrow(userId, dto.lexicalUnitId);
      card.lexicalUnitId = dto.lexicalUnitId;
    }

    if (dto.note !== undefined) {
      card.note = dto.note?.trim() || null;
    }

    if (dto.sortOrder !== undefined) {
      card.sortOrder = dto.sortOrder ?? 0;
    }

    return this.cardsRepo.save(card);
  }

  async remove(userId: string, cardSetId: string, cardId: string): Promise<void> {
    const card = await this.getById(userId, cardSetId, cardId);
    await this.cardsRepo.remove(card);
  }

  private lexicalUnitToDto(entity: LexicalUnitEntity) {
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

  toDto(entity: CardEntity) {
    return {
      id: entity.id,
      cardSetId: entity.cardSetId,
      lexicalUnitId: entity.lexicalUnitId,
      note: entity.note ?? null,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDtoWithLexicalUnit(entity: CardEntity) {
    return {
      id: entity.id,
      cardSetId: entity.cardSetId,
      lexicalUnitId: entity.lexicalUnitId,
      note: entity.note ?? null,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lexicalUnit: entity.lexicalUnit ? this.lexicalUnitToDto(entity.lexicalUnit) : null,
    };
  }
}
