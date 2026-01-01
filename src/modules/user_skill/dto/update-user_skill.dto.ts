import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSkillDto } from './create-user_skill.dto';

export class UpdateUserSkillDto extends PartialType(CreateUserSkillDto) {}
