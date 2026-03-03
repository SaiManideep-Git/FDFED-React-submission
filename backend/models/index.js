const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;


const favoriteDesignSchema = new mongoose.Schema({
  // This ensures only ONE favorites document can exist per customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true, 
  },
  designs: [{
    designId: { type: String, required: true }, // e.g., "LivingRoom-1"
    category: { type: String, required: true }, // e.g., "LivingRoom"
    title: { type: String, required: true }, // e.g., "Living Room Design 1"
    imageUrl: { type: String, required: true }, // The actual image link
    _id: false // Prevents MongoDB from creating a sub-document ID for each design
  }]
}, { timestamps: true });


// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    dob: { type: Date, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "customer" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId },
        projectName: { type: String },
        projectType: { type: String, enum: ['architect', 'interior'] },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
        workerName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewedAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

// Company Schema
const companySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone: { type: String, required: true },
    companyDocuments: [{ type: String, default: [] }],
    password: { type: String, required: true },
    role: { type: String, default: "company" },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: 'Not specified' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    description: { type: String },
    aboutCompany: { type: String },
    aboutForCustomers: { type: String },
    aboutForCustomers: { type: String },
    whyJoinUs: { type: String },
    currentOpenings: [{ type: String }],
    specialization: [{ type: String }],
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    projectsCompleted: { type: String },
    yearsInBusiness: { type: String },
    completedProjects: [
      {
        title: { type: String },
        description: { type: String },
        beforeImage: { type: String },
        afterImage: { type: String },
        location: { type: String },
        tenderId: { type: String },
        materialCertificate: { type: String },
        gpsLink: { type: String },
      },
    ],
    didYouKnow: { type: String },
    profileType: {
      type: String,
      enum: ["worker", "customer"],
      default: "worker",
    },
  },
  { timestamps: true }
);

// Worker Schema
const workerSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    aadharNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v);
        },
        message: "Aadhaar number must be 12 digits",
      },
    },
    dob: { type: Date, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0, min: 0 },
    certificateFiles: [{ type: String }],
    role: { type: String, default: "worker" },
    profileImage: { type: String },
    professionalTitle: { type: String },
    about: { type: String },
    languages: [{ type: String, default: [] }],
    specialties: [{ type: String, default: [] }],
    // Previously worked companies/employers with optional proofs
    previousCompanies: [
      {
        companyName: { type: String, required: true },
        location: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String, required: true },
        proofs: [{ type: String, default: [] }],
        createdAt: { type: Date, default: Date.now }
      }
    ],
    projects: [
      {
        name: { type: String, required: true },
        year: { type: Number, min: 1900, max: 2100 },
        yearRange: { type: String },
        location: { type: String },
        description: { type: String },
        image: { type: String },
        images: [{ type: String, default: [] }],
        invoiceOrCertificate: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId },
        projectName: { type: String },
        projectType: { type: String, enum: ['architect', 'interior'] },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        customerName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewedAt: { type: Date, default: Date.now }
      }
    ],
    isArchitect: { type: Boolean, default: false },
    servicesOffered: [{ type: String, default: [] }],
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    expectedPrice: { type: String },
    
    // Payment & Revenue System
    subscriptionPlan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      default: "basic"
    },
    commissionRate: {
      type: Number,
      default: 15, // 15% platform commission for basic
      min: 0,
      max: 100
    },
    earnings: {
      totalEarnings: { type: Number, default: 0 }, // Lifetime earnings
      pendingBalance: { type: Number, default: 0 }, // In escrow, not yet released
      availableBalance: { type: Number, default: 0 }, // Released, ready for withdrawal
      withdrawnAmount: { type: Number, default: 0 }, // Already withdrawn
      monthlyEarnings: { type: Number, default: 0 }, // Current month
      yearlyEarnings: { type: Number, default: 0 }, // Current year
      lastResetMonth: { type: Number, default: new Date().getMonth() },
      lastResetYear: { type: Number, default: new Date().getFullYear() }
    },
  },
  { timestamps: true }
);

// Optional indexes for performance
workerSchema.index({ specialization: 1 });
workerSchema.index({ isArchitect: 1 });
workerSchema.index({ availability: 1 });

// Password Hashing Middleware
[customerSchema, companySchema, workerSchema].forEach((schema) => {
  schema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
});


// Architect Hiring Schema
const architectHiringSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Proposal Sent", "Pending Payment", "Accepted", "Rejected", "Completed"],
    default: "Pending",
  },
  finalAmount: { type: Number, default: 0 },
  proposal: {
    price: { type: Number },
    description: { type: String },
    phases: [
      {
        name: { type: String },
        percentage: { type: Number, min: 0, max: 100 },
        requiredMonths: { type: Number },
        amount: { type: Number },
        subdivisions: [
          {
            category: { type: String },
            description: { type: String },
            amount: { type: Number }
          }
        ]
      }
    ],
    sentAt: { type: Date }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: false,
  },
  customerDetails: {
    fullName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
  },
  customerAddress: {
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
  },
  plotInformation: {
    plotLocation: { type: String, required: true, trim: true },
    plotSize: { type: String, required: true, trim: true },
    plotOrientation: {
      type: String,
      required: true,
      enum: ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"],
    },
  },
  designRequirements: {
    designType: {
      type: String,
      required: true,
      enum: ["Residential", "Commercial", "Landscape", "Mixed-Use", "Industrial", "Other"],
    },
    numFloors: { type: String, required: true, enum: ["1", "2", "3", "4", "5+"] },
    floorRequirements: [
      {
        floorNumber: { type: Number, required: true },
        details: { type: String, trim: true },
      },
    ],
    specialFeatures: { type: String, trim: true },
    architecturalStyle: {
      type: String,
      required: true,
      enum: ["Modern", "Traditional", "Contemporary", "Minimalist", "Mediterranean", "Victorian", "Colonial", "Industrial", "Other"],
    },
  },
  additionalDetails: {
    budget: { type: String, trim: true },
    completionDate: { type: Date },
    referenceImages: [
      {
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true, enum: ["image/jpeg", "image/png", "application/pdf"] },
        size: { type: Number, required: true },
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  projectUpdates: [
    {
      updateText: { type: String, required: true },
      updateImage: { type: String }, // URL from Cloudinary
      createdAt: { type: Date, default: Date.now }
    }
  ],
  milestones: [
    {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
      status: { type: String, enum: ["Pending", "Approved", "Rejected", "Revision Requested", "Under Review"], default: "Pending" },
      image: { type: String },
      submittedAt: { type: Date, default: Date.now },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String },
      revisionRequestedAt: { type: Date },
      revisionNotes: { type: String },
      revisionHistory: [{
        requestedAt: { type: Date },
        notes: { type: String },
        resubmittedAt: { type: Date }
      }],
      reportedToAdminAt: { type: Date },
      adminReport: { type: String },
      adminReviewNotes: { type: String }
    }
  ],
  
  // Review and Rating System
  review: {
    customerToWorker: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date }
    },
    workerToCustomer: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date }
    },
    isReviewCompleted: { type: Boolean, default: false }
  },
  
  // Payment & Escrow System
  paymentDetails: {
    totalAmount: { type: Number }, // Total project cost (worker's proposal price)
    platformCommission: { type: Number }, // Platform's 15% commission
    workerAmount: { type: Number }, // Amount worker will receive (85%)
    escrowStatus: {
      type: String,
      enum: ["not_initiated", "held", "partially_released", "fully_released"],
      default: "not_initiated"
    },
    milestonePayments: [
      {
        percentage: { type: Number, required: true }, // 25, 50, 75, 100
        amount: { type: Number, required: true }, // Amount for this milestone
        platformFee: { type: Number, required: true }, // Commission for this milestone
        workerPayout: { type: Number, required: true }, // Net amount to worker
        paymentCollected: { type: Boolean, default: false }, // Has customer paid for this milestone?
        paymentCollectedAt: { type: Date }, // When customer paid
        status: {
          type: String,
          enum: ["pending", "released", "withdrawn"],
          default: "pending"
        },
        releasedAt: { type: Date },
        withdrawnAt: { type: Date },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }
      }
    ],
    paymentInitiatedAt: { type: Date },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

architectHiringSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Construction Project Schema
const constructionProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "proposal_sent", "accepted", "rejected"],
    default: "pending",
  },
  proposal: {
    price: { type: Number },
    description: { type: String },
    phases: [
      {
        name: { type: String },
        percentage: { type: Number, min: 0, max: 100 },
        requiredMonths: { type: Number },
        amount: { type: Number },
        subdivisions: [
          {
            category: { type: String },
            description: { type: String },
            amount: { type: Number }
          }
        ],
        paymentSchedule: {
          upfrontPercentage: { type: Number, default: 40 }, // 40% before work starts
          completionPercentage: { type: Number, default: 60 }, // 60% after completion (phases 1-4)
          finalPercentage: { type: Number, default: 0 } // 0 for phases 1-4, applies to final touching phase
        },
        bills: [
          {
            fileName: { type: String },
            fileUrl: { type: String },
            uploadedAt: { type: Date, default: Date.now },
            uploadedBy: { type: String, enum: ['company', 'customer'] }
          }
        ]
      }
    ],
    sentAt: { type: Date }
  },
  paymentDetails: {
    totalAmount: { type: Number },
    platformFee: { type: Number },
    amountPaidToCompany: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'completed'],
      default: 'unpaid'
    },
    payouts: [
      {
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'released'], default: 'pending' },
        releaseDate: { type: Date },
        milestonePercentage: { type: Number, min: 0, max: 100 },
        phaseName: { type: String }
      }
    ]
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  customerName: { type: String, required: true },
  customerEmail: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  customerPhone: { type: String, required: true },
  projectAddress: { type: String, required: true },
  projectLocationPincode: { type: String },
  totalArea: { type: Number, required: true },
  buildingType: {
    type: String,
    enum: ["residential", "commercial", "industrial", "mixedUse", "other"],
    required: true,
  },
  estimatedBudget: Number,
  projectTimeline: Number,
  totalFloors: { type: Number, required: true, min: 1 },
  floors: [
    {
      floorNumber: Number,
      floorType: {
        type: String,
        enum: ["residential", "commercial", "parking", "mechanical", "other"],
      },
      floorArea: Number,
      floorDescription: String,
      floorImagePath: String,
    },
  ],
  specialRequirements: String,
  accessibilityNeeds: {
    type: String,
    enum: ["wheelchair", "elevators", "ramps", "other", "none", ""],
  },
  energyEfficiency: {
    type: String,
    enum: ["standard", "leed", "passive", "netZero", "other", ""],
  },
  siteFilepaths: [String],
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  targetCompletionDate: { type: Date },
  currentPhase: { type: String, enum: ["Foundation", "Structure", "Interior work", "Finishing"] },
  mainImagePath: String,
  additionalImagePaths: [String],
  milestones: [
    {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      phaseName: { type: String },
      companyMessage: { type: String, required: true },
      isApprovedByCustomer: { type: Boolean, default: false },
      submittedAt: { type: Date, default: Date.now },
      approvedAt: { type: Date },
      isCheckpoint: { type: Boolean, default: false },
      isAutoGenerated: { type: Boolean, default: false },
      needsRevision: { type: Boolean, default: false },
      customerFeedback: { type: String, default: '' },
      // Payment tracking for 3 stages
      payments: {
        upfront: {
          amount: { type: Number, default: 0 },
          status: { type: String, enum: ['pending', 'released'], default: 'pending' },
          releasedAt: { type: Date },
          billUrl: { type: String }
        },
        completion: {
          amount: { type: Number, default: 0 },
          status: { type: String, enum: ['pending', 'released'], default: 'pending' },
          releasedAt: { type: Date },
          billUrl: { type: String }
        },
        final: {
          amount: { type: Number, default: 0 },
          status: { type: String, enum: ['pending', 'released'], default: 'pending' },
          releasedAt: { type: Date },
          billUrl: { type: String }
        }
      },
      conversation: [
        {
          sender: { type: String, enum: ['company', 'customer'], required: true },
          message: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
          viewedByCompany: { type: Boolean, default: false },
          viewedByCustomer: { type: Boolean, default: false }
        }
      ]
    },
  ],
  recentUpdates: [
    {
      updateText: String,
      updateImagePath: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  completionImages: [{ type: String }],
  customerReview: {
    rating: { type: Number, min: 1, max: 5 },
    reviewText: { type: String },
    reviewDate: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

constructionProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Design Request Schema
const designRequestSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  roomType: { type: String, required: true },
  roomSize: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    unit: { type: String, required: true, enum: ["feet", "meters"] },
  },
  ceilingHeight: {
    height: { type: Number },
    unit: { type: String, enum: ["feet", "meters"] },
  },
  designPreference: { type: String },
  projectDescription: { type: String },
  currentRoomImages: [{ type: String }],
  inspirationImages: [{ type: String }],
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["pending", "proposal_sent", "pending_payment", "accepted", "rejected", "completed"], 
    default: "pending" 
  },
  finalAmount: { type: Number, default: 0 },
  proposal: {
    price: { type: Number },
    description: { type: String },
    sentAt: { type: Date }
  },
  projectUpdates: [
    {
      updateText: { type: String, required: true },
      updateImage: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  milestones: [
    {
      percentage: { type: Number, required: true, min: 0, max: 100 },
      description: { type: String, required: true },
      status: { type: String, enum: ["Pending", "Approved", "Rejected", "Revision Requested", "Under Review"], default: "Pending" },
      image: { type: String },
      submittedAt: { type: Date, default: Date.now },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String },
      revisionRequestedAt: { type: Date },
      revisionNotes: { type: String },
      revisionHistory: [{
        requestedAt: { type: Date },
        notes: { type: String },
        resubmittedAt: { type: Date }
      }],
      reportedToAdminAt: { type: Date },
      adminReport: { type: String },
      adminReviewNotes: { type: String }
    }
  ],
  
  // Review and Rating System
  review: {
    customerToWorker: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date }
    },
    workerToCustomer: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date }
    },
    isReviewCompleted: { type: Boolean, default: false }
  },
  
  // Payment & Escrow System
  paymentDetails: {
    totalAmount: { type: Number }, // Total project cost (worker's proposal price)
    platformCommission: { type: Number }, // Platform's 15% commission
    workerAmount: { type: Number }, // Amount worker will receive (85%)
    escrowStatus: {
      type: String,
      enum: ["not_initiated", "held", "partially_released", "fully_released"],
      default: "not_initiated"
    },
    milestonePayments: [
      {
        percentage: { type: Number, required: true }, // 25, 50, 75, 100
        amount: { type: Number, required: true }, // Amount for this milestone
        platformFee: { type: Number, required: true }, // Commission for this milestone
        workerPayout: { type: Number, required: true }, // Net amount to worker
        paymentCollected: { type: Boolean, default: false }, // Has customer paid for this milestone?
        paymentCollectedAt: { type: Date }, // When customer paid
        status: {
          type: String,
          enum: ["pending", "released", "withdrawn"],
          default: "pending"
        },
        releasedAt: { type: Date },
        withdrawnAt: { type: Date },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }
      }
    ],
    paymentInitiatedAt: { type: Date },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String }
  },
});

// Floor Schema for Bid
const floorSchema = new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  floorType: {
    type: String,
    enum: ["residential", "commercial", "parking", "mechanical", "other"],
    required: true,
  },
  floorArea: { type: Number, required: true, min: 0 },
  floorDescription: { type: String, trim: true },
  floorImage: { type: String, trim: true },
});

// Company Bid Schema
const companyBidSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyName: { type: String, required: true, trim: true },
  bidPrice: { type: Number, required: true, min: 0 },
  bidDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
});

// Bid Schema
const BidSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  projectName: { type: String, required: true, trim: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  customerPhone: { type: String, required: true, trim: true },
  projectAddress: { type: String, required: true, trim: true },
  projectLocation: { type: String, required: true, trim: true },
  totalArea: { type: Number, required: true, min: 0 },
  buildingType: {
    type: String,
    enum: ["residential", "commercial", "industrial", "mixedUse", "other"],
    required: true,
  },
  estimatedBudget: { type: Number, min: 0 },
  projectTimeline: { type: Number, min: 0 },
  totalFloors: { type: Number, required: true, min: 1 },
  floors: [floorSchema],
  specialRequirements: { type: String, trim: true },
  accessibilityNeeds: {
    type: String,
    enum: ["wheelchair", "elevators", "ramps", "other", "none", ""],
  },
  energyEfficiency: {
    type: String,
    enum: ["standard", "leed", "passive", "netZero", "other", ""],
  },
  siteFiles: [{ type: String, trim: true }],
  companyBids: [companyBidSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  winningBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companyBids",
    default: null,
  },
  status: {
    type: String,
    enum: ["open", "closed", "awarded", "cancelled"],
    default: "open",
  },
  paymentDetails: {
    totalAmount: { type: Number }, // The full bid price accepted by the customer
    platformFee: { type: Number }, // The commission your platform will earn
    amountPaidToCompany: { type: Number, default: 0 }, // Total amount released to the company so far
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'completed'],
      default: 'unpaid'
    },
    stripeSessionId: { type: String }, // To track the payment session in Stripe
    payouts: [
      {
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'released'], default: 'pending' },
        releaseDate: { type: Date }
      }
    ]
  }
},
{ timestamps: true }
);


BidSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Company to Worker Schema
const companyToWorkerSchema = new mongoose.Schema({
  position: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Denied"], default: "Pending" },
});

// Worker to Company Schema
const jobApplicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    location: { type: String, required: true, trim: true },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, "Please enter a valid LinkedIn URL"],
      default: null,
    },
    experience: { type: Number, required: true, min: 0 },
    expectedSalary: { type: Number, required: true, min: 0 },
    positionApplying: { type: String, required: true, trim: true },
    primarySkills: {
      type: [String],
      required: true,
      validate: {
        validator: function (array) {
          return array.length > 0;
        },
        message: "At least one primary skill is required",
      },
    },
    workExperience: { type: String, required: true, trim: true },
    resume: { type: String, required: true, trim: true },
    termsAgree: { type: Boolean, required: true, enum: [true] },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    compName: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "Accepted", "Denied"], default: "Pending" },
  },
  { timestamps: true }
);
const ChatRoom = require('./chatModel');
// Complaint Schema
const complaintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConstructionProjectSchema', required: true },
  milestone: { type: Number, enum: [0, 25, 50, 75, 100], required: true },
  senderType: { type: String, enum: ['company', 'customer'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  isViewed: { type: Boolean, default: false },
  replies: [
    {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Transaction Schema - Complete Payment & Revenue Tracking
const transactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: [
      "escrow_hold",
      "milestone_release",
      "worker_withdrawal",
      "platform_commission",
      "refund",
      "subscription_fee"
    ],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  platformFee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  
  projectId: { type: mongoose.Schema.Types.ObjectId },
  projectType: { type: String, enum: ['architect', 'interior', 'construction', 'bid'] },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  
  milestonePercentage: { type: Number, enum: [25, 50, 75, 100] },
  
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  
  paymentMethod: { type: String, enum: ["stripe", "razorpay", "bank_transfer", "wallet"], default: "stripe" },
  stripePaymentIntentId: { type: String },
  stripeSessionId: { type: String },
  paymentGatewayResponse: { type: mongoose.Schema.Types.Mixed },
  
  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    transferId: { type: String }
  },
  
  description: { type: String },
  notes: { type: String },
  processedAt: { type: Date },
  failureReason: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

transactionSchema.index({ workerId: 1, createdAt: -1 });
transactionSchema.index({ projectId: 1 });
transactionSchema.index({ transactionType: 1, status: 1 });

// Models
module.exports = {
  Customer: mongoose.model('Customer', customerSchema),
  Company: mongoose.model('Company', companySchema),
  Worker: mongoose.model('Worker', workerSchema),
  ArchitectHiring: mongoose.model('ArchitectHiring', architectHiringSchema),
  ConstructionProjectSchema: mongoose.model('ConstructionProjectSchema', constructionProjectSchema),
  DesignRequest: mongoose.model('DesignRequest', designRequestSchema),
  Bid: mongoose.model('Bid', BidSchema),
  WorkerToCompany: mongoose.model('WorkerToCompany', jobApplicationSchema),
  CompanytoWorker: mongoose.model('CompanytoWorker', companyToWorkerSchema),
  // EXPORT THE NEW FAVORITE DESIGN MODEL
  FavoriteDesign: mongoose.model('FavoriteDesign', favoriteDesignSchema),
  ChatRoom: ChatRoom,
  Complaint: mongoose.model('Complaint', complaintSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
};