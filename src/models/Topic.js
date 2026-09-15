const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: ['Maths', 'Urdu', 'English'],
      required: [true, 'Subject is required']
    },
    class: {
      type: String,
      enum: ['8th', '9th', '10th'],
      required: [true, 'Class is required']
    },
    pageNumber: {
      type: Number,
      required: [true, 'Page number is required'],
      min: [1, 'Page number must be positive']
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// One topic per subject+class+page — this is what powers the auto-fetch
topicSchema.index({ subject: 1, class: 1, pageNumber: 1 }, { unique: true });

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;