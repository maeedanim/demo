import { Document } from 'mongoose';
import { IUser } from './user.interface';
export interface IPost extends Document {
  // _id: string;
  title: string;
  content: string;
  deleted: boolean;
  user: IUser['_id'];
}
