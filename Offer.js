// Offer schema (Mongoose / MongoDB)
// Fields: listing, buyer, amount, status (pending | accepted | declined)

const mongoose = require('mongoose');

const { Schema } = mongoose;

const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

const offerSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Offer amount is required'],
      min: [0, 'Offer amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(OFFER_STATUS),
        message: 'Status must be one of: pending, accepted, declined',
      },
      default: OFFER_STATUS.PENDING,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// Compound index: one buyer can have only one active offer per listing
offerSchema.index(
  { listing: 1, buyer: 1 },
  {
    unique: true,
    partialFilterExpression: { status: OFFER_STATUS.PENDING },
  }
);

// Helper: check if the offer is still pending
offerSchema.methods.isPending = function () {
  return this.status === OFFER_STATUS.PENDING;
};

// Helper: transition status with validation (no illegal transitions)
offerSchema.methods.transitionTo = function (newStatus) {
  const allowed = {
    pending: [OFFER_STATUS.ACCEPTED, OFFER_STATUS.DECLINED],
    accepted: [],
    declined: [],
  };

  if (!allowed[this.status].includes(newStatus)) {
    throw new Error(
      `Illegal status transition: ${this.status} -> ${newStatus}`
    );
  }

  this.status = newStatus;
  return this;
};

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
module.exports.OFFER_STATUS = OFFER_STATUS;
module.exports.offerSchema = offerSchema;
