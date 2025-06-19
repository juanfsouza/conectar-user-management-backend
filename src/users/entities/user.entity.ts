import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'hashed_password', nullable: true })
  @Column({ nullable: true })
  password: string;

  @ApiProperty({ example: 'user', enum: ['admin', 'user'] })
  @Column({ default: 'user' })
  role: string;

  @ApiProperty({ example: '2023-10-01T10:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-10-01T10:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: '2023-10-01T10:00:00Z', nullable: true })
  @Column({ nullable: true })
  lastLogin: Date;
}