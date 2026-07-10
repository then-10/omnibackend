import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { FoldersService } from '../folders/folders.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private foldersService: FoldersService,
    private spacesService: SpacesService,
  ) {}

  async create(userId: string, dto: CreateListDto) {
    // Verificar que la carpeta o espacio existe y el usuario tiene acceso
    if (dto.folderId) {
      await this.foldersService.findOne(dto.folderId, userId);
    } else if (dto.spaceId) {
      await this.spacesService.findOne(dto.spaceId, userId);
    } else {
      throw new Error('Either folderId or spaceId must be provided');
    }

    return this.prisma.list.create({
      data: {
        name: dto.name,
        description: dto.description,
        spaceId: dto.spaceId || null,
        folderId: dto.folderId || null,
        position: dto.position || 0,
      },
    });
  }

  async findByFolder(folderId: string, userId: string) {
    await this.foldersService.findOne(folderId, userId);
    return this.prisma.list.findMany({
      where: { folderId },
      include: {
        tasks: true,
      },
      orderBy: { position: 'asc' },
    });
  }

  async findBySpace(spaceId: string, userId: string) {
    await this.spacesService.findOne(spaceId, userId);
    return this.prisma.list.findMany({
      where: { spaceId, folderId: null },
      include: {
        tasks: true,
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: {
        space: true,
        folder: true,
        tasks: {
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
            subtasks: true,
          },
        },
      },
    });
    if (!list) throw new NotFoundException('List not found');
    // Verificar acceso
    if (list.spaceId) {
      await this.spacesService.findOne(list.spaceId, userId);
    } else if (list.folderId) {
      await this.foldersService.findOne(list.folderId, userId);
    }
    return list;
  }

  async update(id: string, dto: UpdateListDto, userId: string) {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) throw new NotFoundException('List not found');
    if (list.spaceId) {
      await this.spacesService.findOne(list.spaceId, userId);
    } else if (list.folderId) {
      await this.foldersService.findOne(list.folderId, userId);
    }
    return this.prisma.list.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) throw new NotFoundException('List not found');
    if (list.spaceId) {
      await this.spacesService.findOne(list.spaceId, userId);
    } else if (list.folderId) {
      await this.foldersService.findOne(list.folderId, userId);
    }
    return this.prisma.list.delete({ where: { id } });
  }
}
