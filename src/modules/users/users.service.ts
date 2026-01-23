import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from "./dto/create-user.dto";
import { instanceToInstance } from "class-transformer";
import { UserResponseDto } from "./dto/user-response.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userDto: CreateUserDto): Promise<UserResponseDto> {
    const newUser = this.usersRepository.create(userDto);
    const savedUser = await this.usersRepository.save(newUser);
    return instanceToInstance(savedUser) as UserResponseDto;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async update(userId: string, attrs: Partial<User>): Promise<void> {
    await this.usersRepository.update(userId, attrs);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }
}
