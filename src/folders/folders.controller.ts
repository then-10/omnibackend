import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateFolderDto) {
    return this.foldersService.create(req.user.userId, dto);
  }

  @Get('space/:spaceId')
  async findBySpace(@Param('spaceId') spaceId: string, @Req() req) {
    return this.foldersService.findBySpace(spaceId, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.foldersService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFolderDto, @Req() req) {
    return this.foldersService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.foldersService.remove(id, req.user.userId);
  }
}
