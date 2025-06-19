import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const redisConfig = (configService: ConfigService) => ({
  store: redisStore,
  host: configService.get('REDIS_HOST'),
  port: +configService.get('REDIS_PORT'),
  ttl: 300,
});