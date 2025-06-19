import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SeedService } from './seed.service';
import { AppLoggerService } from '../common/logger.service';

@Module({
  imports: [UsersModule],
  providers: [SeedService, AppLoggerService],
  exports: [SeedService],
})
export class SeedModule {}