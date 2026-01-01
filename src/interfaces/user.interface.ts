import { Document } from 'mongoose';
import { IPost } from './post.interface';

export interface IUser extends Document {
  //_id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  bio: string;
  picture_url: string;
  role: string;
  deleted: boolean;
  post?: IPost[];
  // createdAt: Date;
  // updatedAt: Date;
}
