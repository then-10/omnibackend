import { IsString, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  spaceId: string;
}
