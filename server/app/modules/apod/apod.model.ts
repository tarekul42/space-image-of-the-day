import mongoose, { Schema, Document } from 'mongoose';

export interface IApod extends Document {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  service_version?: string;
  copyright?: string;
  object_type: string;
  constellation: string;
  more_info_url: string;
  createdAt: Date;
  updatedAt: Date;
}

const apodSchema = new Schema<IApod>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    hdurl: {
      type: String,
    },
    media_type: {
      type: String,
      required: true,
    },
    service_version: {
      type: String,
    },
    copyright: {
      type: String,
    },
    object_type: {
      type: String,
      default: 'Unknown',
    },
    constellation: {
      type: String,
      default: 'Unknown',
    },
    more_info_url: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IApod>('Apod', apodSchema);
