const mongoose = require('mongoose');

const AmendmentSchema = new mongoose.Schema({
  amendmentNumber: { type: Number, required: true }, // sequential per conference
  resolutionNumber: { type: Number, required: true },
  clauseNumber: { type: Number, required: true },
  subclause: { type: String, match: /^[A-Z]?$/, default: '' },
  subSubClause: { type: String, default: 'N/A' }, // Roman numeral or 'N/A'
  type: { type: String, enum: ['Add', 'Modify', 'Strike'], required: true },
  content: { type: String, required: true },
  country: { type: String, required: true },
  submitterRole: { type: String, default: '' }, // only if not delegate
  status: { type: String, enum: ['in-debate', 'passed', 'rejected'], default: 'in-debate' },
  statusChangedBy: { type: String, default: '' }, // user id or name
  statusChangedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = AmendmentSchema; 