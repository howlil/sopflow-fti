import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@fti.example', description: 'Email pengguna terdaftar' })
  @IsEmail({}, { message: 'Email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'KataSandiKuat123', minLength: 1, description: 'Kata sandi' })
  @IsString({ message: 'Kata sandi wajib diisi' })
  @MinLength(1, { message: 'Kata sandi wajib diisi' })
  password!: string;
}
