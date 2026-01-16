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

  async create(userDto: CreateUserDto) {
    const newUser = this.usersRepository.create(userDto);
    const savedUser = await this.usersRepository.save(newUser);
    return instanceToInstance(savedUser) as UserResponseDto;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }
}
