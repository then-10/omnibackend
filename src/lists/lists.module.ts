import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { PrismaService } from '../prisma/prisma.service';
import { FoldersModule } from '../folders/folders.module';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [FoldersModule, SpacesModule],
  controllers: [ListsController],
  providers: [ListsService, PrismaService],
})
export class ListsModule {}
