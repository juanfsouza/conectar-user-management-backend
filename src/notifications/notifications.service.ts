import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs/promises';

@Injectable()
export class NotificationsService {
  private readonly notificationsFile = 'notifications.json';

  @OnEvent('users.inactive')
  async handleInactiveUsers(payload: { users: User[] }) {
    const notification = {
      timestamp: new Date().toISOString(),
      message: `Inactive users detected: ${payload.users.map(u => u.email).join(', ')}`,
      users: payload.users.map(u => ({ id: u.id, email: u.email, lastLogin: u.lastLogin })),
    };

    console.log(notification.message);

    try {
      type Notification = {
        timestamp: string;
        message: string;
        users: { id: number; email: string; lastLogin: Date }[];
      };
      let notifications: Notification[] = [];
      try {
        const data = await fs.readFile(this.notificationsFile, 'utf-8');
        notifications = JSON.parse(data);
      } catch (error) {
      }
      notifications.push(notification);
      await fs.writeFile(this.notificationsFile, JSON.stringify(notifications, null, 2));
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  }
}