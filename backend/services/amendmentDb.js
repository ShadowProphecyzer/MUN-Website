const mongoose = require('mongoose');
const AmendmentSchema = require('../models/Amendment');
const { getConferenceDb } = require('./conferenceDb');

function getAmendmentModel(conferenceCode) {
  const db = getConferenceDb(conferenceCode);
  if (!db.models.Amendment) {
    db.model('Amendment', AmendmentSchema);
  }
  return db.models.Amendment;
}

async function getAmendments(conferenceCode) {
  const Amendment = getAmendmentModel(conferenceCode);
  return Amendment.find().sort({ amendmentNumber: 1 });
}

async function createAmendment(conferenceCode, data) {
  const Amendment = getAmendmentModel(conferenceCode);
  // Get next amendment number
  const last = await Amendment.findOne().sort({ amendmentNumber: -1 });
  const amendmentNumber = last ? last.amendmentNumber + 1 : 1;
  const doc = new Amendment({ ...data, amendmentNumber });
  await doc.save();
  return doc;
}

async function updateAmendmentStatus(conferenceCode, amendmentId, status, statusChangedBy) {
  const Amendment = getAmendmentModel(conferenceCode);
  return Amendment.findByIdAndUpdate(
    amendmentId,
    { status, statusChangedBy, statusChangedAt: new Date() },
    { new: true }
  );
}

module.exports = { getAmendments, createAmendment, updateAmendmentStatus }; 