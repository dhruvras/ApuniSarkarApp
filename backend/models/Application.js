import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['income', 'domicile', 'caste', 'character'],
    },
    serviceName: {
      type: String,
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    tehsil: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      annualIncome: { type: String },
      casteCategory: { type: String },
      purpose: { type: String },
      fatherOrHusbandName: { type: String },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    certificateNumber: {
      type: String,
      index: true,
    },
    issuedAt: {
      type: Date,
    },
    officerRemarks: {
      type: String,
    },
    timeline: [
      {
        stage: { type: String, required: true },
        status: { type: String, enum: ['completed', 'current', 'upcoming'], default: 'upcoming' },
        updatedAt: { type: Date, default: Date.now },
        remarks: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Application', applicationSchema);

