import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
