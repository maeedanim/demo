import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  uname_email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
