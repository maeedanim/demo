import { Document } from 'mongoose';
import { IPost } from './post.interface';
import { IUser } from './user.interface';

export interface IReaction extends Document {
  // _id: string;
  post: IPost['_id'];
  user: IUser['_id'];
  status: ['Like', 'Dislike', 'Neutral']; // true for like, false for dislike
  createdAt: Date;
  updatedAt: Date;
}
