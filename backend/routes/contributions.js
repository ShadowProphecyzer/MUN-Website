const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getConferenceDb } = require('../services/getConferenceDb');
const ContributionSchema = require('../models/Contribution');

// Helper function to check if user has required role
function hasRequiredRole(user) {
    const allowedRoles = ['god', 'owner', 'administrator', 'chair'];
    return user && user.role && allowedRoles.includes(user.role.trim().toLowerCase());
}

// GET /api/contributions/:conferenceCode - Get all contributions for a conference
router.get('/:conferenceCode', requireAuth, async (req, res) => {
    try {
        const { conferenceCode } = req.params;
        // No role check needed, just require authentication
        const db = await getConferenceDb(conferenceCode);
        const Contribution = db.model('Contribution', ContributionSchema);
        const contributions = await Contribution.find({ conferenceCode }).sort({ country: 1 });
        res.json({
            success: true,
            data: contributions
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        console.error('Detailed error info:', {
            message: error.message,
            stack: error.stack,
            conferenceCode: req.params.conferenceCode,
            user: req.user || null
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contributions',
            error: error.message
        });
    }
});

// PATCH /api/contributions/:conferenceCode/:country/:field - Update a specific field
router.patch('/:conferenceCode/:country/:field', requireAuth, async (req, res) => {
    try {
        const { conferenceCode, country, field } = req.params;
        const { value } = req.body;
        // Get conference-specific database
        const db = await getConferenceDb(conferenceCode);
        const Participant = db.model('Participant', require('../models/Participant'));
        // Find the participant record for the current user in this conference
        const participant = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
        console.log('[PATCH contributions] Conference participant:', participant);
        // Check role access using the participant's role
        if (!hasRequiredRole(participant)) {
            console.warn('[PATCH contributions] Access denied for participant:', participant);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only God, Owner, Administrator, and Chair roles can modify contributions.'
            });
        }
        // Validate field
        const allowedFields = ['present', 'voting', 'pois', 'amendments', 'speeches'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid field'
            });
        }
        // Validate value based on field type
        if (field === 'present' || field === 'voting') {
            if (typeof value !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a boolean value`
                });
            }
        } else {
            // Number fields
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-negative number`
                });
            }
        }
        const Contribution = db.model('Contribution', ContributionSchema);
        // Find and update the contribution record
        const updateData = { [field]: value };
        const contribution = await Contribution.findOneAndUpdate(
            { conferenceCode, country },
            updateData,
            { 
                new: true, 
                upsert: true, 
                setDefaultsOnInsert: true 
            }
        );
        // Emit socket event for live updates
        if (req.app.get('io')) {
            req.app.get('io').to(conferenceCode).emit('contributionUpdate', {
                conferenceCode,
                country,
                field,
                value,
                updatedAt: contribution.updatedAt
            });
        }
        res.json({
            success: true,
            data: contribution
        });
    } catch (error) {
        console.error('Error updating contribution:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contribution'
        });
    }
});

module.exports = router; 