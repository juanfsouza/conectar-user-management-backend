import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'user'], example: 'admin' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt'], example: 'name' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], example: 'asc' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query('role') role: string, @Query('sortBy') sortBy: string, @Query('order') order: string) {
    return this.usersService.findAll({ role, sortBy, order });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@Request() req) {
    const userId = req.user.id;
    return this.usersService.findOne(userId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(+id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(+id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('inactive')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List inactive users (admin only)' })
  @ApiResponse({ status: 200, description: 'Inactive users listed', type: [User] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findInactive() {
    return this.usersService.findInactive();
  }
}