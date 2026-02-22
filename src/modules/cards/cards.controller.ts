import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller('card-sets/:cardSetId/cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly service: CardsService) {}

  @Get()
  async list(
    @CurrentUser('userId') userId: string,
    @Param('cardSetId') cardSetId: string,
    @Query('include') include?: string,
  ) {
    const withLexicalUnit = include === 'lexicalUnit';

    const cards = withLexicalUnit
      ? await this.service.listWithLexicalUnit(userId, cardSetId)
      : await this.service.list(userId, cardSetId);

    return cards.map((c) =>
      withLexicalUnit ? this.service.toDtoWithLexicalUnit(c) : this.service.toDto(c),
    );
  }

  @Get(':cardId')
  async get(
    @CurrentUser('userId') userId: string,
    @Param('cardSetId') cardSetId: string,
    @Param('cardId') cardId: string,
  ) {
    const card = await this.service.getById(userId, cardSetId, cardId);
    return this.service.toDto(card);
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Param('cardSetId') cardSetId: string,
    @Body() dto: CreateCardDto,
  ) {
    const created = await this.service.create(userId, cardSetId, dto);
    return this.service.toDto(created);
  }

  @Put(':cardId')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('cardSetId') cardSetId: string,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    const updated = await this.service.update(userId, cardSetId, cardId, dto);
    return this.service.toDto(updated);
  }

  @Delete(':cardId')
  @HttpCode(204)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('cardSetId') cardSetId: string,
    @Param('cardId') cardId: string,
  ) {
    await this.service.remove(userId, cardSetId, cardId);
  }
}
