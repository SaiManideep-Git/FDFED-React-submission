import { Routes, Route } from "react-router-dom";

import PlatformManagerDashboard from "./PlatformManagerDashboard";
import PlatformManagerDataManagement from "./PlatformManagerDataManagement";
import PlatformManagerRevenueAnalytics from "./PlatformManagerRevenueAnalytics";
import PlatformManagerBidDetail from "./PlatformManagerBidDetail";
import PlatformManagerCompanyDetail from "./PlatformManagerCompanyDetail";
import PlatformManagerConstructionProjectDetail from "./PlatformManagerConstructionProjectDetail";
import PlatformManagerCustomerDetail from "./PlatformManagerCustomerDetail";
import PlatformManagerDesignRequestDetail from "./PlatformManagerDesignRequestDetail";
import PlatformManagerJobApplicationDetail from "./PlatformManagerJobApplicationDetail";
import PlatformManagerWorkerDetail from "./PlatformManagerWorkerDetail";
import PlatformManagerArchitectHiringDetail from "./PlatformManagerArchitectHiringDetail";

const PlatformManager = () => {
  return (
    <Routes>
      <Route index element={<PlatformManagerDashboard />} />
      <Route path="admindashboard" element={<PlatformManagerDashboard />} />
      <Route
        path="data-management"
        element={<PlatformManagerDataManagement />}
      />
      <Route
        path="revenue-analytics"
        element={<PlatformManagerRevenueAnalytics />}
      />
      <Route path="bid/:id" element={<PlatformManagerBidDetail />} />
      <Route path="company/:id" element={<PlatformManagerCompanyDetail />} />
      <Route
        path="construction-project/:id"
        element={<PlatformManagerConstructionProjectDetail />}
      />
      <Route path="customer/:id" element={<PlatformManagerCustomerDetail />} />
      <Route
        path="design-request/:id"
        element={<PlatformManagerDesignRequestDetail />}
      />
      <Route
        path="job-application/:id"
        element={<PlatformManagerJobApplicationDetail />}
      />
      <Route path="worker/:id" element={<PlatformManagerWorkerDetail />} />
      <Route
        path="architect-hiring/:id"
        element={<PlatformManagerArchitectHiringDetail />}
      />
      <Route path="*" element={<div>Platform Manager page not found</div>} />
    </Routes>
  );
};

export default PlatformManager;
