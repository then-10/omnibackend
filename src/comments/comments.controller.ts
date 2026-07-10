import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(req.user.userId, dto);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId: string, @Req() req) {
    return this.commentsService.findByTask(taskId, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
