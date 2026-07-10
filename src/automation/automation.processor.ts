import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Processor('automation')
export class AutomationProcessor {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @Process('process-event')
  async handleProcessEvent(job: Job) {
    const { event, payload } = job.data;
    console.log(`Processing automation event: ${event}`, payload);

    // Aquí se ejecutarían las reglas configuradas
    // Por ahora, solo logging
    switch (event) {
      case 'task.created':
        await this.handleTaskCreated(payload);
        break;
      case 'task.status_changed':
        await this.handleStatusChange(payload);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }
  }

  private async handleTaskCreated(payload: any) {
    const { task, userId } = payload;
    // Notificar a los asignados
    if (task.assignees && task.assignees.length > 0) {
      for (const assignment of task.assignees) {
        if (assignment.userId !== userId) {
          this.notificationsGateway.notifyUser(assignment.userId, 'notification', {
            type: 'task_assigned',
            taskId: task.id,
            taskTitle: task.title,
            assignedBy: userId,
          });
        }
      }
    }
  }

  private async handleStatusChange(payload: any) {
    const { task, oldStatus, newStatus, userId } = payload;
    // Log de actividad
    await this.prisma.$executeRaw`
      INSERT INTO "ActivityLog" ("id", "taskId", "userId", "action", "metadata", "createdAt")
      VALUES (gen_random_uuid(), ${task.id}, ${userId}, 'status_change', 
              ${JSON.stringify({ oldStatus, newStatus })}, NOW())
    `;
  }
}
