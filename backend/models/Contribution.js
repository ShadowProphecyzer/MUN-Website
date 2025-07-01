const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  country: { type: String, required: true },
  pois: { type: Number, default: 0 },
  amendments: { type: Number, default: 0 },
  speeches: { type: Number, default: 0 },
  strikes: { type: Number, default: 0 },
  conferenceCode: { type: String, required: true },
  delegateId: { type: String, required: true, unique: true }
});

module.exports = ContributionSchema; 