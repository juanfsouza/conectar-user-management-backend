import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  @OnEvent('users.inactive')
  handleInactiveUsers(payload: { users: User[] }) {
    console.log(`Inactive users detected: ${payload.users.map(u => u.email).join(', ')}`);
  }
}
export class NotificationsModule {}