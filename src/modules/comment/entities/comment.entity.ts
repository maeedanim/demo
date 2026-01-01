import { User } from '../../../modules/user/entities/user.entity';
import { Post } from '../../../modules/post/entities/post.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  text: string;

  @Prop({ type: schema.Types.ObjectId, ref: User.name, required: true })
  user: User;

  @Prop({ type: schema.Types.ObjectId, ref: Post.name, required: true })
  post: Post;

  // removed reply feature, kept the code for future reference
  // @Prop({ type: schema.Types.ObjectId, ref: Comment.name, required: false })
  // parentComment: Comment;

  @Prop({ default: false })
  deleted: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
