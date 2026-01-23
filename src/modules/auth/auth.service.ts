import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {instanceToInstance} from "class-transformer";
import {UserResponseDto} from "../users/dto/user-response.dto";
import {CreateUserDto} from "../users/dto/create-user.dto";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS'));
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const userDto: CreateUserDto = {
      ...dto,
      password: hashedPassword,
    };

    try {
      const user = await this.usersService.create(userDto) as UserResponseDto;

      const { accessToken, refreshToken } = await this.signTokens(user.id, user.email);

      await this.updateRefreshToken(user.id, refreshToken);

      return {
        user,
        accessToken,
        refreshToken,
      };

    } catch (error: any) {

      if (error?.code === '23505') {
        throw new BadRequestException('User with this email already exists');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userResponse = instanceToInstance(user) as UserResponseDto;

    const { accessToken, refreshToken } = await this.signTokens(user.id, user.email);

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  private async signTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS'));
    const hash = await bcrypt.hash(refreshToken, saltRounds);
    await this.usersService.update(userId, {
      refreshToken: hash,
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.signTokens(
        user.id,
        user.email,
      );

      await this.updateRefreshToken(user.id, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const payload = { sub: user.id, email: user.email };

    const resetToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: this.configService.get('JWT_RESET_EXPIRES_IN'),
    });

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS'));
    const hash = await bcrypt.hash(resetToken, saltRounds);

    await this.usersService.update(user.id, {
      resetPasswordToken: hash,
    });

    return resetToken;
  }

  async resetPassword(token: string, password: string) {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.resetPasswordToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS'));
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      refreshToken: null,
    });
  }
}
