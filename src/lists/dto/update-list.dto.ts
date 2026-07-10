import { IsString, IsOptional, MinLength, IsInt, Min } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}
