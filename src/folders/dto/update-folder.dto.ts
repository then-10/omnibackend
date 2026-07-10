import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
