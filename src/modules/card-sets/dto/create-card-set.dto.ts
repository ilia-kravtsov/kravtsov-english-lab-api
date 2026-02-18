import {IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength} from 'class-validator';

export class CreateCardSetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}
