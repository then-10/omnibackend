import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private spacesService: SpacesService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateSpaceDto) {
    return this.spacesService.create(req.user.userId, dto);
  }

  @Get('workspace/:workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  async findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.spacesService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.spacesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSpaceDto, @Req() req) {
    return this.spacesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.spacesService.remove(id, req.user.userId);
  }
}
