import { IsString, IsDateString } from 'class-validator';
import { IsNotBlank } from '@/decorators/input-validation.decorator';

export class CreateExperienceDto {
  @IsNotBlank()
  @IsString()
  title: string;

  @IsNotBlank()
  @IsString()
  company: string;

  @IsNotBlank()
  @IsString()
  description: string;

  @IsNotBlank()
  @IsDateString()
  startDate: string;

  @IsNotBlank()
  @IsDateString()
  endDate: string;
}
