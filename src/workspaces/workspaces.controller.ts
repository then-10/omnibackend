import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Req() req) {
    return this.workspacesService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  async findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto, @Req() req) {
    return this.workspacesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(WorkspaceMemberGuard)
  async remove(@Param('id') id: string, @Req() req) {
    return this.workspacesService.remove(id, req.user.userId);
  }
}
