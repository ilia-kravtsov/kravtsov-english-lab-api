import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LexicalUnitEntity } from './entities/lexical-unit.entity';
import { LexicalUnitsController } from './lexical-units.controller';
import { LexicalUnitsService } from './lexical-units.service';

@Module({
  imports: [TypeOrmModule.forFeature([LexicalUnitEntity])],
  controllers: [LexicalUnitsController],
  providers: [LexicalUnitsService],
  exports: [LexicalUnitsService],
})
export class LexicalUnitsModule {}
