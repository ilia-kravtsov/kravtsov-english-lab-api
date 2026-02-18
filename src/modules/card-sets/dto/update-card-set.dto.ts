import { PartialType } from '@nestjs/mapped-types';
import { CreateCardSetDto } from './create-card-set.dto';

export class UpdateCardSetDto extends PartialType(CreateCardSetDto) {}
