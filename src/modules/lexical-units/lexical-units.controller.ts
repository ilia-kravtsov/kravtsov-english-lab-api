import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile, UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {FileFieldsInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {extname, join} from 'path';
import {CreateLexicalUnitDto} from './dto/create-lexical-unit.dto';
import {LexicalUnitsService} from './lexical-units.service';
import {randomUUID} from 'crypto';
import {JwtAuthGuard} from "../../common/guards/jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {promises as fs} from 'fs';

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
    FileFieldsInterceptor(
      [
        { name: 'audio', maxCount: 1 },
        { name: 'soundMeaning', maxCount: 1 },
        { name: 'soundExample', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: UPLOADS_AUDIO_DIR,
          filename: (_req, file, cb) => {
            const ext = safeExt(file.originalname, '.webm');
            cb(null, `${randomUUID()}${ext}`);
          },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
      },
    ),
  )

  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFiles()
    files?: {
      audio?: Express.Multer.File[];
      soundMeaning?: Express.Multer.File[];
      soundExample?: Express.Multer.File[];
    },
  ) {
    const audioFile = files?.audio?.[0];
    const meaningFile = files?.soundMeaning?.[0];
    const exampleFile = files?.soundExample?.[0];

    const audioPath = audioFile ? `lexical-audio/${audioFile.filename}` : null;
    const soundMeaningPath = meaningFile ? `lexical-audio/${meaningFile.filename}` : null;
    const soundExamplePath = exampleFile ? `lexical-audio/${exampleFile.filename}` : null;

    const created = await this.service.create(userId, dto, audioPath, soundMeaningPath, soundExamplePath);
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

  @Get('suggest')
  async suggest(
    @CurrentUser('userId') userId: string,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || !query.trim()) return [];
    return this.service.suggestByValue(userId, query, limit);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'audio', maxCount: 1 },
        { name: 'soundMeaning', maxCount: 1 },
        { name: 'soundExample', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: UPLOADS_AUDIO_DIR,
          filename: (_req, file, cb) => {
            const ext = safeExt(file.originalname, '.webm');
            cb(null, `${randomUUID()}${ext}`);
          },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
      },
    ),
  )

  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFiles()
    files?: {
      audio?: Express.Multer.File[];
      soundMeaning?: Express.Multer.File[];
      soundExample?: Express.Multer.File[];
    },
  ) {
    const audioFile = files?.audio?.[0];
    const meaningFile = files?.soundMeaning?.[0];
    const exampleFile = files?.soundExample?.[0];

    const audioPath = audioFile ? `lexical-audio/${audioFile.filename}` : null;
    const soundMeaningPath = meaningFile ? `lexical-audio/${meaningFile.filename}` : null;
    const soundExamplePath = exampleFile ? `lexical-audio/${exampleFile.filename}` : null;

    const updated = await this.service.update(userId, id, dto, audioPath, soundMeaningPath, soundExamplePath);
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
