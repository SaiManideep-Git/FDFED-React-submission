const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true },
    );
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    res.json({
      success: true,
      message: "Company verified successfully",
      company,
    });
  } catch (error) {
    console.error("Error verifying company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    );
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    res.json({ success: true, message: "Company rejected", company });
  } catch (error) {
    console.error("Error rejecting company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true },
    );
    if (!worker)
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    res.json({
      success: true,
      message: "Worker verified successfully",
      worker,
    });
  } catch (error) {
    console.error("Error verifying worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    );
    if (!worker)
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    res.json({ success: true, message: "Worker rejected", worker });
  } catch (error) {
    console.error("Error rejecting worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const {
  Customer,
  Company,
  Worker,
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
  WorkerToCompany,
  CompanytoWorker,
  Transaction,
} = require("../models");

const getAdminDashboard = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    const companies = await Company.find({}).sort({ createdAt: -1 });
    const workers = await Worker.find({}).sort({ createdAt: -1 });
    const architectHirings = await ArchitectHiring.find({})
      .populate("customer", "name email")
      .populate("worker", "name email")
      .sort({ createdAt: -1 });
    const constructionProjects = await ConstructionProjectSchema.find({})
      .populate("customerId", "name email")
      .populate("companyId", "companyName")
      .sort({ createdAt: -1 });
    const designRequests = await DesignRequest.find({})
      .populate("customerId", "name email")
      .populate("workerId", "name email")
      .sort({ createdAt: -1 });
    const bids = await Bid.find({})
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    const jobApplications = await WorkerToCompany.find({})
      .populate("workerId", "name email")
      .populate("companyId", "companyName")
      .sort({ createdAt: -1 });

    const customersCount = customers.length;
    const companiesCount = companies.length;
    const workersCount = workers.length;

    const activeProjects = constructionProjects.filter(
      (p) => p.status === "accepted",
    ).length;
    const pendingArchitectHirings = architectHirings.filter(
      (h) => h.status === "Pending",
    ).length;
    const pendingDesignRequests = designRequests.filter(
      (d) => d.status === "pending",
    ).length;
    const pendingRequests = pendingArchitectHirings + pendingDesignRequests;
    const openBids = bids.filter((b) => b.status === "open").length;

    // Calculate revenue from Architect Hirings
    let architectHiringRevenue = {
      totalProjects: architectHirings.length,
      totalRevenue: 0,
      platformCommission: 0,
      workerPayout: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    architectHirings.forEach((hiring) => {
      if (hiring.paymentDetails && hiring.paymentDetails.totalAmount) {
        architectHiringRevenue.totalRevenue +=
          hiring.paymentDetails.totalAmount || 0;
        architectHiringRevenue.platformCommission +=
          hiring.paymentDetails.platformCommission || 0;
        architectHiringRevenue.workerPayout +=
          hiring.paymentDetails.workerAmount || 0;

        if (hiring.status === "accepted" || hiring.status === "In-Progress") {
          architectHiringRevenue.activeProjects++;
        } else if (hiring.status === "Completed") {
          architectHiringRevenue.completedProjects++;
        }
      }
    });

    // Calculate revenue from Design Requests
    let designRequestRevenue = {
      totalProjects: designRequests.length,
      totalRevenue: 0,
      platformCommission: 0,
      workerPayout: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    designRequests.forEach((request) => {
      if (request.paymentDetails && request.paymentDetails.totalAmount) {
        designRequestRevenue.totalRevenue +=
          request.paymentDetails.totalAmount || 0;
        designRequestRevenue.platformCommission +=
          request.paymentDetails.platformCommission || 0;
        designRequestRevenue.workerPayout +=
          request.paymentDetails.workerAmount || 0;

        if (request.status === "accepted" || request.status === "In-Progress") {
          designRequestRevenue.activeProjects++;
        } else if (request.status === "Completed") {
          designRequestRevenue.completedProjects++;
        }
      }
    });

    // Combined revenue metrics
    const totalPlatformRevenue =
      architectHiringRevenue.platformCommission +
      designRequestRevenue.platformCommission;
    const totalProjectRevenue =
      architectHiringRevenue.totalRevenue + designRequestRevenue.totalRevenue;

    res.status(200).json({
      counts: {
        customers: customersCount,
        companies: companiesCount,
        workers: workersCount,
      },
      stats: {
        activeProjects,
        pendingRequests,
        openBids,
      },
      revenue: {
        architectHiring: architectHiringRevenue,
        designRequest: designRequestRevenue,
        combined: {
          totalPlatformCommission: totalPlatformRevenue,
          totalProjectRevenue: totalProjectRevenue,
          totalProjects:
            architectHiringRevenue.totalProjects +
            designRequestRevenue.totalProjects,
        },
      },
      data: {
        customers,
        companies,
        workers,
        architectHirings,
        constructionProjects,
        designRequests,
        bids,
        jobApplications,
      },
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).send("Server Error");
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }
    res.json({ success: true, message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteArchitectHiring = async (req, res) => {
  try {
    const hiring = await ArchitectHiring.findByIdAndDelete(req.params.id);
    if (!hiring) {
      return res
        .status(404)
        .json({ success: false, error: "Architect hiring not found" });
    }
    res.json({
      success: true,
      message: "Architect hiring deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting architect hiring:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteConstructionProject = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findByIdAndDelete(
      req.params.id,
    );
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Construction project not found" });
    }
    res.json({
      success: true,
      message: "Construction project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting construction project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDesignRequest = async (req, res) => {
  try {
    const request = await DesignRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: "Design request not found" });
    }
    res.json({ success: true, message: "Design request deleted successfully" });
  } catch (error) {
    console.error("Error deleting design request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteBid = async (req, res) => {
  try {
    const bid = await Bid.findByIdAndDelete(req.params.id);
    if (!bid) {
      return res.status(404).json({ success: false, error: "Bid not found" });
    }
    res.json({ success: true, message: "Bid deleted successfully" });
  } catch (error) {
    console.error("Error deleting bid:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteJobApplication = async (req, res) => {
  try {
    const application = await WorkerToCompany.findByIdAndDelete(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, error: "Job application not found" });
    }
    res.json({
      success: true,
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job application:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCustomerDetail = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Fetch all related projects and connections
    const constructionProjects = await ConstructionProjectSchema.find({
      customerId: req.params.id,
    })
      .populate("companyId", "companyName email contactPerson")
      .sort({ createdAt: -1 });

    const architectHirings = await ArchitectHiring.find({
      customer: req.params.id,
    })
      .populate("worker", "name email specialization")
      .sort({ createdAt: -1 });

    const designRequests = await DesignRequest.find({
      customerId: req.params.id,
    })
      .populate("workerId", "name email specialization")
      .sort({ createdAt: -1 });

    const bids = await Bid.find({ customerId: req.params.id })
      .populate("companyBids.companyId", "companyName email")
      .sort({ createdAt: -1 });

    res.json({
      customer,
      relatedData: {
        constructionProjects,
        architectHirings,
        designRequests,
        bids,
        totalProjects:
          constructionProjects.length +
          architectHirings.length +
          designRequests.length,
        activeBids: bids.filter((b) => b.status === "open").length,
      },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ");

const getArchitectProgress = (hiring) => {
  if (normalizeStatus(hiring?.status) === "completed") return 100;
  const milestones = Array.isArray(hiring?.milestones) ? hiring.milestones : [];
  if (!milestones.length) {
    return normalizeStatus(hiring?.status) === "accepted" ? 50 : 0;
  }
  const approved = milestones.filter(
    (item) => normalizeStatus(item?.status) === "approved",
  ).length;
  return Math.round((approved / milestones.length) * 100);
};

const getInteriorProgress = (request) => {
  if (normalizeStatus(request?.status) === "completed") return 100;
  const milestones = Array.isArray(request?.milestones)
    ? request.milestones
    : [];
  if (!milestones.length) {
    return normalizeStatus(request?.status) === "accepted" ? 50 : 0;
  }
  const approved = milestones.filter(
    (item) => normalizeStatus(item?.status) === "approved",
  ).length;
  return Math.round((approved / milestones.length) * 100);
};

const getCustomerFullDetail = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    const [constructionProjects, architectHirings, designRequests, bids] =
      await Promise.all([
        ConstructionProjectSchema.find({ customerId })
          .populate("companyId", "companyName email contactPerson")
          .sort({ createdAt: -1 })
          .lean(),
        ArchitectHiring.find({ customer: customerId })
          .populate("worker", "name email specialization profileImage")
          .sort({ createdAt: -1 })
          .lean(),
        DesignRequest.find({ customerId })
          .populate("workerId", "name email specialization profileImage")
          .sort({ createdAt: -1 })
          .lean(),
        Bid.find({ customerId })
          .populate("companyBids.companyId", "companyName")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    const customerReviews = Array.isArray(customer.reviews)
      ? customer.reviews
      : [];

    const fromConstruction = constructionProjects.map((project) => ({
      _id: project._id,
      type: "construction",
      typeLabel: "Construction",
      projectName: project.projectName || "Construction Project",
      partnerType: "company",
      partnerName: project.companyId?.companyName || "Not Assigned",
      partnerId: project.companyId?._id || null,
      status: project.status || "pending",
      amount:
        project.paymentDetails?.totalAmount ||
        project.proposal?.price ||
        project.estimatedBudget ||
        0,
      createdAt: project.createdAt,
      startDate: project.createdAt,
      expectedCompletion: project.targetCompletionDate || null,
      progress: Number(project.completionPercentage || 0),
      completionDate: project.customerReview?.reviewDate || null,
      rating: project.customerReview?.rating || null,
      reviewComment: project.customerReview?.reviewText || "",
      routePath: `/construction-project/${project._id}`,
    }));

    const fromArchitect = architectHirings.map((hiring) => {
      const inlineReview = hiring.review?.customerToWorker || {};
      const fallbackReview = customerReviews.find(
        (review) =>
          String(review.projectId || "") === String(hiring._id || "") ||
          String(review.workerId || "") === String(hiring.worker?._id || ""),
      );

      return {
        _id: hiring._id,
        type: "architect",
        typeLabel: "Architect Hiring",
        projectName: hiring.projectName || "Architecture Project",
        partnerType: "worker",
        partnerName: hiring.worker?.name || "Not Assigned",
        partnerId: hiring.worker?._id || null,
        status: hiring.status || "Pending",
        amount:
          hiring.finalAmount ||
          hiring.paymentDetails?.totalAmount ||
          hiring.proposal?.price ||
          0,
        createdAt: hiring.createdAt,
        startDate: hiring.createdAt,
        expectedCompletion: hiring.additionalDetails?.completionDate || null,
        progress: getArchitectProgress(hiring),
        completionDate:
          inlineReview.submittedAt || fallbackReview?.reviewedAt || null,
        rating: inlineReview.rating || fallbackReview?.rating || null,
        reviewComment: inlineReview.comment || fallbackReview?.comment || "",
        routePath: `/architect-hiring/${hiring._id}`,
      };
    });

    const fromInterior = designRequests.map((request) => {
      const inlineReview = request.review?.customerToWorker || {};
      const fallbackReview = customerReviews.find(
        (review) =>
          String(review.projectId || "") === String(request._id || "") ||
          String(review.workerId || "") === String(request.workerId?._id || ""),
      );

      return {
        _id: request._id,
        type: "interior",
        typeLabel: "Interior Design",
        projectName:
          request.projectName || `${request.roomType || "Interior"} Design`,
        partnerType: "worker",
        partnerName: request.workerId?.name || "Not Assigned",
        partnerId: request.workerId?._id || null,
        status: request.status || "pending",
        amount:
          request.finalAmount ||
          request.paymentDetails?.totalAmount ||
          request.proposal?.price ||
          0,
        createdAt: request.createdAt,
        startDate: request.createdAt,
        expectedCompletion: null,
        progress: getInteriorProgress(request),
        completionDate:
          inlineReview.submittedAt || fallbackReview?.reviewedAt || null,
        rating: inlineReview.rating || fallbackReview?.rating || null,
        reviewComment: inlineReview.comment || fallbackReview?.comment || "",
        routePath: `/design-request/${request._id}`,
      };
    });

    const bidsPlaced = bids.map((bid) => {
      const winningBid =
        bid.companyBids?.find(
          (companyBid) =>
            String(companyBid._id || "") === String(bid.winningBidId || "") ||
            normalizeStatus(companyBid.status) === "accepted",
        ) || null;

      return {
        _id: bid._id,
        projectName: bid.projectName || "Bid",
        location: bid.projectLocation || "—",
        totalArea: bid.totalArea || 0,
        estimatedBudget: bid.estimatedBudget || 0,
        bidsReceived: Array.isArray(bid.companyBids)
          ? bid.companyBids.length
          : 0,
        status: bid.status || "open",
        createdAt: bid.createdAt,
        winningBid: winningBid
          ? {
              companyName:
                winningBid.companyName ||
                winningBid.companyId?.companyName ||
                "—",
              amount: winningBid.bidPrice || 0,
            }
          : null,
        routePath: `/bid/${bid._id}`,
      };
    });

    const unifiedProjects = [
      ...fromConstruction,
      ...fromArchitect,
      ...fromInterior,
    ];

    const ongoingProjects = unifiedProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ![
        "accepted",
        "completed",
        "rejected",
        "cancelled",
        "closed",
        "awarded",
      ].includes(status);
    });

    const completedProjects = unifiedProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ["accepted", "completed"].includes(status);
    });

    const hiredProfessionals = {
      architects: fromArchitect
        .filter((project) => project.partnerId)
        .map((project) => ({
          professionalId: project.partnerId,
          professionalName: project.partnerName,
          avatar:
            architectHirings.find(
              (item) => String(item._id) === String(project._id),
            )?.worker?.profileImage || "",
          specialization: "Architect",
          projectName: project.projectName,
          fixedAmount: project.amount,
          status: project.status,
          hiredOn: project.createdAt,
          ratingGiven: project.rating,
          routePath: project.routePath,
        })),
      interiorDesigners: fromInterior
        .filter((project) => project.partnerId)
        .map((project) => ({
          professionalId: project.partnerId,
          professionalName: project.partnerName,
          avatar:
            designRequests.find(
              (item) => String(item._id) === String(project._id),
            )?.workerId?.profileImage || "",
          specialization: "Interior Designer",
          projectName: project.projectName,
          fixedAmount: project.amount,
          status: project.status,
          hiredOn: project.createdAt,
          ratingGiven: project.rating,
          routePath: project.routePath,
        })),
    };

    const reviewMap = new Map();
    customerReviews.forEach((review, index) => {
      const key = `${review.projectId || review.projectName || "review"}-${index}`;
      reviewMap.set(key, {
        projectName: review.projectName || "Project",
        partnerName: review.workerName || "Professional",
        rating: review.rating || 0,
        comment: review.comment || "",
        reviewedOn: review.reviewedAt || null,
      });
    });

    unifiedProjects.forEach((project, index) => {
      if (project.rating || project.reviewComment) {
        const key = `${project._id}-${index}`;
        reviewMap.set(key, {
          projectName: project.projectName,
          partnerName: project.partnerName,
          rating: project.rating || 0,
          comment: project.reviewComment || "",
          reviewedOn: project.completionDate || project.createdAt,
        });
      }
    });

    const reviewsGiven = Array.from(reviewMap.values()).sort(
      (a, b) => new Date(b.reviewedOn || 0) - new Date(a.reviewedOn || 0),
    );

    const paymentHistory = [
      ...constructionProjects.map((project) => ({
        date: project.updatedAt || project.createdAt,
        project: project.projectName || "Construction Project",
        amountPaid:
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        platformCommission: project.paymentDetails?.platformFee || 0,
        status: project.paymentDetails?.paymentStatus || "unpaid",
        paymentMethod: project.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/construction-project/${project._id}`,
      })),
      ...architectHirings.map((hiring) => ({
        date:
          hiring.paymentDetails?.paymentInitiatedAt ||
          hiring.updatedAt ||
          hiring.createdAt,
        project: hiring.projectName || "Architecture Project",
        amountPaid:
          hiring.paymentDetails?.totalAmount || hiring.finalAmount || 0,
        platformCommission: hiring.paymentDetails?.platformCommission || 0,
        status: hiring.paymentDetails?.escrowStatus || "not_initiated",
        paymentMethod: hiring.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/architect-hiring/${hiring._id}`,
      })),
      ...designRequests.map((request) => ({
        date:
          request.paymentDetails?.paymentInitiatedAt ||
          request.updatedAt ||
          request.createdAt,
        project:
          request.projectName || `${request.roomType || "Interior"} Design`,
        amountPaid:
          request.paymentDetails?.totalAmount || request.finalAmount || 0,
        platformCommission: request.paymentDetails?.platformCommission || 0,
        status: request.paymentDetails?.escrowStatus || "not_initiated",
        paymentMethod: request.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/design-request/${request._id}`,
      })),
      ...bids.map((bid) => ({
        date: bid.updatedAt || bid.createdAt,
        project: bid.projectName || "Bid",
        amountPaid: bid.paymentDetails?.totalAmount || 0,
        platformCommission: bid.paymentDetails?.platformFee || 0,
        status: bid.paymentDetails?.paymentStatus || "unpaid",
        paymentMethod: bid.paymentDetails?.stripeSessionId ? "Stripe" : "—",
        routePath: `/bid/${bid._id}`,
      })),
    ]
      .filter((payment) => Number(payment.amountPaid || 0) > 0)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    res.json({
      success: true,
      customer,
      summary: {
        totalProjects: unifiedProjects.length + bids.length,
        projectsOnly: unifiedProjects.length,
        bidsOnly: bids.length,
        memberSince: customer.createdAt,
      },
      ongoingProjects,
      completedProjects,
      hiredProfessionals,
      bidsPlaced,
      reviewsGiven,
      paymentHistory,
      timestamps: {
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full customer detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getCompanyDetail = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Fetch all related projects and connections
    const constructionProjects = await ConstructionProjectSchema.find({
      companyId: req.params.id,
    })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    const jobApplications = await WorkerToCompany.find({
      companyId: req.params.id,
    })
      .populate("workerId", "name email phone specialization")
      .sort({ createdAt: -1 });

    // Get bids where this company has submitted proposals
    const bidsWithCompany = await Bid.find({
      "companyBids.companyId": req.params.id,
    })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      company,
      relatedData: {
        constructionProjects,
        jobApplications,
        bids: bidsWithCompany,
        ongoingProjects: constructionProjects.filter(
          (p) => p.status === "accepted" || p.status === "ongoing",
        ).length,
        completedProjects: constructionProjects.filter(
          (p) => p.status === "completed",
        ).length,
        totalApplications: jobApplications.length,
        acceptedApplications: jobApplications.filter(
          (app) => app.status === "accepted",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getCompanyFullDetail = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId).lean();

    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const [constructionProjects, bids, jobPostings, jobApplications] =
      await Promise.all([
        ConstructionProjectSchema.find({ companyId })
          .populate("customerId", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        Bid.find({ "companyBids.companyId": companyId })
          .populate("customerId", "name email phone")
          .sort({ createdAt: -1 })
          .lean(),
        CompanytoWorker.find({ company: companyId })
          .populate("worker", "name email phone specialization")
          .sort({ _id: -1 })
          .lean(),
        WorkerToCompany.find({ companyId })
          .populate("workerId", "name email phone specialization experience")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    const workerIdsFromOffers = jobPostings
      .map((posting) => posting.worker?._id || posting.worker)
      .filter(Boolean)
      .map((workerId) => String(workerId));

    const uniqueWorkerIds = [...new Set(workerIdsFromOffers)];

    const offerWorkers = uniqueWorkerIds.length
      ? await Worker.find({ _id: { $in: uniqueWorkerIds } })
          .select("name email phone specialization experience status")
          .lean()
      : [];

    const offerWorkerMap = new Map(
      offerWorkers.map((worker) => [String(worker._id), worker]),
    );

    const activeConstructionProjects = constructionProjects
      .filter((project) => {
        const status = normalizeStatus(project.status);
        return !["completed", "closed", "rejected", "cancelled"].includes(
          status,
        );
      })
      .map((project) => ({
        _id: project._id,
        type: "construction",
        projectName: project.projectName || "Construction Project",
        customerName:
          project.customerId?.name || project.customerName || "Unknown",
        status: project.status || "pending",
        amount:
          project.proposal?.price || project.paymentDetails?.totalAmount || 0,
        progress: project.completionPercentage || 0,
        currentPhase: project.currentPhase || "—",
        startDate: project.createdAt,
        targetCompletionDate: project.targetCompletionDate || null,
        routePath: `/construction-project/${project._id}`,
      }));

    const bidsWithCompany = bids.map((bid) => {
      const companyBid = (bid.companyBids || []).find(
        (entry) => String(entry.companyId) === String(companyId),
      );

      const isWinning =
        companyBid &&
        bid.winningBidId &&
        String(companyBid._id) === String(bid.winningBidId);

      return {
        _id: bid._id,
        projectName: bid.projectName || "Bid",
        customerName: bid.customerId?.name || bid.customerName || "Unknown",
        bidAmount: companyBid?.bidPrice || 0,
        winningBidDate: companyBid?.bidDate || bid.updatedAt || bid.createdAt,
        status: bid.status || "open",
        totalArea: bid.totalArea || 0,
        isWinning,
        routePath: `/bid/${bid._id}`,
      };
    });

    const wonBidsWithCompany = bidsWithCompany.filter((bid) => bid.isWinning);

    const activeBidProjects = wonBidsWithCompany.map((bid) => ({
      _id: bid._id,
      type: "bid_awarded",
      projectName: bid.projectName,
      customerName: bid.customerName,
      status: bid.status,
      amount: bid.bidAmount,
      progress: 100,
      currentPhase: "Awarded",
      startDate: bid.winningBidDate,
      targetCompletionDate: null,
      routePath: bid.routePath,
    }));

    const ongoingProjects = [
      ...activeConstructionProjects,
      ...activeBidProjects,
    ];

    const completedShowcase = [
      ...(company.completedProjects || []).map((item, index) => ({
        _id: `${company._id}-showcase-${index}`,
        title: item.title || `Completed Project ${index + 1}`,
        description: item.description || "—",
        beforeImage: item.beforeImage || "",
        afterImage: item.afterImage || "",
        location: item.location || "—",
        completionYear:
          item.completionYear ||
          (item.updatedAt ? new Date(item.updatedAt).getFullYear() : null),
        materialCertificate: item.materialCertificate || "",
        gpsLink: item.gpsLink || "",
      })),
      ...constructionProjects
        .filter((project) => normalizeStatus(project.status) === "completed")
        .map((project) => ({
          _id: project._id,
          title: project.projectName || "Construction Project",
          description: project.specialRequirements || "Completed construction",
          beforeImage: project.mainImagePath || "",
          afterImage:
            Array.isArray(project.completionImages) &&
            project.completionImages.length
              ? project.completionImages[0]
              : "",
          location: project.projectAddress || "—",
          completionYear: project.updatedAt
            ? new Date(project.updatedAt).getFullYear()
            : null,
          materialCertificate: "",
          gpsLink: "",
        })),
    ];

    const jobPostingsCreated = jobPostings.map((posting) => {
      const populatedWorkerId = posting.worker?._id || posting.worker;
      const workerId = populatedWorkerId ? String(populatedWorkerId) : null;
      const fetchedWorker = workerId ? offerWorkerMap.get(workerId) : null;

      return {
        _id: posting._id,
        position: posting.position || "—",
        location: posting.location || "—",
        salary: posting.salary || 0,
        status: posting.status || "Pending",
        postedOn: posting.createdAt || posting._id?.getTimestamp?.() || null,
        workerId,
        workerName: fetchedWorker?.name || posting.worker?.name || "—",
        workerEmail: fetchedWorker?.email || posting.worker?.email || "—",
        workerPhone: fetchedWorker?.phone || posting.worker?.phone || "—",
        workerSpecialization:
          fetchedWorker?.specialization ||
          posting.worker?.specialization ||
          "—",
        workerExperience: Number(fetchedWorker?.experience || 0),
        workerProfileStatus: fetchedWorker?.status || "pending",
        workerRoutePath: workerId ? `/worker/${workerId}` : null,
      };
    });

    const receivedJobApplications = jobApplications.map((application) => ({
      _id: application._id,
      applicantName: application.fullName || application.workerId?.name || "—",
      position: application.positionApplying || "—",
      experience:
        application.experience ?? application.workerId?.experience ?? 0,
      expectedSalary: application.expectedSalary || 0,
      status: application.status || "Pending",
      appliedOn: application.createdAt || null,
      routePath: `/job-application/${application._id}`,
    }));

    const constructionValue = constructionProjects.reduce((sum, project) => {
      const status = normalizeStatus(project.status);
      if (
        ["accepted", "completed", "ongoing", "in progress"].includes(status)
      ) {
        return (
          sum +
          Number(
            project.paymentDetails?.totalAmount || project.proposal?.price || 0,
          )
        );
      }
      return sum;
    }, 0);

    const bidValue = wonBidsWithCompany.reduce(
      (sum, bid) => sum + Number(bid.bidAmount || 0),
      0,
    );

    let totalAmountReceived = 0;
    let pendingPayouts = 0;
    let lastPayoutDate = null;
    let lastPayoutAmount = 0;

    const constructionFinanceDetails = constructionProjects.map((project) => {
      const payouts = project.paymentDetails?.payouts || [];
      const releasedPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "released",
      );
      const pendingProjectPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "pending",
      );

      const totalReleasedForProject = releasedPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );
      const pendingForProject = pendingProjectPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );

      const commissionFee = Number(project.paymentDetails?.platformFee || 0);
      const companyNetAmount = Math.max(
        Number(
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        ) - commissionFee,
        0,
      );
      const commissionReceived = companyNetAmount
        ? Math.min(
            commissionFee,
            (totalReleasedForProject / companyNetAmount) * commissionFee,
          )
        : totalReleasedForProject > 0
          ? commissionFee
          : 0;

      const projectLastPayoutDate = releasedPayouts.length
        ? releasedPayouts
            .map((payout) => payout.releaseDate)
            .filter(Boolean)
            .sort((left, right) => new Date(right) - new Date(left))[0] || null
        : null;

      return {
        id: project._id,
        projectName: project.projectName || "Construction Project",
        type: "construction",
        status: project.status || "pending",
        contractValue: Number(
          project.paymentDetails?.totalAmount || project.proposal?.price || 0,
        ),
        totalReleased: totalReleasedForProject,
        pendingPayout: pendingForProject,
        commissionFee,
        commissionReceived,
        payoutCount: payouts.length,
        releasedCount: releasedPayouts.length,
        pendingCount: pendingProjectPayouts.length,
        lastPayoutDate: projectLastPayoutDate,
        routePath: `/construction-project/${project._id}`,
      };
    });

    const bidFinanceDetails = wonBidsWithCompany.map((bid) => {
      const sourceBid = bids.find(
        (entry) => String(entry._id) === String(bid._id),
      );
      const payouts = sourceBid?.paymentDetails?.payouts || [];
      const releasedPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "released",
      );
      const pendingProjectPayouts = payouts.filter(
        (payout) => normalizeStatus(payout.status) === "pending",
      );

      const totalReleasedForProject = releasedPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );
      const pendingForProject = pendingProjectPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0,
      );

      const commissionFee = Number(sourceBid?.paymentDetails?.platformFee || 0);
      const companyNetAmount = Math.max(
        Number(bid.bidAmount || 0) - commissionFee,
        0,
      );
      const commissionReceived = companyNetAmount
        ? Math.min(
            commissionFee,
            (totalReleasedForProject / companyNetAmount) * commissionFee,
          )
        : totalReleasedForProject > 0
          ? commissionFee
          : 0;

      const projectLastPayoutDate = releasedPayouts.length
        ? releasedPayouts
            .map((payout) => payout.releaseDate)
            .filter(Boolean)
            .sort((left, right) => new Date(right) - new Date(left))[0] || null
        : null;

      return {
        id: bid._id,
        projectName: bid.projectName || "Bid",
        type: "bid",
        status: bid.status || "open",
        contractValue: Number(bid.bidAmount || 0),
        totalReleased: totalReleasedForProject,
        pendingPayout: pendingForProject,
        commissionFee,
        commissionReceived,
        payoutCount: payouts.length,
        releasedCount: releasedPayouts.length,
        pendingCount: pendingProjectPayouts.length,
        lastPayoutDate: projectLastPayoutDate,
        routePath: bid.routePath,
      };
    });

    constructionProjects.forEach((project) => {
      (project.paymentDetails?.payouts || []).forEach((payout) => {
        const value = Number(payout.amount || 0);
        const payoutStatus = normalizeStatus(payout.status);
        if (payoutStatus === "released") {
          totalAmountReceived += value;
          const releaseAt = payout.releaseDate
            ? new Date(payout.releaseDate)
            : null;
          if (releaseAt && (!lastPayoutDate || releaseAt > lastPayoutDate)) {
            lastPayoutDate = releaseAt;
            lastPayoutAmount = value;
          }
        } else if (payoutStatus === "pending") {
          pendingPayouts += value;
        }
      });
    });

    bids.forEach((bid) => {
      (bid.paymentDetails?.payouts || []).forEach((payout) => {
        const value = Number(payout.amount || 0);
        const payoutStatus = normalizeStatus(payout.status);
        if (payoutStatus === "released") {
          totalAmountReceived += value;
          const releaseAt = payout.releaseDate
            ? new Date(payout.releaseDate)
            : null;
          if (releaseAt && (!lastPayoutDate || releaseAt > lastPayoutDate)) {
            lastPayoutDate = releaseAt;
            lastPayoutAmount = value;
          }
        } else if (payoutStatus === "pending") {
          pendingPayouts += value;
        }
      });
    });

    const totalCommissionReceived =
      constructionFinanceDetails.reduce(
        (sum, row) => sum + Number(row.commissionReceived || 0),
        0,
      ) +
      bidFinanceDetails.reduce(
        (sum, row) => sum + Number(row.commissionReceived || 0),
        0,
      );

    const reviewsReceived = constructionProjects
      .filter((project) => project.customerReview?.rating)
      .map((project) => ({
        _id: project._id,
        projectName: project.projectName || "Project",
        customerName:
          project.customerId?.name || project.customerName || "Customer",
        rating: Number(project.customerReview?.rating || 0),
        comment: project.customerReview?.reviewText || "",
        reviewedOn: project.customerReview?.reviewDate || project.updatedAt,
      }))
      .sort((left, right) => {
        return new Date(right.reviewedOn || 0) - new Date(left.reviewedOn || 0);
      });

    const companyDocuments = Array.isArray(company.companyDocuments)
      ? company.companyDocuments
      : [];

    res.json({
      success: true,
      company,
      summary: {
        activeProjectsCount: ongoingProjects.length,
        completedProjectsCount: completedShowcase.length,
        totalProjectsCount:
          Number(company.completedProjects?.length || 0) +
          ongoingProjects.length,
        documentsCount: companyDocuments.length,
      },
      verification: {
        status: company.status || "pending",
        verifiedOn: company.status === "verified" ? company.updatedAt : null,
        rejectionReason: company.rejectionReason || "",
        documents: companyDocuments,
      },
      ongoingProjects,
      completedShowcase,
      bidsWon: wonBidsWithCompany,
      recruitment: {
        jobPostingsCreated,
        receivedJobApplications,
      },
      finance: {
        totalProjectValueHandled: constructionValue + bidValue,
        totalAmountReceived,
        pendingPayouts,
        totalCommissionReceived,
        lastPayoutDate,
        lastPayoutAmount,
        constructionDetails: constructionFinanceDetails,
        bidDetails: bidFinanceDetails,
      },
      reviewsReceived,
      timestamps: {
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full company detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getWorkerDetail = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Fetch all related projects and connections
    const architectHirings = await ArchitectHiring.find({
      worker: req.params.id,
    })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    const designRequests = await DesignRequest.find({ workerId: req.params.id })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    const jobApplications = await WorkerToCompany.find({
      workerId: req.params.id,
    })
      .populate("companyId", "companyName email contactPerson")
      .sort({ createdAt: -1 });

    res.json({
      worker,
      relatedData: {
        architectHirings,
        designRequests,
        jobApplications,
        totalProjects: architectHirings.length + designRequests.length,
        activeProjects: [
          ...architectHirings.filter(
            (h) => h.status === "accepted" || h.status === "In-Progress",
          ),
          ...designRequests.filter(
            (d) => d.status === "accepted" || d.status === "In-Progress",
          ),
        ].length,
        completedProjects: [
          ...architectHirings.filter((h) => h.status === "Completed"),
          ...designRequests.filter((d) => d.status === "Completed"),
        ].length,
        totalApplications: jobApplications.length,
        acceptedApplications: jobApplications.filter(
          (app) => app.status === "accepted",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching worker:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getWorkerFullDetail = async (req, res) => {
  try {
    const workerId = req.params.workerId;
    const worker = await Worker.findById(workerId).lean();

    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }

    const [
      architectHirings,
      designRequests,
      transactions,
      commissionAggregation,
    ] = await Promise.all([
      ArchitectHiring.find({ worker: workerId })
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 })
        .lean(),
      DesignRequest.find({ workerId })
        .populate("customerId", "name email phone")
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.find({ workerId }).sort({ createdAt: -1 }).limit(12).lean(),
      Transaction.aggregate([
        { $match: { workerId: worker._id } },
        {
          $group: {
            _id: null,
            totalPlatformFee: { $sum: { $ifNull: ["$platformFee", 0] } },
            totalCommissionTransactions: {
              $sum: {
                $cond: [
                  { $eq: ["$transactionType", "platform_commission"] },
                  { $ifNull: ["$amount", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const workerSafe = { ...worker };
    delete workerSafe.password;

    const architectProjects = architectHirings.map((item) => {
      const amount =
        Number(item?.finalAmount || 0) ||
        Number(item?.proposal?.price || 0) ||
        Number(item?.paymentDetails?.workerAmount || 0) ||
        Number(item?.paymentDetails?.totalAmount || 0);

      const milestones = Array.isArray(item?.milestones) ? item.milestones : [];
      const approvedMilestones = milestones.filter(
        (milestone) => normalizeStatus(milestone?.status) === "approved",
      ).length;

      return {
        _id: item._id,
        type: "architect",
        typeLabel: "Architect Hiring",
        projectName: item.projectName || "Architect Hiring",
        customerName:
          item.customer?.name || item.customerDetails?.fullName || "—",
        status: item.status || "Pending",
        amount,
        progress: getArchitectProgress(item),
        milestoneLabel: milestones.length
          ? `${approvedMilestones}/${milestones.length} approved`
          : "No milestones",
        hiredOn: item.createdAt,
        completionDate:
          normalizeStatus(item.status) === "completed" ? item.updatedAt : null,
        rating: Number(item.review?.customerToWorker?.rating || 0),
        reviewComment: item.review?.customerToWorker?.comment || "",
        routePath: `/architect-hiring/${item._id}`,
      };
    });

    const interiorProjects = designRequests.map((item) => {
      const amount =
        Number(item?.finalAmount || 0) ||
        Number(item?.proposal?.price || 0) ||
        Number(item?.paymentDetails?.workerAmount || 0) ||
        Number(item?.paymentDetails?.totalAmount || 0);

      const milestones = Array.isArray(item?.milestones) ? item.milestones : [];
      const approvedMilestones = milestones.filter(
        (milestone) => normalizeStatus(milestone?.status) === "approved",
      ).length;

      return {
        _id: item._id,
        type: "interior",
        typeLabel: "Interior Design",
        projectName: item.projectName || "Interior Design",
        customerName: item.customerId?.name || item.fullName || "—",
        status: item.status || "pending",
        amount,
        progress: getInteriorProgress(item),
        milestoneLabel: milestones.length
          ? `${approvedMilestones}/${milestones.length} approved`
          : "No milestones",
        hiredOn: item.createdAt,
        completionDate:
          normalizeStatus(item.status) === "completed" ? item.updatedAt : null,
        rating: Number(item.review?.customerToWorker?.rating || 0),
        reviewComment: item.review?.customerToWorker?.comment || "",
        routePath: `/design-request/${item._id}`,
      };
    });

    const allProjects = [...architectProjects, ...interiorProjects].sort(
      (left, right) =>
        new Date(right.hiredOn || 0).getTime() -
        new Date(left.hiredOn || 0).getTime(),
    );

    const ongoingProjects = allProjects.filter((project) => {
      const status = normalizeStatus(project.status);
      return ![
        "completed",
        "rejected",
        "cancelled",
        "denied",
        "closed",
      ].includes(status);
    });

    const completedProjects = allProjects.filter(
      (project) => normalizeStatus(project.status) === "completed",
    );

    const reviewsReceived = (worker.reviews || [])
      .map((review, index) => ({
        _id: review._id || `${worker._id}-review-${index}`,
        projectId: review.projectId,
        projectName: review.projectName || "Project",
        projectType: review.projectType || "worker",
        customerName: review.customerName || "Customer",
        rating: Number(review.rating || 0),
        comment: review.comment || "",
        reviewedOn: review.reviewedAt || worker.updatedAt,
      }))
      .sort(
        (left, right) =>
          new Date(right.reviewedOn || 0).getTime() -
          new Date(left.reviewedOn || 0).getTime(),
      );

    const computedAverage = reviewsReceived.length
      ? reviewsReceived.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0,
        ) / reviewsReceived.length
      : 0;

    const totalCommission = Number(
      commissionAggregation?.[0]?.totalPlatformFee ||
        commissionAggregation?.[0]?.totalCommissionTransactions ||
        0,
    );

    const earnings = {
      totalEarnings: Number(worker.earnings?.totalEarnings || 0),
      availableBalance: Number(worker.earnings?.availableBalance || 0),
      pendingBalance: Number(worker.earnings?.pendingBalance || 0),
      withdrawnAmount: Number(worker.earnings?.withdrawnAmount || 0),
      monthlyEarnings: Number(worker.earnings?.monthlyEarnings || 0),
      yearlyEarnings: Number(worker.earnings?.yearlyEarnings || 0),
      subscriptionPlan: String(worker.subscriptionPlan || "basic"),
      commissionRate: Number(worker.commissionRate || 0),
      totalCommission,
    };

    const recentTransactions = transactions.map((transaction) => ({
      _id: transaction._id,
      date: transaction.createdAt,
      type: transaction.transactionType || "payment",
      amount: Number(transaction.amount || 0),
      netAmount: Number(transaction.netAmount || 0),
      platformFee: Number(transaction.platformFee || 0),
      status: transaction.status || "pending",
      description: transaction.description || "",
    }));

    res.json({
      success: true,
      worker: workerSafe,
      summary: {
        activeProjectsCount: ongoingProjects.length,
        completedProjectsCount: completedProjects.length,
        totalProjectsCount: allProjects.length,
        averageRating:
          Number(worker.rating || 0) > 0
            ? Number(worker.rating || 0)
            : Number(computedAverage.toFixed(1)),
        totalReviews: Number(worker.totalReviews || reviewsReceived.length),
        memberSince: worker.createdAt,
        totalEarnings: earnings.totalEarnings,
      },
      verification: {
        status: worker.status || "pending",
        aadhaarVerified: Boolean(worker.aadharNumber),
        aadhaarLast4: String(worker.aadharNumber || "").slice(-4),
        certificateFiles: Array.isArray(worker.certificateFiles)
          ? worker.certificateFiles
          : [],
        rejectionReason: worker.rejectionReason || "",
      },
      ongoingProjects,
      completedProjects,
      earnings: {
        ...earnings,
        recentTransactions,
      },
      reviewsReceived,
      previousEmployment: Array.isArray(worker.previousCompanies)
        ? worker.previousCompanies
        : [],
      portfolio: Array.isArray(worker.projects) ? worker.projects : [],
      timestamps: {
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full worker detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getArchitectHiringDetail = async (req, res) => {
  try {
    const hiring = await ArchitectHiring.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("worker", "name email specialization");
    if (!hiring) {
      return res.status(404).json({ error: "Architect hiring not found" });
    }
    res.json({ hiring });
  } catch (error) {
    console.error("Error fetching architect hiring:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getArchitectHiringFullDetail = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const hiring = await ArchitectHiring.findById(projectId)
      .populate("customer", "name email phone")
      .populate("worker", "name email phone specialization")
      .lean();

    if (!hiring) {
      return res
        .status(404)
        .json({ success: false, error: "Architect hiring not found" });
    }

    const milestonePayments = Array.isArray(
      hiring.paymentDetails?.milestonePayments,
    )
      ? hiring.paymentDetails.milestonePayments
      : [];

    const lastPaymentCollectedAt =
      milestonePayments
        .map((item) => item.paymentCollectedAt)
        .filter(Boolean)
        .sort((left, right) => new Date(right) - new Date(left))[0] || null;

    const paymentSummary = {
      totalAmount: Number(hiring.paymentDetails?.totalAmount || 0),
      platformCommission: Number(
        hiring.paymentDetails?.platformCommission || 0,
      ),
      workerAmount: Number(hiring.paymentDetails?.workerAmount || 0),
      escrowStatus: hiring.paymentDetails?.escrowStatus || "not_initiated",
      stripeSessionId: hiring.paymentDetails?.stripeSessionId || "",
      stripePaymentIntentId: hiring.paymentDetails?.stripePaymentIntentId || "",
      paymentInitiatedAt: hiring.paymentDetails?.paymentInitiatedAt || null,
      lastPaymentCollectedAt,
      milestonePayments: milestonePayments.map((item, index) => ({
        _id: item._id || `${hiring._id}-milestone-payment-${index}`,
        percentage: Number(item.percentage || 0),
        amount: Number(item.amount || 0),
        platformFee: Number(item.platformFee || 0),
        workerPayout: Number(item.workerPayout || 0),
        paymentCollected: Boolean(item.paymentCollected),
        paymentCollectedAt: item.paymentCollectedAt || null,
        status: item.status || "pending",
        releasedAt: item.releasedAt || null,
        withdrawnAt: item.withdrawnAt || null,
      })),
    };

    const summary = {
      projectName: hiring.projectName || "Architect Hiring",
      status: hiring.status || "Pending",
      customerName:
        hiring.customer?.name || hiring.customerDetails?.fullName || "Unknown",
      customerId: hiring.customer?._id || null,
      architectName: hiring.worker?.name || "Not Assigned",
      architectId: hiring.worker?._id || null,
      finalAmount:
        Number(hiring.finalAmount || 0) ||
        Number(hiring.proposal?.price || 0) ||
        Number(paymentSummary.totalAmount || 0),
      platformCommission: paymentSummary.platformCommission,
      commissionRate:
        paymentSummary.totalAmount > 0 && paymentSummary.platformCommission > 0
          ? Number(
              (
                (paymentSummary.platformCommission /
                  paymentSummary.totalAmount) *
                100
              ).toFixed(2),
            )
          : 0,
    };

    const milestones = (
      Array.isArray(hiring.milestones) ? hiring.milestones : []
    ).map((item, index) => ({
      _id: item._id || `${hiring._id}-milestone-${index}`,
      percentage: Number(item.percentage || 0),
      description: item.description || "",
      status: item.status || "Pending",
      image: item.image || "",
      submittedAt: item.submittedAt || null,
      approvedAt: item.approvedAt || null,
      rejectedAt: item.rejectedAt || null,
      rejectionReason: item.rejectionReason || "",
      revisionRequestedAt: item.revisionRequestedAt || null,
      revisionNotes: item.revisionNotes || "",
      adminReport: item.adminReport || "",
      adminReviewNotes: item.adminReviewNotes || "",
    }));

    const projectUpdates = (
      Array.isArray(hiring.projectUpdates) ? hiring.projectUpdates : []
    )
      .map((item, index) => ({
        _id: item._id || `${hiring._id}-update-${index}`,
        updateText: item.updateText || "",
        updateImage: item.updateImage || "",
        createdAt: item.createdAt || hiring.updatedAt,
      }))
      .sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      );

    const proposal = {
      price: Number(hiring.proposal?.price || 0),
      description: hiring.proposal?.description || "",
      sentAt: hiring.proposal?.sentAt || null,
      phases: Array.isArray(hiring.proposal?.phases)
        ? hiring.proposal.phases.map((phase, index) => ({
            _id: phase._id || `${hiring._id}-phase-${index}`,
            name: phase.name || `Phase ${index + 1}`,
            percentage: Number(phase.percentage || 0),
            requiredMonths: Number(phase.requiredMonths || 0),
            amount: Number(phase.amount || 0),
            subdivisions: Array.isArray(phase.subdivisions)
              ? phase.subdivisions.map((subdivision, subIndex) => ({
                  _id:
                    subdivision._id ||
                    `${hiring._id}-phase-${index}-sub-${subIndex}`,
                  category: subdivision.category || "",
                  description: subdivision.description || "",
                  amount: Number(subdivision.amount || 0),
                }))
              : [],
          }))
        : [],
    };

    const references = Array.isArray(hiring.additionalDetails?.referenceImages)
      ? hiring.additionalDetails.referenceImages
      : [];

    res.json({
      success: true,
      hiring,
      summary,
      proposal,
      milestones,
      paymentSummary,
      projectUpdates,
      references,
      review: hiring.review || {
        customerToWorker: null,
        workerToCustomer: null,
        isReviewCompleted: false,
      },
      timestamps: {
        createdAt: hiring.createdAt,
        updatedAt: hiring.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full architect hiring detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getConstructionProjectDetail = async (req, res) => {
  try {
    const project = await ConstructionProjectSchema.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName contactPerson email");
    if (!project) {
      return res.status(404).json({ error: "Construction project not found" });
    }
    res.json({ project });
  } catch (error) {
    console.error("Error fetching construction project:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getConstructionProjectFullDetail = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await ConstructionProjectSchema.findById(projectId)
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName contactPerson email phone")
      .lean();

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Construction project not found" });
    }

    const totalAmount = Number(
      project.paymentDetails?.totalAmount ||
        project.proposal?.price ||
        project.estimatedBudget ||
        0,
    );
    const platformFee = Number(project.paymentDetails?.platformFee || 0);
    const commissionRate =
      totalAmount > 0 && platformFee > 0
        ? Number(((platformFee / totalAmount) * 100).toFixed(2))
        : 0;

    const payoutEntries = Array.isArray(project.paymentDetails?.payouts)
      ? project.paymentDetails.payouts
      : [];
    const payoutReleased = payoutEntries.filter(
      (entry) => normalizeStatus(entry.status) === "released",
    );

    const siteFiles = [
      ...(Array.isArray(project.siteFilepaths) ? project.siteFilepaths : []),
      ...(project.mainImagePath ? [project.mainImagePath] : []),
      ...(Array.isArray(project.additionalImagePaths)
        ? project.additionalImagePaths
        : []),
    ].filter(Boolean);

    const completionImages = Array.isArray(project.completionImages)
      ? project.completionImages.filter(Boolean)
      : [];

    const floorBreakdown = Array.isArray(project.floors)
      ? project.floors.map((floor, index) => ({
          _id: floor._id || `${project._id}-floor-${index}`,
          floorNumber: floor.floorNumber ?? index + 1,
          floorType: floor.floorType || "other",
          floorArea: Number(floor.floorArea || 0),
          floorDescription: floor.floorDescription || "",
          floorImagePath: floor.floorImagePath || "",
        }))
      : [];

    const proposal = {
      price: Number(project.proposal?.price || 0),
      description: project.proposal?.description || "",
      sentAt: project.proposal?.sentAt || null,
      phases: Array.isArray(project.proposal?.phases)
        ? project.proposal.phases.map((phase, index) => ({
            _id: phase._id || `${project._id}-phase-${index}`,
            name: phase.name || `Phase ${index + 1}`,
            percentage: Number(phase.percentage || 0),
            requiredMonths: Number(phase.requiredMonths || 0),
            amount: Number(phase.amount || 0),
            paymentSchedule: {
              upfrontPercentage: Number(
                phase.paymentSchedule?.upfrontPercentage || 0,
              ),
              completionPercentage: Number(
                phase.paymentSchedule?.completionPercentage || 0,
              ),
              finalPercentage: Number(
                phase.paymentSchedule?.finalPercentage || 0,
              ),
            },
            subdivisions: Array.isArray(phase.subdivisions)
              ? phase.subdivisions.map((subdivision, subIndex) => ({
                  _id:
                    subdivision._id ||
                    `${project._id}-phase-${index}-sub-${subIndex}`,
                  category: subdivision.category || "",
                  description: subdivision.description || "",
                  amount: Number(subdivision.amount || 0),
                }))
              : [],
            bills: Array.isArray(phase.bills)
              ? phase.bills.map((bill, billIndex) => ({
                  _id:
                    bill._id ||
                    `${project._id}-phase-${index}-bill-${billIndex}`,
                  fileName: bill.fileName || `Bill ${billIndex + 1}`,
                  fileUrl: bill.fileUrl || "",
                  uploadedAt: bill.uploadedAt || null,
                  uploadedBy: bill.uploadedBy || "company",
                }))
              : [],
          }))
        : [],
    };

    const milestones = Array.isArray(project.milestones)
      ? project.milestones.map((milestone, index) => ({
          _id: milestone._id || `${project._id}-milestone-${index}`,
          percentage: Number(milestone.percentage || 0),
          phaseName: milestone.phaseName || "",
          companyMessage: milestone.companyMessage || "",
          isApprovedByCustomer: Boolean(milestone.isApprovedByCustomer),
          submittedAt: milestone.submittedAt || null,
          approvedAt: milestone.approvedAt || null,
          isCheckpoint: Boolean(milestone.isCheckpoint),
          isAutoGenerated: Boolean(milestone.isAutoGenerated),
          needsRevision: Boolean(milestone.needsRevision),
          customerFeedback: milestone.customerFeedback || "",
          payments: {
            upfront: {
              amount: Number(milestone.payments?.upfront?.amount || 0),
              status: milestone.payments?.upfront?.status || "pending",
              releasedAt: milestone.payments?.upfront?.releasedAt || null,
              billUrl: milestone.payments?.upfront?.billUrl || "",
            },
            completion: {
              amount: Number(milestone.payments?.completion?.amount || 0),
              status: milestone.payments?.completion?.status || "pending",
              releasedAt: milestone.payments?.completion?.releasedAt || null,
              billUrl: milestone.payments?.completion?.billUrl || "",
            },
            final: {
              amount: Number(milestone.payments?.final?.amount || 0),
              status: milestone.payments?.final?.status || "pending",
              releasedAt: milestone.payments?.final?.releasedAt || null,
              billUrl: milestone.payments?.final?.billUrl || "",
            },
          },
          conversation: Array.isArray(milestone.conversation)
            ? milestone.conversation.map((message, messageIndex) => ({
                _id:
                  message._id ||
                  `${project._id}-milestone-${index}-msg-${messageIndex}`,
                sender: message.sender || "company",
                message: message.message || "",
                timestamp: message.timestamp || null,
                viewedByCompany: Boolean(message.viewedByCompany),
                viewedByCustomer: Boolean(message.viewedByCustomer),
              }))
            : [],
        }))
      : [];

    const milestonePayments = milestones.flatMap((milestone) => {
      const phaseLabel = milestone.phaseName || `${milestone.percentage}%`;
      return [
        {
          _id: `${milestone._id}-upfront`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Upfront`,
          amount: milestone.payments.upfront.amount,
          platformFee: 0,
          companyPayout: milestone.payments.upfront.amount,
          status: milestone.payments.upfront.status,
          billUrl: milestone.payments.upfront.billUrl,
        },
        {
          _id: `${milestone._id}-completion`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Completion`,
          amount: milestone.payments.completion.amount,
          platformFee: 0,
          companyPayout: milestone.payments.completion.amount,
          status: milestone.payments.completion.status,
          billUrl: milestone.payments.completion.billUrl,
        },
        {
          _id: `${milestone._id}-final`,
          milestonePercentage: milestone.percentage,
          phaseName: `${phaseLabel} · Final`,
          amount: milestone.payments.final.amount,
          platformFee: 0,
          companyPayout: milestone.payments.final.amount,
          status: milestone.payments.final.status,
          billUrl: milestone.payments.final.billUrl,
        },
      ].filter((entry) => Number(entry.amount || 0) > 0 || entry.billUrl);
    });

    const projectUpdates = Array.isArray(project.recentUpdates)
      ? project.recentUpdates
          .map((update, index) => ({
            _id: update._id || `${project._id}-update-${index}`,
            updateText: update.updateText || "",
            updateImagePath: update.updateImagePath || "",
            createdAt: update.createdAt || null,
          }))
          .sort(
            (left, right) =>
              new Date(right.createdAt) - new Date(left.createdAt),
          )
      : [];

    const conversation = milestones
      .flatMap((milestone) =>
        (milestone.conversation || []).map((message) => ({
          ...message,
          milestonePercentage: milestone.percentage,
          phaseName: milestone.phaseName || "",
        })),
      )
      .sort(
        (left, right) => new Date(right.timestamp) - new Date(left.timestamp),
      );

    res.json({
      success: true,
      project,
      summary: {
        projectName: project.projectName || "Construction Project",
        status: project.status || "pending",
        customerName:
          project.customerName || project.customerId?.name || "Unknown",
        customerId: project.customerId?._id || null,
        companyName:
          project.companyId?.companyName ||
          project.companyName ||
          "Not Assigned",
        companyId: project.companyId?._id || null,
        contractAmount: totalAmount,
        platformFee,
        commissionRate,
      },
      basicInfo: {
        buildingType: project.buildingType || "other",
        totalArea: Number(project.totalArea || 0),
        totalFloors: Number(project.totalFloors || 0),
        projectAddress: project.projectAddress || "",
        projectLocationPincode: project.projectLocationPincode || "",
        estimatedBudget: Number(project.estimatedBudget || 0),
        projectTimeline: Number(project.projectTimeline || 0),
        specialRequirements: project.specialRequirements || "",
        accessibilityNeeds: project.accessibilityNeeds || "none",
        energyEfficiency: project.energyEfficiency || "standard",
        completionPercentage: Number(project.completionPercentage || 0),
        currentPhase: project.currentPhase || "",
        targetCompletionDate: project.targetCompletionDate || null,
      },
      floorBreakdown,
      proposal,
      milestones,
      paymentSummary: {
        totalAmount,
        platformFee,
        amountPaidToCompany: Number(
          project.paymentDetails?.amountPaidToCompany || 0,
        ),
        paymentStatus: project.paymentDetails?.paymentStatus || "unpaid",
        payouts: payoutEntries.map((entry, index) => ({
          _id: entry._id || `${project._id}-payout-${index}`,
          amount: Number(entry.amount || 0),
          status: entry.status || "pending",
          releaseDate: entry.releaseDate || null,
          milestonePercentage: Number(entry.milestonePercentage || 0),
          phaseName: entry.phaseName || "",
        })),
        releasedPayouts: payoutReleased.map((entry, index) => ({
          _id: entry._id || `${project._id}-released-${index}`,
          amount: Number(entry.amount || 0),
          releaseDate: entry.releaseDate || null,
          milestonePercentage: Number(entry.milestonePercentage || 0),
          phaseName: entry.phaseName || "",
        })),
        milestonePayments,
        stripeSessionId: project.paymentDetails?.stripeSessionId || "",
        stripePaymentIntentId:
          project.paymentDetails?.stripePaymentIntentId || "",
      },
      updates: projectUpdates,
      conversation,
      media: {
        siteFiles,
        completionImages,
      },
      customerReview: project.customerReview || {
        rating: null,
        reviewText: "",
        reviewDate: null,
      },
      timestamps: {
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching full construction project detail:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const getDesignRequestDetail = async (req, res) => {
  try {
    const request = await DesignRequest.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("workerId", "name email specialization");
    if (!request) {
      return res.status(404).json({ error: "Design request not found" });
    }
    res.json({ request });
  } catch (error) {
    console.error("Error fetching design request:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getDesignRequestFullDetail = async (req, res) => {
  try {
    const request = await DesignRequest.findById(req.params.requestId)
      .populate("customerId", "name email phone")
      .populate("workerId", "name email phone specialization")
      .lean();

    if (!request) {
      return res.status(404).json({ error: "Design request not found" });
    }

    const totalAmount = Number(
      request.paymentDetails?.totalAmount ||
        request.finalAmount ||
        request.proposal?.price ||
        0,
    );
    const platformCommission = Number(
      request.paymentDetails?.platformCommission || 0,
    );
    const commissionRate =
      totalAmount > 0 && platformCommission > 0
        ? Number(((platformCommission / totalAmount) * 100).toFixed(2))
        : 0;

    const milestones = Array.isArray(request.milestones)
      ? request.milestones.map((milestone, index) => ({
          _id: milestone._id || `${request._id}-milestone-${index}`,
          percentage: Number(milestone.percentage || 0),
          description: milestone.description || "",
          status: milestone.status || "Pending",
          image: milestone.image || "",
          submittedAt: milestone.submittedAt || null,
          approvedAt: milestone.approvedAt || null,
          rejectedAt: milestone.rejectedAt || null,
          rejectionReason: milestone.rejectionReason || "",
          revisionRequestedAt: milestone.revisionRequestedAt || null,
          revisionNotes: milestone.revisionNotes || "",
          adminReport: milestone.adminReport || "",
          adminReviewNotes: milestone.adminReviewNotes || "",
        }))
      : [];

    const projectUpdates = Array.isArray(request.projectUpdates)
      ? request.projectUpdates
          .map((update, index) => ({
            _id: update._id || `${request._id}-update-${index}`,
            updateText: update.updateText || "",
            updateImage: update.updateImage || "",
            createdAt: update.createdAt || null,
          }))
          .sort(
            (left, right) =>
              new Date(right.createdAt) - new Date(left.createdAt),
          )
      : [];

    const referenceImageList = Array.isArray(request.inspirationImages)
      ? request.inspirationImages.filter(Boolean)
      : [];

    const references = referenceImageList.map((image, index) => ({
      originalName: `Reference ${index + 1}`,
      url: image,
    }));

    const milestonePayments = Array.isArray(
      request.paymentDetails?.milestonePayments,
    )
      ? request.paymentDetails.milestonePayments.map((payment, index) => ({
          _id: payment._id || `${request._id}-payment-${index}`,
          percentage: Number(payment.percentage || 0),
          amount: Number(payment.amount || 0),
          platformFee: Number(payment.platformFee || 0),
          workerPayout: Number(payment.workerPayout || 0),
          paymentCollected: Boolean(payment.paymentCollected),
          status: payment.status || "pending",
          paymentCollectedAt: payment.paymentCollectedAt || null,
          releasedAt: payment.releasedAt || null,
          withdrawnAt: payment.withdrawnAt || null,
        }))
      : [];

    const paymentInitiatedAt =
      request.paymentDetails?.paymentInitiatedAt || null;
    const lastPaymentCollectedAt =
      milestonePayments
        .map((item) => item.paymentCollectedAt)
        .filter(Boolean)
        .sort((left, right) => new Date(right) - new Date(left))[0] || null;

    res.json({
      request,
      summary: {
        projectName: request.projectName || "Interior Design Request",
        status: request.status || "Pending",
        customerName: request.customerId?.name || request.fullName || "Unknown",
        customerId: request.customerId?._id || null,
        architectName: request.workerId?.name || "Not Assigned",
        architectId: request.workerId?._id || null,
        finalAmount: totalAmount,
        platformCommission,
        commissionRate,
      },
      proposal: {
        price: Number(request.proposal?.price || 0),
        description: request.proposal?.description || "",
        sentAt: request.proposal?.sentAt || null,
        phases: [],
      },
      milestones,
      paymentSummary: {
        totalAmount,
        platformCommission,
        workerAmount: Number(request.paymentDetails?.workerAmount || 0),
        escrowStatus: request.paymentDetails?.escrowStatus || "not_initiated",
        milestonePayments,
        stripeSessionId: request.paymentDetails?.stripeSessionId || "",
        stripePaymentIntentId:
          request.paymentDetails?.stripePaymentIntentId || "",
        paymentInitiatedAt,
        lastPaymentCollectedAt,
      },
      projectUpdates,
      review: request.review || {
        customerToWorker: null,
        workerToCustomer: null,
        isReviewCompleted: false,
      },
      references,
      timestamps: {
        createdAt: request.createdAt || null,
        updatedAt: request.updatedAt || request.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching full design request detail:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getBidDetail = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("companyBids.companyId", "companyName email");
    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }
    // routed file : admin/bid-detail
    res.json({ bid });
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getJobApplicationDetail = async (req, res) => {
  try {
    const application = await WorkerToCompany.findById(req.params.id)
      .populate("workerId", "name email phone specialization")
      .populate("companyId", "companyName contactPerson email");
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }
    // routed file : admin/job-application-detail
    res.json({ application });
  } catch (error) {
    console.error("Error fetching job application:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getAdminRevenue = async (req, res) => {
  try {
    // Fetch all construction projects with company and customer details
    const constructionProjects = await ConstructionProjectSchema.find({})
      .populate("customerId", "name email phone")
      .populate("companyId", "companyName email contactPerson")
      .sort({ createdAt: -1 });

    // Fetch architect hirings
    const architectHirings = await ArchitectHiring.find({})
      .populate("customer", "name email phone")
      .populate("worker", "name email specialization")
      .sort({ createdAt: -1 });

    // Fetch design requests
    const designRequests = await DesignRequest.find({})
      .populate("customerId", "name email phone")
      .populate("workerId", "name email specialization")
      .sort({ createdAt: -1 });

    console.log(
      `📊 Admin Revenue: Found ${constructionProjects.length} construction, ${architectHirings.length} architect, ${designRequests.length} design projects`,
    );

    // Initialize totals
    let totalPlatformRevenue = 0;
    let totalReceivedRevenue = 0;
    let totalPendingRevenue = 0;

    // Construction Projects Revenue
    let constructionRevenue = {
      totalProjects: constructionProjects.length,
      platformRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    // Phase analytics
    const phaseAnalytics = {
      phase1: { total: 0, received: 0, pending: 0 },
      phase2: { total: 0, received: 0, pending: 0 },
      phase3: { total: 0, received: 0, pending: 0 },
      phase4: { total: 0, received: 0, pending: 0 },
      final: { total: 0, received: 0, pending: 0 },
    };

    const constructionProjectsWithDetails = constructionProjects.map(
      (project) => {
        const totalBudget =
          project.paymentDetails?.totalAmount || project.proposal?.price || 0;
        const phaseAmount = totalBudget * 0.25; // 25% per phase
        const finalPhaseAmount = totalBudget * 0.1; // 10% final phase

        let projectReceived = 0;
        let projectPending = 0;
        const phaseBreakdown = [];

        for (let i = 1; i <= 4; i++) {
          const milestone = project.milestones?.find(
            (m) => m.percentage === i * 25,
          );

          const upfrontAmount = phaseAmount * 0.4;
          const upfrontStatus =
            milestone?.payments?.upfront?.status || "pending";
          const upfrontReceived =
            upfrontStatus === "released" || upfrontStatus === "paid"
              ? milestone?.payments?.upfront?.amount || upfrontAmount
              : 0;
          const upfrontPending = upfrontAmount - upfrontReceived;

          const completionAmount = phaseAmount * 0.6;
          const completionStatus =
            milestone?.payments?.completion?.status || "pending";
          const completionReceived =
            completionStatus === "released" || completionStatus === "paid"
              ? milestone?.payments?.completion?.amount || completionAmount
              : 0;
          const completionPending = completionAmount - completionReceived;

          const phaseReceived = upfrontReceived + completionReceived;
          const phasePending = upfrontPending + completionPending;

          projectReceived += phaseReceived;
          projectPending += phasePending;

          phaseAnalytics[`phase${i}`].total += phaseAmount;
          phaseAnalytics[`phase${i}`].received += phaseReceived;
          phaseAnalytics[`phase${i}`].pending += phasePending;

          phaseBreakdown.push({
            phase: i,
            totalAmount: phaseAmount,
            upfront: {
              amount: upfrontAmount,
              status: upfrontStatus,
              received: upfrontReceived,
            },
            completion: {
              amount: completionAmount,
              status: completionStatus,
              received: completionReceived,
            },
            totalReceived: phaseReceived,
            totalPending: phasePending,
          });
        }

        const finalMilestone = project.milestones?.find(
          (m) => m.percentage === 100,
        );
        const finalStatus =
          finalMilestone?.payments?.final?.status || "pending";
        const finalReceived =
          finalStatus === "released" || finalStatus === "paid"
            ? finalMilestone?.payments?.final?.amount || finalPhaseAmount
            : 0;
        const finalPending = finalPhaseAmount - finalReceived;

        projectReceived += finalReceived;
        projectPending += finalPending;

        phaseAnalytics.final.total += finalPhaseAmount;
        phaseAnalytics.final.received += finalReceived;
        phaseAnalytics.final.pending += finalPending;

        phaseBreakdown.push({
          phase: 5,
          isFinal: true,
          totalAmount: finalPhaseAmount,
          final: {
            amount: finalPhaseAmount,
            status: finalStatus,
            received: finalReceived,
          },
          totalReceived: finalReceived,
          totalPending: finalPending,
        });

        const projectTotal = totalBudget * 1.1;

        totalPlatformRevenue += projectTotal;
        totalReceivedRevenue += projectReceived;
        totalPendingRevenue += projectPending;

        constructionRevenue.platformRevenue += projectTotal;
        constructionRevenue.receivedRevenue += projectReceived;
        constructionRevenue.pendingRevenue += projectPending;

        return {
          _id: project._id,
          projectType: "construction",
          projectName: project.projectName,
          status: project.status,
          completionPercentage: project.completionPercentage || 0,
          customer: {
            _id: project.customerId?._id,
            name: project.customerId?.name || project.customerName || "Unknown",
            email: project.customerId?.email || project.customerEmail || "",
            phone: project.customerId?.phone || project.customerPhone || "",
          },
          company: {
            _id: project.companyId?._id,
            name: project.companyId?.companyName || "Unknown Company",
            email: project.companyId?.email || "",
            contactPerson: project.companyId?.contactPerson || "",
          },
          totalAmount: projectTotal,
          receivedAmount: projectReceived,
          pendingAmount: projectPending,
          phaseBreakdown,
          createdAt: project.createdAt,
        };
      },
    );

    constructionRevenue.activeProjects = constructionProjects.filter(
      (p) => p.status === "accepted" || p.status === "ongoing",
    ).length;
    constructionRevenue.completedProjects = constructionProjects.filter(
      (p) => p.status === "completed",
    ).length;

    // Process Architect Hirings
    let architectHiringRevenue = {
      totalProjects: architectHirings.length,
      platformRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    const architectHiringsWithDetails = architectHirings.map((hiring) => {
      const totalAmount = hiring.paymentDetails?.totalAmount || 0;
      const platformCommission = hiring.paymentDetails?.platformCommission || 0;
      const workerAmount = hiring.paymentDetails?.workerAmount || 0;
      const escrowStatus =
        hiring.paymentDetails?.escrowStatus || "not_initiated";

      // Calculate received and pending amounts based on milestone payments
      let receivedAmount = 0;
      let pendingAmount = 0;

      if (hiring.paymentDetails?.milestonePayments) {
        hiring.paymentDetails.milestonePayments.forEach((milestone) => {
          if (milestone.paymentCollected) {
            receivedAmount += milestone.platformFee || 0;
          } else {
            pendingAmount += milestone.platformFee || 0;
          }
        });
      }

      if (totalAmount > 0) {
        totalPlatformRevenue += platformCommission;
        totalReceivedRevenue += receivedAmount;
        totalPendingRevenue += pendingAmount;

        architectHiringRevenue.platformRevenue += platformCommission;
        architectHiringRevenue.receivedRevenue += receivedAmount;
        architectHiringRevenue.pendingRevenue += pendingAmount;
      }

      if (hiring.status === "accepted" || hiring.status === "In-Progress") {
        architectHiringRevenue.activeProjects++;
      } else if (hiring.status === "Completed") {
        architectHiringRevenue.completedProjects++;
      }

      return {
        _id: hiring._id,
        projectType: "architect",
        projectName: hiring.projectName || "Architecture Project",
        status: hiring.status,
        customer: {
          _id: hiring.customer?._id,
          name:
            hiring.customer?.name ||
            hiring.customerDetails?.fullName ||
            "Unknown",
          email: hiring.customer?.email || hiring.customerDetails?.email || "",
          phone:
            hiring.customer?.phone ||
            hiring.customerDetails?.contactNumber ||
            "",
        },
        worker: {
          _id: hiring.worker?._id,
          name: hiring.worker?.name || "Not Assigned",
          email: hiring.worker?.email || "",
          specialization: hiring.worker?.specialization || "",
        },
        totalAmount: totalAmount,
        platformCommission: platformCommission,
        workerAmount: workerAmount,
        receivedAmount: receivedAmount,
        pendingAmount: pendingAmount,
        escrowStatus: escrowStatus,
        createdAt: hiring.createdAt,
      };
    });

    // Process Design Requests
    let designRequestRevenue = {
      totalProjects: designRequests.length,
      platformRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      activeProjects: 0,
      completedProjects: 0,
    };

    const designRequestsWithDetails = designRequests.map((request) => {
      const totalAmount = request.paymentDetails?.totalAmount || 0;
      const platformCommission =
        request.paymentDetails?.platformCommission || 0;
      const workerAmount = request.paymentDetails?.workerAmount || 0;
      const escrowStatus =
        request.paymentDetails?.escrowStatus || "not_initiated";

      // Calculate received and pending amounts based on milestone payments
      let receivedAmount = 0;
      let pendingAmount = 0;

      if (request.paymentDetails?.milestonePayments) {
        request.paymentDetails.milestonePayments.forEach((milestone) => {
          if (milestone.paymentCollected) {
            receivedAmount += milestone.platformFee || 0;
          } else {
            pendingAmount += milestone.platformFee || 0;
          }
        });
      }

      if (totalAmount > 0) {
        totalPlatformRevenue += platformCommission;
        totalReceivedRevenue += receivedAmount;
        totalPendingRevenue += pendingAmount;

        designRequestRevenue.platformRevenue += platformCommission;
        designRequestRevenue.receivedRevenue += receivedAmount;
        designRequestRevenue.pendingRevenue += pendingAmount;
      }

      if (request.status === "accepted" || request.status === "In-Progress") {
        designRequestRevenue.activeProjects++;
      } else if (request.status === "Completed") {
        designRequestRevenue.completedProjects++;
      }

      return {
        _id: request._id,
        projectType: "interior",
        projectName: request.projectName || `${request.roomType} Design`,
        status: request.status,
        customer: {
          _id: request.customerId?._id,
          name: request.customerId?.name || request.fullName || "Unknown",
          email: request.customerId?.email || request.email || "",
          phone: request.customerId?.phone || request.phone || "",
        },
        worker: {
          _id: request.workerId?._id,
          name: request.workerId?.name || "Not Assigned",
          email: request.workerId?.email || "",
          specialization: request.workerId?.specialization || "",
        },
        totalAmount: totalAmount,
        platformCommission: platformCommission,
        workerAmount: workerAmount,
        receivedAmount: receivedAmount,
        pendingAmount: pendingAmount,
        escrowStatus: escrowStatus,
        roomType: request.roomType,
        createdAt: request.createdAt,
      };
    });

    // Combine all projects
    const allProjects = [
      ...constructionProjectsWithDetails,
      ...architectHiringsWithDetails,
      ...designRequestsWithDetails,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const activeProjectsCount =
      constructionRevenue.activeProjects +
      architectHiringRevenue.activeProjects +
      designRequestRevenue.activeProjects;
    const completedProjectsCount =
      constructionRevenue.completedProjects +
      architectHiringRevenue.completedProjects +
      designRequestRevenue.completedProjects;
    const collectionRate =
      totalPlatformRevenue > 0
        ? ((totalReceivedRevenue / totalPlatformRevenue) * 100).toFixed(2)
        : 0;

    console.log(`💰 Admin Revenue Summary:`);
    console.log(
      `   Total Revenue: ₹${totalPlatformRevenue.toLocaleString("en-IN")}`,
    );
    console.log(
      `   Received: ₹${totalReceivedRevenue.toLocaleString("en-IN")}`,
    );
    console.log(`   Pending: ₹${totalPendingRevenue.toLocaleString("en-IN")}`);
    console.log(`   Collection Rate: ${collectionRate}%`);
    console.log(
      `   Active Projects: ${activeProjectsCount}, Completed: ${completedProjectsCount}`,
    );
    console.log(
      `   Construction: ${constructionRevenue.platformRevenue.toLocaleString("en-IN")}`,
    );
    console.log(
      `   Architect: ${architectHiringRevenue.platformRevenue.toLocaleString("en-IN")}`,
    );
    console.log(
      `   Interior: ${designRequestRevenue.platformRevenue.toLocaleString("en-IN")}`,
    );

    res.json({
      success: true,
      metrics: {
        totalRevenue: totalPlatformRevenue,
        receivedRevenue: totalReceivedRevenue,
        pendingRevenue: totalPendingRevenue,
        collectionRate: parseFloat(collectionRate),
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        totalProjects: allProjects.length,
      },
      revenueByType: {
        construction: constructionRevenue,
        architect: architectHiringRevenue,
        interior: designRequestRevenue,
      },
      phaseAnalytics,
      projects: allProjects,
      constructionProjects: constructionProjectsWithDetails,
      architectHirings: architectHiringsWithDetails,
      designRequests: designRequestsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching admin revenue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  deleteCustomer,
  deleteCompany,
  deleteWorker,
  deleteArchitectHiring,
  deleteConstructionProject,
  deleteDesignRequest,
  deleteBid,
  deleteJobApplication,
  getCustomerDetail,
  getCustomerFullDetail,
  getCompanyDetail,
  getCompanyFullDetail,
  getWorkerDetail,
  getWorkerFullDetail,
  getArchitectHiringDetail,
  getArchitectHiringFullDetail,
  getConstructionProjectDetail,
  getConstructionProjectFullDetail,
  getDesignRequestDetail,
  getDesignRequestFullDetail,
  getBidDetail,
  getJobApplicationDetail,
  verifyCompany,
  rejectCompany,
  verifyWorker,
  rejectWorker,
  getAdminRevenue,
};
