import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, dto);
  }

  @Get('list/:listId')
  async findByList(@Param('listId') listId: string, @Req() req) {
    return this.tasksService.findByList(listId, req.user.userId);
  }

  @Get('search')
  async search(@Query('q') query: string, @Req() req) {
    return this.tasksService.search(query, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req) {
    return this.tasksService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.tasksService.remove(id, req.user.userId);
  }

  @Post(':id/subtasks')
  async createSubtask(@Param('id') parentId: string, @Body() dto: CreateTaskDto, @Req() req) {
    return this.tasksService.createSubtask(req.user.userId, parentId, dto);
  }

  @Patch(':id/move')
  async move(@Param('id') id: string, @Body() body: { listId: string; position?: number }, @Req() req) {
    return this.tasksService.moveTask(id, body.listId, req.user.userId, body.position);
  }
}
