const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getConferenceDb = require('../services/getConferenceDb');
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
        const user = req.user;
        console.log('[GET contributions] User:', user);
        console.log('[GET contributions] User role:', user && user.role);

        // Check role access
        if (!hasRequiredRole(user)) {
            console.warn('[GET contributions] Access denied for user:', user);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only God, Owner, Administrator, and Chair roles can access contributions.'
            });
        }

        // Get conference-specific database
        const db = await getConferenceDb(conferenceCode);
        const Contribution = db.model('Contribution', ContributionSchema);

        // Get all contributions for this conference
        const contributions = await Contribution.find({ conferenceCode }).sort({ country: 1 });

        res.json({
            success: true,
            data: contributions
        });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contributions'
        });
    }
});

// PATCH /api/contributions/:conferenceCode/:country/:field - Update a specific field
router.patch('/:conferenceCode/:country/:field', requireAuth, async (req, res) => {
    try {
        const { conferenceCode, country, field } = req.params;
        const { value } = req.body;
        const user = req.user;
        console.log('[PATCH contributions] User:', user);
        console.log('[PATCH contributions] User role:', user && user.role);

        // Check role access
        if (!hasRequiredRole(user)) {
            console.warn('[PATCH contributions] Access denied for user:', user);
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

        // Get conference-specific database
        const db = await getConferenceDb(conferenceCode);
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

// POST /api/contributions/:conferenceCode/initialize - Initialize contributions for all delegates
router.post('/:conferenceCode/initialize', requireAuth, async (req, res) => {
    try {
        const { conferenceCode } = req.params;
        const user = req.user;
        console.log('[POST initialize contributions] User:', user);
        console.log('[POST initialize contributions] User role:', user && user.role);

        // Check role access
        if (!hasRequiredRole(user)) {
            console.warn('[POST initialize contributions] Access denied for user:', user);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only God, Owner, Administrator, and Chair roles can initialize contributions.'
            });
        }

        // Get conference-specific database
        const db = await getConferenceDb(conferenceCode);
        const Contribution = db.model('Contribution', ContributionSchema);
        const Participant = db.model('Participant', require('../models/Participant'));

        // Get all delegates from participants
        const delegates = await Participant.find({ 
            conferenceCode, 
            role: 'delegate' 
        }).select('country').sort({ country: 1 });

        // Create contribution records for each delegate
        const contributions = [];
        for (const delegate of delegates) {
            if (delegate.country) {
                const contribution = await Contribution.findOneAndUpdate(
                    { conferenceCode, country: delegate.country },
                    {},
                    { 
                        new: true, 
                        upsert: true, 
                        setDefaultsOnInsert: true 
                    }
                );
                contributions.push(contribution);
            }
        }

        res.json({
            success: true,
            data: contributions,
            message: `Initialized ${contributions.length} contribution records`
        });
    } catch (error) {
        console.error('Error initializing contributions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize contributions'
        });
    }
});

module.exports = router; 