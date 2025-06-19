import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AppLoggerService } from '../common/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    this.logger.log(`Registering user: ${registerDto.email}`);
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.error(`User already exists: ${registerDto.email}`);
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: 'user',
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`User registered successfully: ${registerDto.email}`);
    return { accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    this.logger.log(`Logging in user: ${loginDto.email}`);
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.password) {
      this.logger.error(`Invalid credentials for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.error(`Invalid password for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`User logged in successfully: ${loginDto.email}`);
    return { accessToken };
  }

  async googleLogin(profile: any): Promise<{ accessToken: string }> {
    this.logger.log(`Processing Google login for: ${profile.emails[0].value}`);
    let user = await this.usersService.findByEmail(profile.emails[0].value);
    if (!user) {
      user = await this.usersService.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'user',
      });
      this.logger.log(`Created new user via Google: ${profile.emails[0].value}`);
    }

    await this.usersService.updateLastLogin(user.id);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`Google login successful: ${profile.emails[0].value}`);
    return { accessToken };
  }

  async validateUser(payload: any): Promise<any> {
    this.logger.log(`Validating JWT for user: ${payload.email}`);
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      this.logger.error(`User not found: ${payload.email}`);
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}