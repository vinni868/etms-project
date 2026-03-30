import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaMoneyBillWave, FaCheck, FaExclamationCircle, FaPrint } from 'react-icons/fa';

export default function StudentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/fees');
      const feeData = res.data || [];
      setFees(feeData);
      
      let due = 0;
      feeData.forEach(f => {
        if (f.status !== 'PAID') {
          due += parseFloat(f.dueAmount);
        }
      });
      setTotalDue(due);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handlePrint = () => window.print();

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-green"><FaMoneyBillWave /></div>
          <div>
            <h1>My Fee Records</h1>
            <p className="page-subtitle">View your payment history and pending dues</p>
          </div>
        </div>
        <button className="secondary-btn" onClick={handlePrint}><FaPrint /> Print Summary</button>
      </div>

      <div className="stats-row" style={{marginBottom: '24px'}}>
        <div className="stat-card" style={{borderColor: totalDue > 0 ? '#ef4444' : '#10b981'}}>
          <div className={`stat-icon ${totalDue > 0 ? 'bg-red' : 'bg-green'}`}>
            {totalDue > 0 ? <FaExclamationCircle /> : <FaCheck />}
          </div>
          <div className="stat-details">
            <h3 style={{color: totalDue > 0 ? '#ef4444' : '#10b981'}}>₹{totalDue.toLocaleString()}</h3>
            <p>Total Outstanding Due</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? <div className="loading-state">Loading your fee records...</div> : 
         <table className="data-table">
          <thead>
            <tr>
              <th>Receipt / Invoice</th>
              <th>Total Course Fee</th>
              <th>Amount Paid</th>
              <th>Due Amount</th>
              <th>Last Payment Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? <tr><td colSpan="6" className="text-center">No fee records found.</td></tr> :
             fees.map(f => (
               <tr key={f.id}>
                 <td className="fw-600 text-blue">{f.receiptNumber}</td>
                 <td className="fw-600">₹{f.totalAmount}</td>
                 <td className="text-green fw-600">₹{f.paidAmount}</td>
                 <td className="text-red fw-600">₹{f.dueAmount}</td>
                 <td>{f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '-'}</td>
                 <td><span className={`status-badge st-${f.status.toLowerCase()}`}>{f.status}</span></td>
               </tr>
             ))
            }
          </tbody>
         </table>
        }
      </div>
    </div>
  );
}
