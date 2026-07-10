import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    // Verificar acceso a la tarea
    await this.tasksService.findOne(dto.taskId, userId);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId: dto.taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByTask(taskId: string, userId: string) {
    await this.tasksService.findOne(taskId, userId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    // Solo el autor o admin puede eliminar
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    return this.prisma.comment.delete({ where: { id } });
  }
}
