import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./StudentCertificates.css";
import { FaAward, FaDownload, FaEye, FaFilePdf } from "react-icons/fa";

function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await api.get("/student/certificates");
      setCertificates(res.data);
    } catch (err) {
      console.error("Failed to fetch certificates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certId, fileName, mode="download") => {
    try {
      const response = await api.get(`/student/certificates/download/${certId}?mode=${mode}`, {
        responseType: 'blob'
      });
      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      if (mode === "view") {
        window.open(fileURL, "_blank");
      } else {
        const fileLink = document.createElement('a');
        fileLink.href = fileURL;
        fileLink.setAttribute('download', fileName);
        document.body.appendChild(fileLink);
        fileLink.click();
        fileLink.remove();
      }
    } catch (err) {
      console.error("Failed to download certificate", err);
      alert("Error retrieving certificate pdf.");
    }
  };

  if (loading) return <div className="certificate-page"><p className="cert-loading">Loading certificates...</p></div>;

  return (
    <div className="certificate-page">
      <div className="certificate-hero">
        <div className="certificate-hero__icon"><FaAward /></div>
        <div className="certificate-hero__text">
          <h1>My Certifications</h1>
          <p>View and download your official professional certificates.</p>
        </div>
      </div>

      <div className="certificate-grid">
        {certificates.length > 0 ? (
          certificates.map(cert => (
            <div key={cert.id} className="certificate-card">
              <div className="certificate-card__top">
                <div className="cert-card-icon"><FaFilePdf /></div>
                <div className="cert-card-info">
                  <h3>{cert.courseName}</h3>
                  <span>Issued: {cert.issueDate}</span>
                </div>
              </div>
              <div className="certificate-card__actions">
                <button className="btn-view" onClick={() => handleDownload(cert.id, cert.fileName, "view")}>
                  <FaEye /> View
                </button>
                <button className="btn-down" onClick={() => handleDownload(cert.id, cert.fileName, "download")}>
                  <FaDownload /> Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-cert-state">
             <div className="empty-icon"><FaAward /></div>
             <h3>No Certificates Yet</h3>
             <p>Complete your enrolled courses to earn professional certifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCertificates;