import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import {UsersModule} from "./modules/users/users.module";
import {AuthModule} from "./modules/auth/auth.module";
import { ThrottlerModule } from '@nestjs/throttler';
import {LexicalUnitsModule} from "./modules/lexical-units/lexical-units.module";
import {CardSetsModule} from "./modules/card-sets/card-sets.module";
import {CardsModule} from "./modules/cards/cards.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    LexicalUnitsModule,
    CardSetsModule,
    CardsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
