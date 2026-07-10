import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    // Verificar conexión
    try {
      await this.elasticsearchService.ping();
      console.log('✅ Elasticsearch connected');
    } catch (error) {
      console.warn('⚠️ Elasticsearch not available, search will be limited');
    }
  }

  async indexTask(task: any) {
    try {
      await this.elasticsearchService.index({
        index: 'tasks',
        id: task.id,
        body: {
          title: task.title,
          description: task.description,
          status: task.status,
          listId: task.listId,
          workspaceId: task.workspaceId,
          assigneeIds: task.assigneeIds || [],
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error indexing task:', error);
    }
  }

  async searchTasks(query: string, workspaceId: string, limit: number = 50) {
    try {
      const result = await this.elasticsearchService.search({
        index: 'tasks',
        body: {
          query: {
            bool: {
              must: {
                multi_match: {
                  query,
                  fields: ['title^3', 'description'],
                  fuzziness: 'AUTO',
                },
              },
              filter: {
                term: { workspaceId },
              },
            },
          },
          size: limit,
        },
      });
      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async deleteTask(id: string) {
    try {
      await this.elasticsearchService.delete({
        index: 'tasks',
        id,
      });
    } catch (error) {
      console.error('Error deleting task from index:', error);
    }
  }

  async updateTask(id: string, data: any) {
    try {
      await this.elasticsearchService.update({
        index: 'tasks',
        id,
        body: {
          doc: data,
        },
      });
    } catch (error) {
      console.error('Error updating task in index:', error);
    }
  }
}
