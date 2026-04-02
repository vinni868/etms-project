import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaMoneyBillWave, FaSearch, FaPlus, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import './AdminFees.css';

export default function AdminFees() {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const [formData, setFormData] = useState({
    studentId: '', batchId: '', originalTotalAmount: '', paidAmount: '', paymentMode: 'CASH', notes: '', paymentPlan: 'HALF_AND_PLACEMENT'
  });

  const [payData, setPayData] = useState({ amount: '', paymentMode: 'CASH', notes: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [msg, setMsg] = useState(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fees');
      setFees(res.data.fees || []);
      setStats({
        totalCollected: res.data.totalCollected || 0,
        totalPending: res.data.totalPending || 0
      });
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post('/admin/fees', formData);
      setMsg({ type: 'ok', text: 'Fee record created successfully!' });
      setShowModal(false);
      setFormData({ studentId: '', batchId: '', originalTotalAmount: '', paidAmount: '', paymentMode: 'CASH', notes: '', paymentPlan: 'HALF_AND_PLACEMENT' });
      fetchFees();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to create fee record.' });
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put(`/admin/fees/${selectedFee.id}/pay`, payData);
      setMsg({ type: 'ok', text: 'Payment recorded successfully!' });
      setShowPayModal(false);
      setPayData({ amount: '', paymentMode: 'CASH', notes: '' });
      fetchFees();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to record payment.' });
    }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/admin/fees/${id}/history`);
      setHistoryData(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const calculatePreview = () => {
    const original = parseFloat(formData.originalTotalAmount) || 0;
    if (formData.paymentPlan === 'FULL_UPFRONT') {
      return { total: original * 0.9, info: '10% Discount Applied' };
    }
    if (formData.paymentPlan === 'EMI_PLAN') {
      const upfrontPart = (original / 2) + 1000;
      const emi = Math.ceil(upfrontPart / 3);
      return { total: original + 1000, info: `EMI: ₹${emi}/month for 3 months (Interest: ₹1000)` };
    }
    return { total: original, info: 'Standard Plan' };
  };

  const preview = calculatePreview();

  const filteredData = fees.filter(f => 
    f.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-fees-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-green">
            <FaMoneyBillWave />
          </div>
          <div>
            <h1>Fee Management</h1>
            <p className="page-subtitle">Track payments, manage dues, and generate receipts</p>
          </div>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          <FaPlus /> Custom Fee Record
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon bg-blue"><FaCheck /></div>
          <div className="stat-details">
            <h3>₹{stats.totalCollected.toLocaleString()}</h3>
            <p>Total Collected</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red"><FaExclamationCircle /></div>
          <div className="stat-details">
            <h3>₹{stats.totalPending.toLocaleString()}</h3>
            <p>Total Pending / Due</p>
          </div>
        </div>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by student name, email, or receipt..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading fee records...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student Info</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No fee records found.</td></tr>
                ) : (
                  filteredData.map(f => (
                    <tr key={f.id}>
                      <td className="fw-600 text-blue">{f.receiptNumber}</td>
                      <td>
                        <div className="student-info-cell">
                          <span className="sname">{f.studentName || 'Unknown'}</span>
                          <span className="semail">{f.studentEmail || `ID: ${f.studentId}`}</span>
                        </div>
                      </td>
                      <td className="fw-600">₹{f.totalAmount}</td>
                      <td className="text-green fw-600">₹{f.paidAmount}</td>
                      <td className="text-red fw-600">₹{f.dueAmount}</td>
                      <td>
                        <span className={`status-badge st-${f.status.toLowerCase()}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          {f.status !== 'PAID' && (
                            <button className="action-btn pay-btn" onClick={() => {
                              setSelectedFee(f);
                              setPayData({ amount: f.dueAmount, paymentMode: 'CASH', notes: '' });
                              setShowPayModal(true);
                            }}>
                              Pay
                            </button>
                          )}
                          <button className="action-btn history-btn" onClick={() => {
                            setSelectedFee(f);
                            fetchHistory(f.id);
                          }}>
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE FEE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>➕ Create Fee Record</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>Student ID (System ID)*</label>
                <input required type="text" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} placeholder="e.g. ED-101" />
              </div>
              <div className="form-group">
                <label>Course Fee (Base Amount)*</label>
                <input required type="number" step="0.01" value={formData.originalTotalAmount} onChange={e => setFormData({...formData, originalTotalAmount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Plan</label>
                <select value={formData.paymentPlan} onChange={e => setFormData({...formData, paymentPlan: e.target.value})}>
                  <option value="HALF_AND_PLACEMENT">Half Upfront & Half Post-Placement</option>
                  <option value="FULL_UPFRONT">Full Payment (10% Discount)</option>
                  <option value="EMI_PLAN">EMI on Upfront (+ ₹1000 Interest)</option>
                </select>
              </div>
              
              <div className="calculation-preview">
                <p>Total Agreed Amount</p>
                <strong>₹{preview.total.toLocaleString()}</strong>
                <span className="small">{preview.info}</span>
              </div>

              <div className="form-group">
                <label>Initial Downpayment (₹)</label>
                <input type="number" step="0.01" max={preview.total} value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} placeholder="How much paying now?" />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Communication Notes (Internal)</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="e.g. Discussed installment dates..."></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>💰 Record Payment</h2>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePay} className="modal-body">
              <div className="fee-summary-box">
                <p><strong>Student:</strong> {selectedFee.studentName}</p>
                <p><strong>Total Agreed:</strong> ₹{selectedFee.totalAmount}</p>
                <p><strong>Paid so far:</strong> ₹{selectedFee.paidAmount}</p>
                <p className="due-highlight"><strong>Remaining Due:</strong> ₹{selectedFee.dueAmount}</p>
              </div>
              <div className="form-group">
                <label>Amount Being Paid (₹)*</label>
                <input required type="number" step="0.01" max={selectedFee.dueAmount} value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select value={payData.paymentMode} onChange={e => setPayData({...payData, paymentMode: e.target.value})}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Communication Remarks</label>
                <textarea 
                  required
                  placeholder="e.g. Called student, he promised to pay next month..."
                  value={payData.notes} 
                  onChange={e => setPayData({...payData, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content wide-modal">
            <div className="modal-header">
              <h2>📜 Payment History - {selectedFee.studentName}</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="plan-badge">
                Plan: {selectedFee.paymentPlan?.replace(/_/g, ' ')}
                {selectedFee.isEmi && ` (EMI: ₹${selectedFee.emiInstallment}/mo)`}
              </div>
              <div className="history-list">
                {historyData.length === 0 ? <p>No payment records found.</p> : (
                  historyData.map(h => (
                    <div className="history-item" key={h.id}>
                      <div className="h-top">
                        <span className="h-date">{new Date(h.paymentDate).toLocaleDateString()}</span>
                        <span className="h-amount">₹{h.amount}</span>
                        <span className="h-mode">{h.paymentMode}</span>
                      </div>
                      <div className="h-notes">
                        <p><strong>Communication:</strong> {h.notes || 'No remarks'}</p>
                        <small className="receipt">Receipt: {h.receiptNumber}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
