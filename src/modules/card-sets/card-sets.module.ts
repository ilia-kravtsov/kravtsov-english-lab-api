import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardSetsController } from './card-sets.controller';
import { CardSetsService } from './card-sets.service';
import { CardSetEntity } from './entities/card-set.entity';
import { User } from "../users/entities/user.entity";
import {CardEntity} from "../cards/entities/card.entity";
import {LexicalUnitEntity} from "../lexical-units/entities/lexical-unit.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CardSetEntity, User, CardEntity, LexicalUnitEntity,])],
  controllers: [CardSetsController],
  providers: [CardSetsService],
  exports: [CardSetsService],
})
export class CardSetsModule {}
