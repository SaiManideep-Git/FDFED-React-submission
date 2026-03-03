// src/pages/company/components/company-project-requests/components/ProposalModal.jsx
import React, { useState } from 'react';

// 5 phases: 4 work phases (25% each) + 1 final touching (10%)
// Total = 110% (100% work + 10% final finishes)
const WORK_PHASES_COUNT = 4;
const WORK_PHASE_PERCENTAGE = 25;
const FINAL_PHASE_PERCENTAGE = 10;
const TOTAL_PERCENTAGE = 110; // 100% + 10% final

const ProposalModal = ({ 
  isOpen, 
  onClose, 
  project,
  proposalData,
  proposalErrors,
  maxBudget,
  onProposalChange,
  onSubmitProposal
}) => {
  const [phases, setPhases] = useState([
    {
      id: 1,
      name: 'Phase 1',
      percentage: WORK_PHASE_PERCENTAGE,
      requiredMonths: '',
      amount: '', // Editable
      isFixed: true,
      isFinal: false,
      subdivisions: [{ id: 1, category: '', description: '', amount: '' }]
    },
    {
      id: 2,
      name: 'Phase 2',
      percentage: WORK_PHASE_PERCENTAGE,
      requiredMonths: '',
      amount: '', // Editable
      isFixed: true,
      isFinal: false,
      subdivisions: [{ id: 1, category: '', description: '', amount: '' }]
    },
    {
      id: 3,
      name: 'Phase 3',
      percentage: WORK_PHASE_PERCENTAGE,
      requiredMonths: '',
      amount: '', // Editable
      isFixed: true,
      isFinal: false,
      subdivisions: [{ id: 1, category: '', description: '', amount: '' }]
    },
    {
      id: 4,
      name: 'Phase 4',
      percentage: WORK_PHASE_PERCENTAGE,
      requiredMonths: '',
      amount: '', // Editable
      isFixed: true,
      isFinal: false,
      subdivisions: [{ id: 1, category: '', description: '', amount: '' }]
    },
    {
      id: 5,
      name: 'Final Touching',
      percentage: FINAL_PHASE_PERCENTAGE,
      requiredMonths: '0.5',
      amount: '', // Editable
      isFixed: true,
      isFinal: true,
      subdivisions: [{ id: 1, category: 'Final Touches', description: '', amount: '' }]
    }
  ]);
  const [phaseErrors, setPhaseErrors] = useState({});

  const handlePhaseChange = (id, field, value) => {
    setPhases(phases.map(phase => 
      phase.id === id ? { ...phase, [field]: value } : phase
    ));
  };

  // Handle subdivision changes
  const handleSubdivisionChange = (phaseId, subId, field, value) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          subdivisions: phase.subdivisions.map(sub =>
            sub.id === subId ? { ...sub, [field]: value } : sub
          )
        };
      }
      return phase;
    }));
  };

  // Add subdivision to a phase
  const addSubdivision = (phaseId) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        const newSubId = Math.max(...phase.subdivisions.map(s => s.id), 0) + 1;
        return {
          ...phase,
          subdivisions: [
            ...phase.subdivisions,
            { id: newSubId, category: '', description: '', amount: '' }
          ]
        };
      }
      return phase;
    }));
  };

  // Remove subdivision from a phase
  const removeSubdivision = (phaseId, subId) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId && phase.subdivisions.length > 1) {
        return {
          ...phase,
          subdivisions: phase.subdivisions.filter(sub => sub.id !== subId)
        };
      }
      return phase;
    }));
  };

  const getTotalPercentage = () => {
    return phases.reduce((sum, phase) => sum + (parseFloat(phase.percentage) || 0), 0);
  };

  const getTotalAmount = () => {
    // Total = work phases only (final phase is part of this, not additional)
    return getWorkPhasesTotalAmount();
  };

  const getWorkPhasesTotalAmount = () => {
    return phases.slice(0, 4).reduce((sum, phase) => sum + (parseFloat(getPhaseAmount(phase)) || 0), 0);
  };

  const getFinalPhaseAmount = () => {
    const workTotal = getWorkPhasesTotalAmount();
    return workTotal > 0 ? (workTotal * 0.10) : 0;
  };

  // Calculate phase amount from subdivisions if they have amounts
  const getPhaseAmount = (phase) => {
    const subdivisionTotal = phase.subdivisions.reduce((sum, sub) => {
      return sum + (parseFloat(sub.amount) || 0);
    }, 0);
    // If subdivisions have amounts, use their total; otherwise use the phase amount
    return subdivisionTotal > 0 ? subdivisionTotal : (parseFloat(phase.amount) || 0);
  };

  const validatePhases = () => {
    const errors = {};
    const totalPercentage = getTotalPercentage();

    if (phases.length !== 5) {
      errors.phaseCount = 'Exactly 5 phases are required.';
    }

    phases.forEach((phase, index) => {
      if (!phase.name.trim()) {
        errors[`phase_${phase.id}_name`] = 'Phase name is required';
      }

      // Validate percentage
      if (phase.isFinal) {
        if (parseFloat(phase.percentage) !== FINAL_PHASE_PERCENTAGE) {
          errors[`phase_${phase.id}_percentage`] = `Final phase must be ${FINAL_PHASE_PERCENTAGE}%`;
        }
      } else {
        if (parseFloat(phase.percentage) !== WORK_PHASE_PERCENTAGE) {
          errors[`phase_${phase.id}_percentage`] = `Work phase must be ${WORK_PHASE_PERCENTAGE}%`;
        }
      }

      // Validate required months for work phases
      if (!phase.isFinal && (!phase.requiredMonths || parseFloat(phase.requiredMonths) <= 0)) {
        errors[`phase_${phase.id}_months`] = 'Required months must be greater than 0';
      }

      // Validate amount (can be 0 for final phase, but work phases need amount)
      const phaseAmount = phase.isFinal ? getFinalPhaseAmount() : getPhaseAmount(phase);
      if (!phase.isFinal && phaseAmount <= 0) {
        errors[`phase_${phase.id}_amount`] = 'Please add work items with amounts for this phase';
      }

      // If amount is direct (not subdivisions), validate it
      if (phaseAmount > 0) {
        // Amount is set directly or calculated from subdivisions, that's valid
      } else if (phase.subdivisions && phase.subdivisions.length > 0) {
        // Otherwise validate subdivisions
        phase.subdivisions.forEach(sub => {
          if (!sub.category) {
            errors[`phase_${phase.id}_sub_${sub.id}_category`] = 'Work category is required';
          }
          if (parseFloat(sub.amount) < 0) {
            errors[`phase_${phase.id}_sub_${sub.id}_amount`] = 'Amount must be 0 or greater';
          }
        });
      }
    });

    if (totalPercentage !== TOTAL_PERCENTAGE) {
      errors.totalPercentage = `Total percentage must equal ${TOTAL_PERCENTAGE}% (currently ${totalPercentage}%)`;
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validatePhases();
    
    if (Object.keys(errors).length > 0) {
      setPhaseErrors(errors);
      return;
    }

    setPhaseErrors({});
    
    // Prepare data with phases
    const phasesData = phases.map(phase => ({
      name: phase.name,
      percentage: phase.percentage,
      requiredMonths: phase.requiredMonths,
      amount: phase.isFinal ? getFinalPhaseAmount() : getPhaseAmount(phase),
      subdivisions: phase.subdivisions,
      isFinal: phase.isFinal,
      paymentSchedule: {
        upfrontPercentage: phase.isFinal ? 0 : 40,
        completionPercentage: phase.isFinal ? 0 : 60,
        finalPercentage: phase.isFinal ? 10 : 0
      }
    }));

    const proposalWithPhases = {
      ...proposalData,
      phases: phasesData,
      totalAmount: getTotalAmount()
    };

    onSubmitProposal(proposalWithPhases);
  };

  if (!isOpen || !project) return null;

  const totalPercentage = getTotalPercentage();
  const totalAmount = getTotalAmount();

  return (
    <div className="requests-proposal-modal requests-proposal-modal-active" onClick={onClose}>
      <div
        className="requests-proposal-modal-content requests-proposal-modal-phases"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="requests-proposal-modal-header">
          <h3>Create Proposal - Project Phases</h3>
          <button className="requests-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="requests-proposal-modal-body">
          <form onSubmit={handleSubmit}>
            {/* Phases Section */}
            <div className="requests-phases-container">
              <div className="requests-phases-header-info">
                <h4 className="requests-phases-title">Construction Phases (5 Phases Total)</h4>
                <span className="requests-phases-limit">
                  4 work phases (25% each) + 1 final phase (10% auto-calculated)
                </span>
              </div>
              
              {phaseErrors.totalPercentage && (
                <div className="requests-error-message requests-error-message-block">
                  {phaseErrors.totalPercentage}
                </div>
              )}

              <div className="requests-phases-list">
                {phases.map((phase, index) => (
                  <div key={phase.id} className={`requests-phase-card ${phase.isFinal ? 'requests-phase-final' : 'requests-phase-work'}`}>
                    <div className="requests-phase-header">
                      <h5>
                        {phase.isFinal ? '🎯 Final Phase: ' : `Phase ${index + 1}: `}
                        {phase.name}
                      </h5>
                      {phase.isFinal && (
                        <span className="requests-phase-badge">Final Touching - 10% (Paid at completion)</span>
                      )}
                    </div>

                    <div className="requests-phase-form">
                      <div className="requests-phase-form-row">
                        <div className="requests-phase-form-group">
                          <label>Phase Name</label>
                          <input
                            type="text"
                            value={phase.name}
                            onChange={(e) => handlePhaseChange(phase.id, 'name', e.target.value)}
                            className={`requests-proposal-form-control ${
                              phaseErrors[`phase_${phase.id}_name`] ? 'requests-input-error' : ''
                            }`}
                            placeholder="e.g., Foundation Work"
                            disabled={phase.isFixed && phase.isFinal}
                          />
                          {phaseErrors[`phase_${phase.id}_name`] && (
                            <div className="requests-error-message">
                              {phaseErrors[`phase_${phase.id}_name`]}
                            </div>
                          )}
                        </div>

                        <div className="requests-phase-form-group">
                          <label>Work Percentage {phase.isFinal ? '(Fixed: 10%)' : '(Fixed: 25%)'}</label>
                          <input
                            type="number"
                            value={phase.percentage}
                            onChange={(e) => handlePhaseChange(phase.id, 'percentage', e.target.value)}
                            className={`requests-proposal-form-control ${
                              phaseErrors[`phase_${phase.id}_percentage`] ? 'requests-input-error' : ''
                            } requests-input-readonly`}
                            placeholder="0"
                            readOnly
                            disabled
                          />
                          {phaseErrors[`phase_${phase.id}_percentage`] && (
                            <div className="requests-error-message">
                              {phaseErrors[`phase_${phase.id}_percentage`]}
                            </div>
                          )}
                        </div>

                        {!phase.isFinal && (
                          <div className="requests-phase-form-group">
                            <label>Required Months to Complete</label>
                            <input
                              type="number"
                              min="0.5"
                              max="60"
                              step="0.5"
                              value={phase.requiredMonths}
                              onChange={(e) => handlePhaseChange(phase.id, 'requiredMonths', e.target.value)}
                              className={`requests-proposal-form-control ${
                                phaseErrors[`phase_${phase.id}_months`] ? 'requests-input-error' : ''
                              }`}
                              placeholder="e.g., 2, 3.5"
                            />
                            {phaseErrors[`phase_${phase.id}_months`] && (
                              <div className="requests-error-message">
                                {phaseErrors[`phase_${phase.id}_months`]}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="requests-phase-form-group">
                          <label>{phase.isFinal ? 'Final Phase Amount (Auto-calculated: 10% of work total)' : 'Phase Total Amount (₹) - Auto-calculated from work items'}</label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={phase.isFinal ? getFinalPhaseAmount() : getPhaseAmount(phase)}
                            onChange={(e) => !phase.isFinal && handlePhaseChange(phase.id, 'amount', e.target.value)}
                            className={`requests-proposal-form-control ${
                              phaseErrors[`phase_${phase.id}_amount`] ? 'requests-input-error' : ''
                            } requests-input-readonly`}
                            placeholder="Enter work items below"
                            disabled={true}
                            readOnly
                          />
                          {phase.isFinal && (
                            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                              Auto-calculated based on work phases total
                            </small>
                          )}
                          {phaseErrors[`phase_${phase.id}_amount`] && (
                            <div className="requests-error-message">
                              {phaseErrors[`phase_${phase.id}_amount`]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subdivisions Section - For work phases */}
                      {!phase.isFinal && phase.subdivisions && (
                        <div className="requests-subdivisions-container">
                          <div className="requests-subdivisions-header">
                            <span className="requests-subdivisions-title">Work Items Breakdown (Optional)</span>
                          </div>

                          <div className="requests-subdivisions-list">
                            {phase.subdivisions.map((sub, subIndex) => (
                              <div key={sub.id} className="requests-subdivision-row">
                                <div className="requests-subdivision-fields">
                                  <div className="requests-subdivision-field requests-subdivision-category">
                                    <input
                                      type="text"
                                      value={sub.category}
                                      onChange={(e) => handleSubdivisionChange(phase.id, sub.id, 'category', e.target.value)}
                                      className={`requests-proposal-form-control ${
                                        phaseErrors[`phase_${phase.id}_sub_${sub.id}_category`] ? 'requests-input-error' : ''
                                      }`}
                                      placeholder="e.g., Flooring, Electrical"
                                    />
                                  </div>

                                  <div className="requests-subdivision-field requests-subdivision-desc">
                                    <input
                                      type="text"
                                      value={sub.description}
                                      onChange={(e) => handleSubdivisionChange(phase.id, sub.id, 'description', e.target.value)}
                                      className="requests-proposal-form-control"
                                      placeholder="Details (optional)"
                                    />
                                  </div>

                                  <div className="requests-subdivision-field requests-subdivision-amount">
                                    <input
                                      type="number"
                                      min="0"
                                      step="500"
                                      value={sub.amount}
                                      onChange={(e) => handleSubdivisionChange(phase.id, sub.id, 'amount', e.target.value)}
                                      className={`requests-proposal-form-control ${
                                        phaseErrors[`phase_${phase.id}_sub_${sub.id}_amount`] ? 'requests-input-error' : ''
                                      }`}
                                      placeholder="Amount (₹)"
                                    />
                                  </div>

                                  <div className="requests-subdivision-actions">
                                    {phase.subdivisions.length > 1 && (
                                      <button
                                        type="button"
                                        className="requests-subdivision-remove-btn"
                                        onClick={() => removeSubdivision(phase.id, sub.id)}
                                        title="Remove"
                                      >
                                        <i className="fas fa-minus-circle"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="requests-btn-add-subdivision"
                            onClick={() => addSubdivision(phase.id)}
                          >
                            <i className="fas fa-plus"></i> Add Work Item
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              <div className="requests-phases-summary">
                <div className="requests-summary-item">
                  <span>Total Percentage:</span>
                  <span className={totalPercentage === TOTAL_PERCENTAGE ? 'requests-summary-valid' : 'requests-summary-invalid'}>
                    {totalPercentage}%
                  </span>
                </div>
                <div className="requests-summary-item">
                  <span><strong>Total Project Amount:</strong></span>
                  <span className="requests-summary-amount" style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="requests-summary-item">
                  <span>Final Phase (10% of total):</span>
                  <span className="requests-summary-amount">₹{getFinalPhaseAmount().toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <button type="submit" className="requests-proposal-btn-primary requests-btn-submit-phases">
              Send Proposal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;
