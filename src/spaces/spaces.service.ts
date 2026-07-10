import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class SpacesService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
  ) {}

  async create(userId: string, dto: CreateSpaceDto) {
    const isMember = await this.workspacesService.isMember(dto.workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    return this.prisma.space.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: dto.workspaceId,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.space.findMany({
      where: { workspaceId },
      include: {
        folders: {
          include: {
            lists: true,
          },
        },
        lists: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        workspace: true,
        folders: {
          include: {
            lists: {
              include: {
                tasks: true,
              },
            },
          },
        },
        lists: {
          include: {
            tasks: true,
          },
        },
      },
    });
    if (!space) throw new NotFoundException('Space not found');
    const isMember = await this.workspacesService.isMember(space.workspaceId, userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return space;
  }

  async update(id: string, dto: UpdateSpaceDto, userId: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) throw new NotFoundException('Space not found');
    const isMember = await this.workspacesService.isMember(space.workspaceId, userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return this.prisma.space.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) throw new NotFoundException('Space not found');
    const isMember = await this.workspacesService.isMember(space.workspaceId, userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return this.prisma.space.delete({ where: { id } });
  }
}
