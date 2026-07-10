import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async create(userId: string, dto: CreateFolderDto) {
    // Verificar acceso al espacio
    await this.spacesService.findOne(dto.spaceId, userId);
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        description: dto.description,
        spaceId: dto.spaceId,
      },
    });
  }

  async findBySpace(spaceId: string, userId: string) {
    await this.spacesService.findOne(spaceId, userId);
    return this.prisma.folder.findMany({
      where: { spaceId },
      include: {
        lists: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        space: true,
        lists: {
          include: {
            tasks: true,
          },
        },
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.spacesService.findOne(folder.spaceId, userId);
    return folder;
  }

  async update(id: string, dto: UpdateFolderDto, userId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.spacesService.findOne(folder.spaceId, userId);
    return this.prisma.folder.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.spacesService.findOne(folder.spaceId, userId);
    return this.prisma.folder.delete({ where: { id } });
  }
}
