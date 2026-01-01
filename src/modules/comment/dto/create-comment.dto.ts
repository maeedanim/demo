import { IsString } from 'class-validator';
import { IsNotBlank } from '@/decorators/input-validation.decorator';

export class CreateCommentDto {
  @IsNotBlank()
  @IsString()
  text: string;
}
