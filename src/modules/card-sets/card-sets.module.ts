import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardSetsController } from './card-sets.controller';
import { CardSetsService } from './card-sets.service';
import { CardSetEntity } from './entities/card-set.entity';
import { User } from "../users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CardSetEntity, User])],
  controllers: [CardSetsController],
  providers: [CardSetsService],
  exports: [CardSetsService],
})
export class CardSetsModule {}
