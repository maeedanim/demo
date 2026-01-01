import { Document } from 'mongoose';
import { IUser } from './user.interface';
import { IPost } from './post.interface';
export interface IComment extends Document {
  // _id: string;
  text: string;
  deleted: boolean;
  user: IUser | string;
  post: IPost | string;
  createdAt: Date;
  updatedAt: Date;
}
