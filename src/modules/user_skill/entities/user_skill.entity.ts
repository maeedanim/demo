import { Experience } from '@/modules/experience/entities/experience.entity';
import { Skill } from './skill.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';

export type UserSkillDocument = HydratedDocument<UserSkill>;

@Schema({ timestamps: true })
export class UserSkill {
  @Prop({ type: schema.Types.ObjectId, ref: User.name, required: true })
  user: string;

  @Prop({ type: schema.Types.ObjectId, ref: Skill.name, required: true })
  skill: string;

  @Prop({ type: schema.Types.ObjectId, ref: Experience.name, required: false })
  experience: string;
}

export const UserSkillSchema = SchemaFactory.createForClass(UserSkill);
