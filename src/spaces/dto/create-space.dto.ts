import { IsString, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  workspaceId: string;
}
