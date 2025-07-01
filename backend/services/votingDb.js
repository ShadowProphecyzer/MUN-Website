const mongoose = require('mongoose');
const VotingSessionSchema = require('../models/VotingSession');
const { getConferenceDb } = require('./conferenceDb');

function getVotingModel(conferenceCode) {
  const db = getConferenceDb(conferenceCode);
  if (!db.models.VotingSession) {
    db.model('VotingSession', VotingSessionSchema);
  }
  return db.models.VotingSession;
}

async function getCurrentSession(conferenceCode) {
  const VotingSession = getVotingModel(conferenceCode);
  return VotingSession.findOne({ open: true });
}

async function openSession(conferenceCode, openedBy) {
  const VotingSession = getVotingModel(conferenceCode);
  // Close any open session
  await VotingSession.updateMany({ open: true }, { open: false, closedAt: new Date(), closedBy: openedBy });
  // Create new session
  const session = new VotingSession({ open: true, openedBy, conferenceCode });
  await session.save();
  return session;
}

async function closeSession(conferenceCode, closedBy, delegateIds) {
  const VotingSession = getVotingModel(conferenceCode);
  const session = await VotingSession.findOne({ open: true });
  if (!session) return null;
  // Tally votes
  const votes = session.votes || new Map();
  let forCount = 0, againstCount = 0, abstainCount = 0;
  delegateIds = delegateIds || [];
  const votedIds = new Set(Array.from(votes.keys()));
  delegateIds.forEach(id => {
    if (!votedIds.has(id)) {
      votes.set(id, 'notParticipating');
    }
  });
  for (const v of votes.values()) {
    if (v === 'for') forCount++;
    else if (v === 'against') againstCount++;
    else if (v === 'abstain') abstainCount++;
  }
  const notParticipating = delegateIds.length - (forCount + againstCount + abstainCount);
  session.results = { for: forCount, against: againstCount, abstain: abstainCount, notParticipating };
  session.open = false;
  session.closedAt = new Date();
  session.closedBy = closedBy;
  await session.save();
  return session;
}

async function castVote(conferenceCode, userId, vote) {
  const VotingSession = getVotingModel(conferenceCode);
  const session = await VotingSession.findOne({ open: true });
  if (!session) return null;
  session.votes.set(userId, vote);
  await session.save();
  return session;
}

async function getResults(conferenceCode) {
  const VotingSession = getVotingModel(conferenceCode);
  const session = await VotingSession.findOne({ open: true });
  if (!session) return null;
  // Tally current votes
  let forCount = 0, againstCount = 0, abstainCount = 0;
  for (const v of session.votes.values()) {
    if (v === 'for') forCount++;
    else if (v === 'against') againstCount++;
    else if (v === 'abstain') abstainCount++;
  }
  session.results = { for: forCount, against: againstCount, abstain: abstainCount, notParticipating: 0 };
  return session.results;
}

async function getAllSessions(conferenceCode) {
  const VotingSession = getVotingModel(conferenceCode);
  return VotingSession.find().sort({ openedAt: -1 });
}

module.exports = { getCurrentSession, openSession, closeSession, castVote, getResults, getAllSessions }; 