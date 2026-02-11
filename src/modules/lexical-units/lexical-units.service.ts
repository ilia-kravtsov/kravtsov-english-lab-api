import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LexicalUnitEntity } from './entities/lexical-unit.entity';
import { CreateLexicalUnitDto } from './dto/create-lexical-unit.dto';

@Injectable()
export class LexicalUnitsService {
  constructor(
    @InjectRepository(LexicalUnitEntity)
    private readonly repo: Repository<LexicalUnitEntity>,
  ) {}

  async create(dto: CreateLexicalUnitDto, audioPath?: string | null): Promise<LexicalUnitEntity> {
    const entity = this.repo.create({
      ...dto,
      audioPath: audioPath ?? null,
    });

    return this.repo.save(entity);
  }
}
