import { Exclude } from 'class-transformer';
import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {LexicalUnitEntity} from "../../lexical-units/entities/lexical-unit.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  refreshToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  resetPasswordToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  resetPasswordExpires: Date | null;

  @Column({ type: 'boolean', default: false })
  cardsInitialized: boolean;

  @OneToMany(() => LexicalUnitEntity, (lu) => lu.user)
  lexicalUnits: LexicalUnitEntity[];
}
