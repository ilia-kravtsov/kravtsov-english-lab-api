import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardEntity } from './entities/card.entity';
import { CardSetEntity } from '../card-sets/entities/card-set.entity';
import { LexicalUnitEntity } from '../lexical-units/entities/lexical-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CardEntity, CardSetEntity, LexicalUnitEntity])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
