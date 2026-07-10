import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListsService } from '../lists/lists.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AutomationService } from '../automation/automation.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private listsService: ListsService,
    private notificationsGateway: NotificationsGateway,
    private automationService: AutomationService,
  ) {}

  async create(userId: string, dto: CreateTaskDto) {
    // Verificar acceso a la lista
    await this.listsService.findOne(dto.listId, userId);

    // Obtener el workspaceId para notificaciones
    const list = await this.prisma.list.findUnique({
      where: { id: dto.listId },
      include: {
        space: { include: { workspace: true } },
        folder: { include: { space: { include: { workspace: true } } } },
      },
    });
    const workspaceId = list.space?.workspaceId || list.folder?.space?.workspaceId;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || 'TODO',
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        listId: dto.listId,
        parentId: dto.parentId || null,
        position: dto.position || 0,
        assignees: dto.assigneeIds ? {
          create: dto.assigneeIds.map((userId) => ({ userId })),
        } : undefined,
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notificar en tiempo real
    if (workspaceId) {
      this.notificationsGateway.notifyTaskCreated(workspaceId, task);
    }

    // Disparar automatizaciones
    await this.automationService.trigger('task.created', { task, userId });

    return task;
  }

  async findByList(listId: string, userId: string) {
    await this.listsService.findOne(listId, userId);
    return this.prisma.task.findMany({
      where: { listId, parentId: null },
      include: {
        assignees: {
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
        },
        subtasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: true,
        assignees: {
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
        },
        subtasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        comments: {
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
        },
        parent: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    // Verificar acceso a la lista
    await this.listsService.findOne(task.listId, userId);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.listsService.findOne(task.listId, userId);

    const oldStatus = task.status;

    // Si se actualizan asignados
    let assigneesData = undefined;
    if (dto.assigneeIds !== undefined) {
      // Eliminar asignaciones existentes y crear nuevas
      await this.prisma.taskAssignment.deleteMany({ where: { taskId: id } });
      assigneesData = {
        create: dto.assigneeIds.map((uid) => ({ userId: uid })),
      };
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        position: dto.position,
        ...(assigneesData ? { assignees: assigneesData } : {}),
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        list: {
          include: {
            space: { include: { workspace: true } },
            folder: { include: { space: { include: { workspace: true } } } },
          },
        },
      },
    });

    // Obtener workspaceId para notificaciones
    const list = updated.list;
    const workspaceId = list.space?.workspaceId || list.folder?.space?.workspaceId;

    // Notificar cambio de estado
    if (dto.status && dto.status !== oldStatus) {
      await this.automationService.trigger('task.status_changed', {
        task: updated,
        oldStatus,
        newStatus: dto.status,
        userId,
      });
    }

    if (workspaceId) {
      this.notificationsGateway.notifyTaskUpdated(workspaceId, updated);
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.listsService.findOne(task.listId, userId);
    return this.prisma.task.delete({ where: { id } });
  }

  async createSubtask(userId: string, parentId: string, dto: CreateTaskDto) {
    const parent = await this.prisma.task.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent task not found');
    await this.listsService.findOne(parent.listId, userId);
    return this.create(userId, { ...dto, parentId, listId: parent.listId });
  }

  async moveTask(id: string, newListId: string, userId: string, position?: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.listsService.findOne(task.listId, userId);
    await this.listsService.findOne(newListId, userId);

    return this.prisma.task.update({
      where: { id },
      data: {
        listId: newListId,
        position: position ?? 0,
      },
    });
  }

  async search(query: string, userId: string) {
    // Búsqueda básica en PostgreSQL (para producción usar Elasticsearch)
    return this.prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        list: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      take: 50,
    });
  }
}
