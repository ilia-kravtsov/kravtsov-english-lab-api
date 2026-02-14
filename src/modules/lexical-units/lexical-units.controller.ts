import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Put,
  Param,
  Delete,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateLexicalUnitDto } from './dto/create-lexical-unit.dto';
import { LexicalUnitsService } from './lexical-units.service';
import { randomUUID } from 'crypto';

function safeExt(originalName: string) {
  const e = extname(originalName || '').toLowerCase();
  return e && e.length <= 10 ? e : '.webm';
}

@Controller('lexical-units')
export class LexicalUnitsController {
  constructor(private readonly service: LexicalUnitsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/lexical-audio',
        filename: (_req, file, cb) => {
          const ext = safeExt(file.originalname);
          const name = `${randomUUID()}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )

  async create(
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const audioPath = file ? `lexical-audio/${file.filename}` : null;

    const created = await this.service.create(dto, audioPath);

    return {
      id: created.id,
      type: created.type,
      value: created.value,
      translation: created.translation ?? null,
      transcription: created.transcription ?? null,
      meaning: created.meaning ?? null,
      antonyms: created.antonyms ?? null,
      synonyms: created.synonyms ?? null,
      partsOfSpeech: created.partsOfSpeech ?? null,
      examples: created.examples ?? null,
      comment: created.comment ?? null,
      audioUrl: created.audioPath ? `/uploads/${created.audioPath}` : null,
    };
  }

  @Get('search')
  async search(@Query('value') value?: string) {
    if (!value || !value.trim()) return null;

    const found = await this.service.findByValue(value);

    if (!found) return null;

    return {
      id: found.id,
      type: found.type,
      value: found.value,
      translation: found.translation ?? null,
      transcription: found.transcription ?? null,
      meaning: found.meaning ?? null,
      antonyms: found.antonyms ?? null,
      synonyms: found.synonyms ?? null,
      partsOfSpeech: found.partsOfSpeech ?? null,
      examples: found.examples ?? null,
      comment: found.comment ?? null,
      audioUrl: found.audioPath ? `/uploads/${found.audioPath}` : null,
    };
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/lexical-audio',
        filename: (_req, file, cb) => {
          const ext = safeExt(file.originalname);
          const name = `${randomUUID()}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: CreateLexicalUnitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const audioPath = file ? `lexical-audio/${file.filename}` : null;

    const updated = await this.service.update(id, dto, audioPath);

    return {
      id: updated.id,
      type: updated.type,
      value: updated.value,
      translation: updated.translation ?? null,
      transcription: updated.transcription ?? null,
      meaning: updated.meaning ?? null,
      antonyms: updated.antonyms ?? null,
      synonyms: updated.synonyms ?? null,
      partsOfSpeech: updated.partsOfSpeech ?? null,
      examples: updated.examples ?? null,
      comment: updated.comment ?? null,
      audioUrl: updated.audioPath ? `/uploads/${updated.audioPath}` : null,
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
