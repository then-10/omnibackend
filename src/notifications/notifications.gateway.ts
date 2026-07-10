import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set de socketIds
  private workspaceSockets = new Map<string, Set<string>>(); // workspaceId -> Set de socketIds

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Guardar socket por usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      client.data.userId = userId;

      // Unir a salas de workspaces (se unirá cuando sepa a qué workspace pertenece)
      // El cliente puede enviar un mensaje 'join-workspace' con el workspaceId
      client.on('join-workspace', (workspaceId: string) => {
        if (!this.workspaceSockets.has(workspaceId)) {
          this.workspaceSockets.set(workspaceId, new Set());
        }
        this.workspaceSockets.get(workspaceId).add(client.id);
        client.join(`workspace-${workspaceId}`);
      });

      client.on('leave-workspace', (workspaceId: string) => {
        if (this.workspaceSockets.has(workspaceId)) {
          this.workspaceSockets.get(workspaceId).delete(client.id);
        }
        client.leave(`workspace-${workspaceId}`);
      });

    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    // Limpiar de workspaces
    for (const [workspaceId, sockets] of this.workspaceSockets) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.workspaceSockets.delete(workspaceId);
        }
      }
    }
  }

  notifyTaskCreated(workspaceId: string, task: any) {
    this.server.to(`workspace-${workspaceId}`).emit('task:created', task);
  }

  notifyTaskUpdated(workspaceId: string, task: any) {
    this.server.to(`workspace-${workspaceId}`).emit('task:updated', task);
  }

  notifyTaskDeleted(workspaceId: string, taskId: string) {
    this.server.to(`workspace-${workspaceId}`).emit('task:deleted', { taskId });
  }

  notifyCommentCreated(workspaceId: string, comment: any) {
    this.server.to(`workspace-${workspaceId}`).emit('comment:created', comment);
  }

  // Notificar a un usuario específico
  notifyUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}
