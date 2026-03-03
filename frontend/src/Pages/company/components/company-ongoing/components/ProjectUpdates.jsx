// src/pages/company/components/company-ongoing/components/ProjectUpdates.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const getPhaseForMilestone = (project, milestonePercentage) => {
  const phases = project?.proposal?.phases;
  if (!Array.isArray(phases) || phases.length === 0) return null;
  const index = Math.min(
    Math.max(Math.floor(milestonePercentage / 25) - 1, 0),
    phases.length - 1
  );
  return phases[index] || null;
};

const ProjectUpdates = ({ project, expandedUpdates }) => {
  const navigate = useNavigate();

  if (!expandedUpdates[project._id]) return null;

  return (
    <div className="ongoing-project-updates ongoing-active">
      <h3>Project Progress & Updates</h3>
      
      {/* Milestone Progress Section (only checkpoints: 25/50/75/100) */}
      {project.milestones && project.milestones.length > 0 && (
        <>
          <h4 className="ongoing-updates-subtitle">Milestone Updates</h4>
          <div className="ongoing-milestones-list">
            {project.milestones
              .sort((a, b) => a.percentage - b.percentage)
              .filter((m) => m.isCheckpoint)
              .map((milestone, idx) => (
                <div 
                  key={idx} 
                  className={`ongoing-milestone-item ${
                    milestone.isApprovedByCustomer ? 'milestone-approved' : 
                    milestone.needsRevision ? 'milestone-revision' : 
                    'milestone-pending'
                  }`}
                >
                  <div className="ongoing-milestone-header">
                    <div>
                      <h4 className="ongoing-milestone-title">
                        {getPhaseForMilestone(project, milestone.percentage)?.name || `${milestone.percentage}% Milestone`}
                        <span className="milestone-status-label">
                          {` (${milestone.percentage}%)`}
                        </span>
                        {milestone.isApprovedByCustomer ? (
                          <span className="milestone-status milestone-status-approved">
                            ✓ Approved by Customer
                          </span>
                        ) : milestone.needsRevision ? (
                          <span className="milestone-status milestone-status-revision">
                            ⚠ Revision Requested - Update Required
                          </span>
                        ) : (
                          <span className="milestone-status milestone-status-pending">
                            ⏳ Awaiting Customer Approval
                          </span>
                        )}
                      </h4>
                      <div className="ongoing-milestone-dates">
                        Submitted: {new Date(milestone.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {milestone.approvedAt && (
                          <span className="milestone-approved-date">
                            Approved: {new Date(milestone.approvedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ongoing-milestone-message">
                    <strong>Latest Company Message:</strong>
                    <p>{milestone.companyMessage}</p>
                  </div>

                  {(() => {
                    const phase = getPhaseForMilestone(project, milestone.percentage);
                    if (!phase) return null;
                    const isFinal = phase.isFinal === true;
                    return (
                      <div className="ongoing-milestone-message">
                        <strong>Company Proposed Details:</strong>
                        <p><strong>Phase:</strong> {isFinal ? "🎯 " : ""}{phase.name || "Phase"}</p>
                        {!isFinal && <p><strong>Required Months:</strong> {phase.requiredMonths || "N/A"}</p>}
                        <p><strong>Phase Amount:</strong> <span style={{ color: "#d32f2f", fontWeight: "bold" }}>₹{phase.amount ? Number(phase.amount).toLocaleString('en-IN') : "0"}</span></p>
                        
                        {/* Payment Schedule */}
                        <div style={{ backgroundColor: isFinal ? "#fff3e0" : "#f0f4ff", padding: "10px", borderRadius: "4px", marginTop: "10px", marginBottom: "10px" }}>
                          <p style={{ fontSize: "12px", fontWeight: "bold", color: isFinal ? "#e65100" : "#1a73e8", margin: "0 0 8px 0" }}>
                            💰 Payment Schedule for this Phase:
                          </p>
                          {isFinal ? (
                            <p style={{ fontSize: "12px", color: "#666", margin: "0" }}>
                              🎯 Paid at Completion: <strong>₹{phase.amount ? Number(phase.amount).toLocaleString('en-IN') : "0"}</strong> (10% of work total)
                            </p>
                          ) : (
                            <>
                              <p style={{ fontSize: "12px", color: "#666", margin: "0 0 5px 0" }}>
                                📌 Upfront: <strong>₹{phase.amount ? Math.round(Number(phase.amount) * 0.10).toLocaleString('en-IN') : "0"}</strong> (10%)
                              </p>
                              <p style={{ fontSize: "12px", color: "#666", margin: "0" }}>
                                ✅ Completion: <strong>₹{phase.amount ? Math.round(Number(phase.amount) * 0.90).toLocaleString('en-IN') : "0"}</strong> (90%)
                              </p>
                            </>
                          )}
                        </div>

                        {/* Work Items */}
                        {phase.subdivisions && phase.subdivisions.length > 0 && (
                          <div className="ongoing-conversation-messages">
                            <p style={{ fontSize: "12px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>Work Items Breakdown:</p>
                            {phase.subdivisions.map((sub, sIdx) => (
                              <div key={sIdx} className="ongoing-conversation-msg msg-company">
                                <div className="msg-header">
                                  <strong className="msg-sender">🧱 {sub.category || "Work Item"}</strong>
                                </div>
                                <p className="msg-content">
                                  {sub.description || ""}
                                  {sub.amount ? ` - ₹${Number(sub.amount).toLocaleString('en-IN')}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Conversation History */}
                  {milestone.conversation && milestone.conversation.length > 0 && (
                    <div className="ongoing-conversation-history">
                      <strong className="conversation-title">
                        💬 Conversation History ({milestone.conversation.length} {milestone.conversation.length === 1 ? 'message' : 'messages'})
                      </strong>
                      <div className="ongoing-conversation-messages">
                        {milestone.conversation.map((msg, msgIdx) => (
                          <div 
                            key={msgIdx} 
                            className={`ongoing-conversation-msg ${msg.sender === 'company' ? 'msg-company' : 'msg-customer'}`}
                          >
                            <div className="msg-header">
                              <strong className="msg-sender">
                                {msg.sender === 'company' ? '🏢 Company' : '👤 Customer'}
                              </strong>
                              <span className="msg-timestamp">
                                {new Date(msg.timestamp).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="msg-content">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {milestone.needsRevision && milestone.customerFeedback && (
                    <div className="ongoing-customer-feedback">
                      <strong>⚠ Action Required - Customer Feedback:</strong>
                      <p>{milestone.customerFeedback}</p>
                      <button
                        className="ongoing-edit-btn"
                        onClick={() => navigate(`../addnewproject?projectId=${project._id}&updateCheckpoint=${milestone.percentage}`)}
                      >
                        📝 Respond & Update
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
      
      {/* Completion Images & Customer Review Section */}
      {project.completionPercentage === 100 && (
        <>
          {/* Completion Images */}
          {project.completionImages && project.completionImages.length > 0 && (
            <div className="ongoing-completion-section">
              <h4 className="completion-title">📸 Project Completion Photos</h4>
              <div className="ongoing-completion-images">
                {project.completionImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:3000/${img}`}
                    alt={`Completion ${idx + 1}`}
                    className="completion-image"
                    onClick={() => window.open(`http://localhost:3000/${img}`, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Customer Review */}
          {project.customerReview?.rating && (
            <div className="ongoing-customer-review">
              <h4 className="review-title">⭐ Customer Review</h4>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={star <= project.customerReview.rating ? 'star-filled' : 'star-empty'}
                  >
                    ★
                  </span>
                ))}
                <span className="review-rating-value">
                  {project.customerReview.rating}/5
                </span>
              </div>
              {project.customerReview.reviewText && (
                <div className="review-text-container">
                  <p className="review-text">
                    "{project.customerReview.reviewText}"
                  </p>
                </div>
              )}
              <p className="review-date">
                <strong>Reviewed on:</strong> {new Date(project.customerReview.reviewDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
          )}
        </>
      )}
      
      <h4 className="ongoing-updates-subtitle">Recent Activity</h4>
      {project.recentUpdates && project.recentUpdates.length > 0 ? (
        project.recentUpdates.map((update, idx) => (
          <div key={idx} className="ongoing-update-item">
            <div className="ongoing-Updates-left-section">
              {update.updateImagePath && (
                <img src={update.updateImagePath} alt="Update" />
              )}
              <div className="ongoing-update-meta-date">
                {new Date(update.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div>
              <h4>Description:</h4>
              <p>{update.updateText}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="ongoing-no-updates">
          <p>No recent updates for this project.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectUpdates;
