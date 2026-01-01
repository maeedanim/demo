import { User } from '../../../modules/user/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop()
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: schema.Types.ObjectId, ref: User.name, required: true })
  user: User;

  @Prop({ default: false })
  deleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
