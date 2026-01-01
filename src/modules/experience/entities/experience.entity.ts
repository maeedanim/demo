import { User } from '@/modules/user/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';

export type ExperienceDocument = HydratedDocument<Experience>;

@Schema({ timestamps: true })
export class Experience {
  @Prop()
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop()
  description: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: schema.Types.ObjectId, ref: User.name, required: true })
  user: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);
