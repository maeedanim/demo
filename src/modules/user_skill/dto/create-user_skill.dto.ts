import { IsString, IsOptional } from 'class-validator';
import { IsNotBlank } from '@/decorators/input-validation.decorator';

export class CreateUserSkillDto {
  @IsNotBlank()
  @IsString()
  skill: string;

  @IsOptional()
  @IsNotBlank()
  @IsString()
  experience: string;
}

export class CreateNewUserSkillDto {
  @IsNotBlank()
  @IsString()
  skillname: string;

  @IsOptional()
  @IsNotBlank()
  @IsString()
  experience: string;
}
