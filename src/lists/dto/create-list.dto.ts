import { IsString, IsOptional, MinLength, IsUUID, IsInt, Min } from 'class-validator';

export class CreateListDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  spaceId?: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}
