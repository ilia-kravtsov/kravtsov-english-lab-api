import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query, UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {FileFieldsInterceptor, FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {extname, join} from 'path';
import {CreateLexicalUnitDto} from './dto/create-lexical-unit.dto';
import {LexicalUnitsService} from './lexical-units.service';
import {randomUUID} from 'crypto';
import {JwtAuthGuard} from "../../common/guards/jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import { promises as fs } from 'fs';

function safeExt(originalName: string, fallback: string) {
  const e = extname(originalName || '').toLowerCase();
  return e && e.length <= 10 ? e : fallback;
}

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const UPLOADS_AUDIO_DIR = join(UPLOADS_DIR, 'lexical-audio');

async function ensureUploadsDirs() {
  await fs.mkdir(UPLOADS_AUDIO_DIR, { recursive: true });
}

@Controller('lexical-units')
@UseGuards(JwtAuthGuard)
export class LexicalUnitsController {
  constructor(private readonly service: LexicalUnitsService) {
    void ensureUploadsDirs();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: UPLOADS_AUDIO_DIR,
        filename: (_req, file, cb) => {
          const ext = safeExt(file.originalname, '.webm');
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )

  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const audioPath = file ? `lexical-audio/${file.filename}` : null;
    const created = await this.service.create(userId, dto, audioPath);
    return this.service.toDto(created);
  }

  @Get('search')
  async search(
    @CurrentUser('userId') userId: string,
    @Query('value') value?: string,
    ) {
    if (!value || !value.trim()) return null;

    const found = await this.service.findByValue(userId, value);

    if (!found) return null;

    return this.service.toDto(found);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: UPLOADS_AUDIO_DIR,
        filename: (_req, file, cb) => {
          const ext = safeExt(file.originalname, '.webm');
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )

  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const audioPath = file ? `lexical-audio/${file.filename}` : null;
    const updated = await this.service.update(userId, id, dto, audioPath);
    return this.service.toDto(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.service.remove(userId, id);
  }
}
