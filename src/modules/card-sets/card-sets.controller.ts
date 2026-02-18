import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CardSetsService } from './card-sets.service';
import { CreateCardSetDto } from './dto/create-card-set.dto';
import { UpdateCardSetDto } from './dto/update-card-set.dto';

@Controller('card-sets')
@UseGuards(JwtAuthGuard)
export class CardSetsController {
  constructor(private readonly service: CardSetsService) {}

  @Get()
  async list(@CurrentUser('userId') userId: string) {
    const sets = await this.service.list(userId);
    return sets.map((x) => this.service.toDto(x));
  }

  @Get(':id')
  async get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    const set = await this.service.getById(userId, id);
    return this.service.toDto(set);
  }

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateCardSetDto) {
    const created = await this.service.create(userId, dto);
    return this.service.toDto(created);
  }

  @Put(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCardSetDto,
  ) {
    const updated = await this.service.update(userId, id, dto);
    return this.service.toDto(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    await this.service.remove(userId, id);
  }
}
