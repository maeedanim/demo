import { Document } from 'mongoose';
export interface IExperience extends Document {
  // _id: string;
  title: string;
  company: string;
  description: string;
  startDate: Date;
  endDate: Date;
  deleted: boolean;
  user: string;
}
