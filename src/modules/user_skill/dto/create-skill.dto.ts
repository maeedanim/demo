import { IsString } from 'class-validator';
import { IsNotBlank } from '@/decorators/input-validation.decorator';

export class CreateSkillDto {
  @IsNotBlank()
  @IsString()
  name: string;
}
