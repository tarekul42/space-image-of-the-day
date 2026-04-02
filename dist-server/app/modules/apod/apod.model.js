import mongoose, { Schema } from 'mongoose';
const apodSchema = new Schema({
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
}, {
    timestamps: true,
});
export default mongoose.model('Apod', apodSchema);
