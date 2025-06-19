import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Cache } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as sanitizeHtml from 'sanitize-html';
import { AppLoggerService } from '../common/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLoggerService,
  ) {}

  private sanitizeUser(user: User): User {
    return {
      ...user,
      name: sanitizeHtml(user.name, { allowedTags: [], allowedAttributes: {} }),
      email: sanitizeHtml(user.email, { allowedTags: [], allowedAttributes: {} }),
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${createUserDto.email}`);
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    await this.cacheManager.del('users_list');
    this.logger.log(`User created: ${savedUser.email}`);
    return this.sanitizeUser(savedUser);
  }

  async findAll(filters: { role?: string; sortBy?: string; order?: string }): Promise<User[]> {
    this.logger.log(`Fetching users with filters: ${JSON.stringify(filters)}`);
    const cacheKey = `users_list_${filters.role || 'all'}_${filters.sortBy || 'name'}_${filters.order || 'asc'}`;
    let users = await this.cacheManager.get<User[]>(cacheKey);
    if (!users) {
      const query = this.userRepository.createQueryBuilder('user');
      if (filters.role) {
        query.where('user.role = :role', { role: filters.role });
      }
      if (filters.sortBy) {
        const order = filters.order === 'desc' ? 'DESC' : 'ASC';
        query.orderBy(`user.${filters.sortBy}`, order);
      }
      users = await query.getMany();
      users = users.map(user => this.sanitizeUser(user));
      await this.cacheManager.set(cacheKey, users);
      this.logger.log(`Users cached: ${cacheKey}`);
    }
    return users;
  }

  async findOne(id: number, requestingUser: any): Promise<User> {
    this.logger.log(`Fetching user ID: ${id} by user: ${requestingUser.email}`);
    if (isNaN(id)) {
      throw new NotFoundException('Invalid user ID');
    }
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`User not found: ID ${id}`);
      throw new NotFoundException('User not found');
    }
    if (requestingUser.role !== 'admin' && requestingUser.id !== id) {
      this.logger.error(`Access denied for user ${requestingUser.email} to ID ${id}`);
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Fetching user by email: ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    return user ? this.sanitizeUser(user) : null;
  }

  async update(id: number, updateUserDto: UpdateUserDto, requestingUser: any): Promise<User> {
    this.logger.log(`Updating user ID: ${id} by user: ${requestingUser.email}`);
    if (requestingUser.role !== 'admin' && requestingUser.id !== id) {
      this.logger.error(`Update denied for user ${requestingUser.email} to ID ${id}`);
      throw new ForbiddenException('You can only update your own profile');
    }
    const user = await this.findOne(id, requestingUser);
    Object.assign(user, {
      ...updateUserDto,
      name: updateUserDto.name ? sanitizeHtml(updateUserDto.name, { allowedTags: [], allowedAttributes: {} }) : user.name,
    });
    const updatedUser = await this.userRepository.save(user);
    await this.cacheManager.del('users_list');
    this.logger.log(`User updated: ${updatedUser.email}`);
    return this.sanitizeUser(updatedUser);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Deleting user ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`User not found: ID ${id}`);
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
    await this.cacheManager.del('users_list');
    this.logger.log(`User deleted: ${user.email}`);
  }

  async findInactive(): Promise<User[]> {
    this.logger.log('Fetching inactive users');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastLogin < :date OR user.lastLogin IS NULL', { date: thirtyDaysAgo })
      .getMany();

    if (inactiveUsers.length > 0) {
      this.eventEmitter.emit('users.inactive', { users: inactiveUsers });
      this.logger.log(`Found ${inactiveUsers.length} inactive users`);
    }

    return inactiveUsers.map(user => this.sanitizeUser(user));
  }

  async updateLastLogin(id: number): Promise<void> {
    this.logger.log(`Updating last login for user ID: ${id}`);
    await this.userRepository.update(id, { lastLogin: new Date() });
  }
}