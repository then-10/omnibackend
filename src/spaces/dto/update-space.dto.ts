import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateSpaceDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
