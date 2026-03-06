# Database Schema Reference

This file documents the MongoDB collections (Mongoose models) used by the website.

## Tech Stack

- Database: MongoDB
- ODM: Mongoose
- Primary model definitions:
  - `backend/models/index.js`
  - `backend/models/chatModel.js`
  - `backend/models/SystemSettings.js`

## Quick Relationship Map

- `Customer` ↔ `Worker` (reviews, hiring/design projects)
- `Customer` ↔ `Company` (construction projects, bids)
- `ArchitectHiring` links `Customer` + `Worker`
- `DesignRequest` links `Customer` + `Worker`
- `ConstructionProjectSchema` links `Customer` + `Company`
- `Bid` belongs to `Customer` and contains `companyBids` by `Company`
- `ChatRoom` links project chat participants (`Customer`/`Worker`/`Company`)
- `Complaint` is tied to construction milestone disputes and platform assignment
- `Transaction` tracks escrow, payouts, commissions, and withdrawals
- `VerificationTask` and `TaskAssignmentCounter` support platform manager workflows

---

## 1) `Customer`

**Purpose:** End-user/customer account and customer-side review history.

**Key fields:**
- `name`, `email` (unique), `dob`, `phone`, `password`, `role`
- Ratings: `rating`, `totalReviews`
- `reviews[]`:
  - `projectId`, `projectName`, `projectType` (`architect | interior`)
  - `workerId` (ref `Worker`), `workerName`, `rating`, `comment`, `reviewedAt`

**Notes:**
- Password is hashed via pre-save middleware.
- Uses timestamps.

## 2) `Company`

**Purpose:** Company profile and verification lifecycle.

**Key fields:**
- Verification: `status` (`pending | verified | rejected`), `rejectionReason`, `verificationReviewedAt`, `verificationReviewedBy` (ref `PlatformManager`)
- Account: `companyName`, `contactPerson`, `email` (unique), `phone`, `password`, `role`
- Profile: `location`, `description`, `aboutCompany`, `aboutForCustomers`, `whyJoinUs`
- Business metadata: `currentOpenings[]`, `specialization[]`, `size`, `projectsCompleted`, `yearsInBusiness`
- Portfolio: `completedProjects[]` (title, description, images, location, tender/certification details)

**Notes:**
- Password is hashed via pre-save middleware.
- Uses timestamps.

## 3) `Worker`

**Purpose:** Worker profile, verification, experience, reviews, and earnings.

**Key fields:**
- Verification: `status`, `rejectionReason`, `verificationReviewedAt`, `verificationReviewedBy` (ref `PlatformManager`)
- Identity/account: `name`, `email` (unique), `password`, `phone`, `aadharNumber`, `dob`, `role`
- Professional: `specialization`, `experience`, `certificateFiles[]`, `professionalTitle`, `about`, `languages[]`, `specialties[]`
- History:
  - `previousCompanies[]` (companyName, location, role, duration, proofs)
  - `projects[]` (name, year/yearRange, location, images, invoice/certificate)
- Reviews: `rating`, `totalReviews`, `reviews[]` with customer references
- Availability & service: `isArchitect`, `servicesOffered[]`, `availability`, `expectedPrice`
- Revenue: `subscriptionPlan`, `commissionRate`, `earnings` object (`totalEarnings`, `pendingBalance`, `availableBalance`, `withdrawnAmount`, monthly/yearly)

**Indexes:**
- `specialization`, `isArchitect`, `availability`

**Notes:**
- Password is hashed via pre-save middleware.
- Uses timestamps.

## 4) `FavoriteDesign`

**Purpose:** Saved design inspirations per customer.

**Key fields:**
- `customerId` (ref `Customer`, unique)
- `designs[]`: `designId`, `category`, `title`, `imageUrl`

**Notes:**
- Exactly one favorites document per customer.

## 5) `ArchitectHiring`

**Purpose:** Architect project workflow between customer and worker.

**Key fields:**
- Project: `projectName`, `status` (`Pending | Proposal Sent | Pending Payment | Accepted | Rejected | Completed`), `finalAmount`
- Proposal: `proposal.price`, `proposal.description`, `proposal.phases[]` (phase %, months, amount, subdivisions)
- Links: `customer` (ref `Customer`), `worker` (ref `Worker`)
- Customer/project detail groups:
  - `customerDetails`, `customerAddress`, `plotInformation`, `designRequirements`, `additionalDetails`
- Delivery tracking:
  - `projectUpdates[]`
  - `milestones[]` with approval/revision/admin-report fields
- Reviews: `review.customerToWorker`, `review.workerToCustomer`, `review.isReviewCompleted`
- Escrow payment: `paymentDetails` with milestone-level payment status and transaction refs

## 6) `ConstructionProjectSchema`

**Purpose:** Construction execution workflow between customer and company.

**Key fields:**
- Project: `projectName`, `status` (`pending | proposal_sent | accepted | rejected`)
- Proposal: phase/subdivision structure with payment schedule and optional bills
- Payment summary: `paymentDetails.totalAmount`, `platformFee`, `amountPaidToCompany`, `paymentStatus`, `payouts[]`
- Links: `customerId` (ref `Customer`), `companyId` (ref `Company`)
- Site/project details: address, pincode, area, building type, floors, requirements, efficiency/accessibility
- Progress: `completionPercentage`, `targetCompletionDate`, `currentPhase`, updates, milestone conversations
- Milestone payment breakdown: `payments.upfront/completion/final`
- Completion artifacts: `completionImages[]`, `customerReview`

## 7) `DesignRequest`

**Purpose:** Interior design workflow between customer and worker.

**Key fields:**
- Request info: `projectName`, contact details, room specs, preferences, descriptions, images
- Links: `customerId` (ref `Customer`), `workerId` (ref `Worker`)
- Lifecycle: `status` (`pending | proposal_sent | pending_payment | accepted | rejected | completed`), `finalAmount`, `proposal`
- Delivery: `projectUpdates[]`, `milestones[]` (approval/revision/admin-review tracking)
- Reviews: two-way review structure like architect projects
- Escrow payment: same milestone payment structure as `ArchitectHiring`

## 8) `Bid`

**Purpose:** Construction bidding workflow initiated by customers and responded to by companies.

**Key fields:**
- Ownership: `customerId` (ref `Customer`), customer contact fields
- Project definition: location, building details, floor details (`floors[]`), requirements, files
- `companyBids[]`:
  - `companyId` (ref `Company`), `companyName`, `bidPrice`, `bidDate`, `status`
- Bid outcome: `winningBidId`, bid `status` (`open | closed | awarded | cancelled`)
- Payment: `paymentDetails` with platform fee, status, Stripe session, payouts

## 9) `CompanytoWorker`

**Purpose:** Company job offer/request to a worker.

**Key fields:**
- `position`, `location`, `salary`
- `company` (ref `Company`), `worker` (ref `Worker`)
- `status` (`Pending | Accepted | Denied`)

## 10) `WorkerToCompany`

**Purpose:** Worker application to a company role.

**Key fields:**
- Candidate info: `fullName`, `email`, `location`, `linkedin`, `experience`, `expectedSalary`
- Job fit: `positionApplying`, `primarySkills[]`, `workExperience`, `resume`, `termsAgree`
- Links: `workerId` (ref `Worker`), `companyId` (ref `Company`), `compName`
- `status` (`Pending | Accepted | Denied`)

## 11) `ChatRoom` (from `chatModel.js`)

**Purpose:** Real-time chat container for project discussions.

**Key fields:**
- `roomId` (unique)
- Participants: `customerId` (ref `Customer`), `workerId` (ref `Worker`), `companyId` (ref `Company`)
- Context: `projectId`, `projectType` (`architect | interior | hiring`)
- `messages[]`:
  - `sender` (ObjectId with dynamic `refPath`)
  - `senderModel` (`Customer | Worker | Company`)
  - `message`, `createdAt`

## 12) `PlatformManager`

**Purpose:** Operational admin users for verification and complaint workflows.

**Key fields:**
- `name`, `email` (unique), `username` (unique), `password`
- `status` (`active | inactive`), `createdBy`, `lastLogin`
- `stats` object for assigned/completed/pending and resolution metrics

**Notes:**
- Password is hashed via pre-save middleware.

## 13) `VerificationTask`

**Purpose:** Task queue for company/worker verification.

**Key fields:**
- `type` (`company | worker`), `entityId`, `entityName`
- Assignment: `assignedTo` (ref `PlatformManager`), `status` (`pending | in-progress | verified | rejected | unassigned`)
- `assignedAt`, `completedAt`, `completedBy` (ref `PlatformManager`), `notes`

## 14) `Complaint`

**Purpose:** Milestone-level complaint handling and manager assignment.

**Key fields:**
- `projectId` (ref `ConstructionProjectSchema`)
- `milestone` (`0 | 25 | 50 | 75 | 100`)
- `senderType` (`company | customer`), `senderId`, `message`, `isViewed`
- Assignment: `assignedTo` (ref `PlatformManager`), `status` (`pending | in-progress | resolved | unassigned`)
- Resolution: `resolvedBy` (ref `PlatformManager`), `resolvedAt`, `assignedAt`
- `replies[]` (`adminId`, `message`, `createdAt`)

## 15) `TaskAssignmentCounter`

**Purpose:** Round-robin assignment pointer state.

**Key fields:**
- `lastAssignedIndex`
- `type` (`verification | complaint`, unique)

## 16) `Transaction`

**Purpose:** End-to-end financial ledger for escrow, payouts, commissions, and withdrawals.

**Key fields:**
- `transactionType` (`escrow_hold | milestone_release | worker_withdrawal | platform_commission | refund | subscription_fee`)
- Amount fields: `amount`, `platformFee`, `netAmount`
- Links: `projectId`, `projectType`, `workerId` (ref `Worker`), `customerId` (ref `Customer`), `companyId` (ref `Company`)
- Milestone: `milestonePercentage` (`25 | 50 | 75 | 100`)
- Status: `status` (`pending | completed | failed | refunded`)
- Gateway fields: `paymentMethod`, Stripe IDs, response object
- Bank transfer fields: `bankDetails`
- Audit fields: `description`, `notes`, `processedAt`, `failureReason`

**Indexes:**
- `{ workerId: 1, createdAt: -1 }`
- `{ projectId: 1 }`
- `{ transactionType: 1, status: 1 }`

## 17) `SystemSettings` (from `SystemSettings.js`)

**Purpose:** Global platform configuration (single-instance pattern).

**Key fields:**
- `platformFeePercentage`
- `autoApprovalThreshold`
- `maxUploadSizeBytes`
- `maintenanceMode`
- `announcementMessage`

**Notes:**
- Exposes static `getSettings()` to always return/create a single document.

---

## Migration Scripts Affecting Schema/Data

- `backend/migrations/addMilestoneFields.js`
  - Removes milestone fields (`needsRevision`, `customerFeedback`, `feedbackAt`) from existing project documents (undo migration script).
- `backend/migrations/fixExistingProjectPayments.js`
  - Data-fix migration for existing `ArchitectHiring` and `DesignRequest` milestone payment records.

---

## Source of Truth

For exact field-level definitions and validations, always refer to:

- `backend/models/index.js`
- `backend/models/chatModel.js`
- `backend/models/SystemSettings.js`
