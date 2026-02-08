import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
}, {
  timestamps: true,
});

export const User = mongoose.model<IUser>('User', userSchema);
