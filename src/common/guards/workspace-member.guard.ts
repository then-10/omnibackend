import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('User not authenticated');

    // Obtener workspaceId de params o body
    const workspaceId = req.params.workspaceId || 
                        req.params.id || 
                        req.body.workspaceId;

    if (!workspaceId) {
      // Si no hay workspaceId, intentar obtener de la entidad
      // En este guard simplificado, si no hay workspaceId, permitimos
      // pero los servicios individuales deben verificar
      return true;
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    req.workspaceMember = member;
    return true;
  }
}
