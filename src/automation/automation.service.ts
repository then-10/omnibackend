import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AutomationService {
  constructor(@InjectQueue('automation') private automationQueue: Queue) {}

  async trigger(event: string, payload: any) {
    // Encolar para procesamiento asíncrono
    await this.automationQueue.add('process-event', {
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  // Método para registrar reglas (en producción se guardarían en BD)
  async getRules(event: string) {
    // Reglas predefinidas para ejemplo
    const rules = {
      'task.created': [
        {
          id: 'notify-assignees',
          action: 'notify',
          config: { message: 'Nueva tarea asignada' },
        },
      ],
      'task.status_changed': [
        {
          id: 'notify-status-change',
          action: 'notify',
          config: { message: 'Estado de tarea actualizado' },
        },
        {
          id: 'log-activity',
          action: 'log',
          config: { level: 'info' },
        },
      ],
    };
    return rules[event] || [];
  }
}
