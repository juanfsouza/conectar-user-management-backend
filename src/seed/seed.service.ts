import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AppLoggerService } from '../common/logger.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: AppLoggerService,
  ) {}

  async seedAdmin() {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.usersService.create({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });
    this.logger.log('Admin user created successfully');
  }
}