import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateListDto) {
    return this.listsService.create(req.user.userId, dto);
  }

  @Get('folder/:folderId')
  async findByFolder(@Param('folderId') folderId: string, @Req() req) {
    return this.listsService.findByFolder(folderId, req.user.userId);
  }

  @Get('space/:spaceId')
  async findBySpace(@Param('spaceId') spaceId: string, @Req() req) {
    return this.listsService.findBySpace(spaceId, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.listsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateListDto, @Req() req) {
    return this.listsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.listsService.remove(id, req.user.userId);
  }
}
