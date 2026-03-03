const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/adminController");
const {
  getAdminAnalytics,
} = require("../controllers/adminanalyticsController");

const authadmin = require("../middlewares/authadmin");
const requirePlatformManager = require("../middlewares/requirePlatformManager");

// Admin login route
router.post("/admin/login", authadmin);

// Admin session verification route
router.get("/admin/verify-session", authadmin, (req, res) => {
  res.json({ authenticated: true, role: req.admin?.role || "admin" });
});

// Admin logout route
router.post("/admin/logout", (req, res) => {
  res.clearCookie("admin_token", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

// Routes to verify or reject companies and workers
router.patch(
  "/admin/verify-company/:id",
  authadmin,
  requirePlatformManager,
  verifyCompany,
);
router.patch(
  "/admin/reject-company/:id",
  authadmin,
  requirePlatformManager,
  rejectCompany,
);
router.patch(
  "/admin/verify-worker/:id",
  authadmin,
  requirePlatformManager,
  verifyWorker,
);
router.patch(
  "/admin/reject-worker/:id",
  authadmin,
  requirePlatformManager,
  rejectWorker,
);

// Admin dashboard route (protected)
router.get("/admindashboard", authadmin, getAdminDashboard);
router.get("/admin/analytics", authadmin, getAdminAnalytics);

// Admin revenue analytics route (protected)
router.get("/admin/revenue", authadmin, getAdminRevenue);

// Delete routes
router.delete(
  "/admin/delete-customer/:id",
  authadmin,
  requirePlatformManager,
  deleteCustomer,
);
router.delete(
  "/admin/delete-company/:id",
  authadmin,
  requirePlatformManager,
  deleteCompany,
);
router.delete(
  "/admin/delete-worker/:id",
  authadmin,
  requirePlatformManager,
  deleteWorker,
);
router.delete(
  "/admin/delete-architectHiring/:id",
  authadmin,
  requirePlatformManager,
  deleteArchitectHiring,
);
router.delete(
  "/admin/delete-constructionProject/:id",
  authadmin,
  requirePlatformManager,
  deleteConstructionProject,
);
router.delete(
  "/admin/delete-designRequest/:id",
  authadmin,
  requirePlatformManager,
  deleteDesignRequest,
);
router.delete(
  "/admin/delete-bid/:id",
  authadmin,
  requirePlatformManager,
  deleteBid,
);
router.delete(
  "/admin/delete-jobApplication/:id",
  authadmin,
  requirePlatformManager,
  deleteJobApplication,
);

// Detail view routes
router.get("/admin/customer/:id", authadmin, getCustomerDetail);
router.get(
  "/admin/customers/:customerId/full",
  authadmin,
  getCustomerFullDetail,
);
router.get("/admin/companies/:companyId/full", authadmin, getCompanyFullDetail);
router.get("/admin/workers/:workerId/full", authadmin, getWorkerFullDetail);
router.get("/admin/company/:id", authadmin, getCompanyDetail);
router.get("/admin/worker/:id", authadmin, getWorkerDetail);
router.get(
  "/admin/architect-hirings/:projectId/full",
  authadmin,
  getArchitectHiringFullDetail,
);
router.get("/admin/architect-hiring/:id", authadmin, getArchitectHiringDetail);
router.get(
  "/admin/construction-project/:id",
  authadmin,
  getConstructionProjectDetail,
);
router.get(
  "/admin/construction-projects/:projectId/full",
  authadmin,
  getConstructionProjectFullDetail,
);
router.get(
  "/admin/design-requests/:requestId/full",
  authadmin,
  getDesignRequestFullDetail,
);
router.get("/admin/design-request/:id", authadmin, getDesignRequestDetail);
router.get("/admin/bid/:id", authadmin, getBidDetail);
router.get("/admin/job-application/:id", authadmin, getJobApplicationDetail);

module.exports = router;
