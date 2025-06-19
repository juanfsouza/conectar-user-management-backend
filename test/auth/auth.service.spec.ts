import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service'
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppLoggerService } from '../../src/common/logger.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '../../src/auth/dto/auth.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let logger: AppLoggerService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$...',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    logger = module.get<AppLoggerService>(AppLoggerService);
  });

  describe('register', () => {
    it('should register a new user and return a token', async () => {
      const registerDto: RegisterDto = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await authService.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashed-password',
        role: 'user',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
      expect(logger.log).toHaveBeenCalledWith('User registered successfully: test@example.com');
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      expect(logger.error).toHaveBeenCalledWith('User already exists: test@example.com');
    });
  });

  describe('login', () => {
    it('should login a user and return a token', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(usersService, 'updateLastLogin').mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
      expect(logger.log).toHaveBeenCalledWith('User logged in successfully: test@example.com');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(logger.error).toHaveBeenCalledWith('Invalid password for: test@example.com');
    });
  });

  describe('googleLogin', () => {
    it('should login with Google and return a token for existing user', async () => {
      const profile = { emails: [{ value: 'test@example.com' }], displayName: 'Test User' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'updateLastLogin').mockResolvedValue();

      const result = await authService.googleLogin(profile);

      expect(usersService.findByEmail).toHaveBeenCalledWith(profile.emails[0].value);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
      expect(logger.log).toHaveBeenCalledWith('Google login successful: test@example.com');
    });

    it('should create a new user and login with Google', async () => {
      const profile = { emails: [{ value: 'new@example.com' }], displayName: 'New User' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'updateLastLogin').mockResolvedValue();

      const result = await authService.googleLogin(profile);

      expect(usersService.findByEmail).toHaveBeenCalledWith(profile.emails[0].value);
      expect(usersService.create).toHaveBeenCalledWith({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'user',
      });
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
      expect(logger.log).toHaveBeenCalledWith('Created new user via Google: new@example.com');
    });
  });
});