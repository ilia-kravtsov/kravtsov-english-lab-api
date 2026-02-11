import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LexicalUnitEntity } from './entities/lexical-unit.entity';
import { CreateLexicalUnitDto } from './dto/create-lexical-unit.dto';

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

@Injectable()
export class LexicalUnitsService {
  constructor(
    @InjectRepository(LexicalUnitEntity)
    private readonly repo: Repository<LexicalUnitEntity>,
  ) {}

  async create(
    dto: CreateLexicalUnitDto,
    audioPath?: string | null,
  ): Promise<LexicalUnitEntity> {
    const entity = this.repo.create({
      ...dto,
      value: normalizeValue(dto.value),
      audioPath: audioPath ?? null,
    });

    return this.repo.save(entity);
  }

  async findByValue(value: string): Promise<LexicalUnitEntity | null> {
    const v = normalizeValue(value);

    return this.repo
      .createQueryBuilder('lu')
      .where('LOWER(lu.value) = LOWER(:v)', { v })
      .getOne();
  }
}
