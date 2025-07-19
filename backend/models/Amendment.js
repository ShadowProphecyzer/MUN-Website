const mongoose = require('mongoose');

const AmendmentSchema = new mongoose.Schema({
  conferenceCode: { type: String, required: true, index: true },
  amendmentId: { type: Number, required: true }, // sequential per conference
  user: {
    email: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    country: { type: String },
  },
  number: { type: Number, required: true },
  letter: { type: String, required: true },
  roman: { type: String, required: true },
  content: { type: String, required: true },
  friendly: { type: Boolean, required: true },
  accepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

AmendmentSchema.index({ conferenceCode: 1, amendmentId: 1 }, { unique: true });

module.exports = mongoose.model('Amendment', AmendmentSchema);
module.exports.schema = AmendmentSchema; 