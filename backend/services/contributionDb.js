const mongoose = require('mongoose');
const ContributionSchema = require('../models/Contribution');
const AwardSchema = require('../models/Award');
const { getConferenceDb } = require('./conferenceDb');

function getContributionModel(conferenceCode) {
  const db = getConferenceDb(conferenceCode);
  if (!db.models.Contribution) db.model('Contribution', ContributionSchema);
  return db.models.Contribution;
}
function getAwardModel(conferenceCode) {
  const db = getConferenceDb(conferenceCode);
  if (!db.models.Award) db.model('Award', AwardSchema);
  return db.models.Award;
}

async function getContributions(conferenceCode) {
  const Contribution = getContributionModel(conferenceCode);
  return Contribution.find();
}

async function updateContribution(conferenceCode, delegateId, field, delta) {
  const Contribution = getContributionModel(conferenceCode);
  const doc = await Contribution.findOne({ delegateId });
  if (!doc) return null;
  if (['pois','amendments','speeches','strikes'].includes(field)) {
    doc[field] = Math.max(0, doc[field] + delta);
    await doc.save();
    return doc;
  }
  return null;
}

async function resetContributions(conferenceCode) {
  const Contribution = getContributionModel(conferenceCode);
  await Contribution.updateMany({}, { pois: 0, amendments: 0, speeches: 0, strikes: 0 });
  return Contribution.find();
}

async function getOrCreateAwards(conferenceCode) {
  const Award = getAwardModel(conferenceCode);
  let doc = await Award.findOne({ conferenceCode });
  if (!doc) {
    doc = new Award({ conferenceCode });
    await doc.save();
  }
  return doc;
}

async function setAward(conferenceCode, field, country) {
  const Award = getAwardModel(conferenceCode);
  const doc = await getOrCreateAwards(conferenceCode);
  if (['bestDelegate','honourableMention','bestPositionPaper'].includes(field)) {
    doc[field] = country;
    await doc.save();
    return doc;
  }
  return null;
}

module.exports = { getContributions, updateContribution, resetContributions, getOrCreateAwards, setAward }; 