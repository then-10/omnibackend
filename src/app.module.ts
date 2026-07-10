import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SpacesModule } from './spaces/spaces.module';
import { FoldersModule } from './folders/folders.module';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { AutomationModule } from './automation/automation.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 100,
    }]),
    AuthModule,
    UsersModule,
    WorkspacesModule,
    SpacesModule,
    FoldersModule,
    ListsModule,
    TasksModule,
    CommentsModule,
    NotificationsModule,
    SearchModule,
    AutomationModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
