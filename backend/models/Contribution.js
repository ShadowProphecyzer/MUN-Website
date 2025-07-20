const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
    conferenceCode: { 
        type: String, 
        required: true, 
        index: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    present: { 
        type: Boolean, 
        default: false 
    },
    voting: { 
        type: Boolean, 
        default: false 
    },
    pois: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    amendments: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    speeches: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt field before saving
ContributionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compound index for conference and country
ContributionSchema.index({ conferenceCode: 1, country: 1 }, { unique: true });

module.exports = ContributionSchema; 