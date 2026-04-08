import { useState, useEffect, useRef } from "react";
import { FaUser, FaGraduationCap, FaFileUpload, FaCheckCircle, FaExternalLinkAlt, FaLock, FaWhatsapp, FaHome, FaUsers, FaUniversity, FaSearch, FaTimes, FaSave } from "react-icons/fa";
import api from "../../api/axiosConfig";
import "./StudentProfile.css";

// Board options for searchable dropdown
const INDIAN_BOARDS = [
  // National Boards
  { label: "CBSE (Central Board of Secondary Education)", value: "CBSE" },
  { label: "ICSE (Indian Certificate of Secondary Education)", value: "ICSE" },
  { label: "IB (International Baccalaureate)", value: "IB" },
  // State Boards
  { label: "Karnataka State Board", value: "Karnataka" },
  { label: "Tamil Nadu State Board", value: "Tamil Nadu" },
  { label: "Maharashtra State Board", value: "Maharashtra" },
  { label: "Gujarat State Board", value: "Gujarat" },
  { label: "Andhra Pradesh State Board", value: "Andhra Pradesh" },
  { label: "Telangana State Board", value: "Telangana" },
  { label: "Rajasthan State Board", value: "Rajasthan" },
  { label: "Punjab State Board", value: "Punjab" },
  { label: "Haryana State Board", value: "Haryana" },
  { label: "Delhi State Board", value: "Delhi" },
  { label: "Kerala State Board", value: "Kerala" },
  { label: "West Bengal State Board", value: "West Bengal" },
  { label: "Odisha State Board", value: "Odisha" },
  { label: "Uttar Pradesh State Board", value: "Uttar Pradesh" },
  { label: "Madhya Pradesh State Board", value: "Madhya Pradesh" },
  { label: "Bihar State Board", value: "Bihar" },
  { label: "Jharkhand State Board", value: "Jharkhand" },
  { label: "Chhattisgarh State Board", value: "Chhattisgarh" },
  { label: "Himachal Pradesh State Board", value: "Himachal Pradesh" },
  { label: "Uttarakhand State Board", value: "Uttarakhand" },
  { label: "Goa State Board", value: "Goa" },
  { label: "Assam State Board", value: "Assam" },
  { label: "Meghalaya State Board", value: "Meghalaya" },
  { label: "Manipur State Board", value: "Manipur" },
  { label: "Mizoram State Board", value: "Mizoram" },
  { label: "Nagaland State Board", value: "Nagaland" },
  { label: "Sikkim State Board", value: "Sikkim" },
  { label: "Tripura State Board", value: "Tripura" },
  { label: "Puducherry State Board", value: "Puducherry" },
  { label: "Ladakh State Board", value: "Ladakh" },
  { label: "Jammu & Kashmir State Board", value: "Jammu & Kashmir" },
];

function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({
    profilePic: false, aadhar: false, marks10: false, marks12: false, grad: false, resume: false, bankPassbook: false
  });
  const [toast, setToast] = useState({ type: "", text: "" });
  const [profileStrength, setProfileStrength] = useState(0);
  const [boardSearch10, setBoardSearch10] = useState("");
  const [boardSearch12, setBoardSearch12] = useState("");
  const [showBoard10Dropdown, setShowBoard10Dropdown] = useState(false);
  const [showBoard12Dropdown, setShowBoard12Dropdown] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "";

  const [student, setStudent] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    profilePic: "", profilePicFile: null,
    fatherName: "", fatherOccupation: "", fatherPhone: "",
    motherName: "", motherOccupation: "", motherPhone: "",
    hasGuardian: false, guardianName: "", guardianPhone: "", guardianRelationship: "",
    currentlyStudying: null, qualification: "", board10th: "", board12th: "",
    marks10th: "", marks12th: "", yearOfPassing: "", aggregatePercentage: "",
    aadharNumber: "", aadharName: "", aadharCardUrl: "", isAadharVerified: false,
    bankAccountHolder: "", bankAccountNumber: "", bankIfscCode: "", bankName: "", bankAccountType: "", bankPassbookUrl: "",
    address: "", city: "", state: "", pincode: "",
    resumeUrl: "", marks10thUrl: "", marks12thUrl: "", graduationDocUrl: "",
    skills: "", bio: "", studentId: ""
  });

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    fetchProfile();
  }, [userEmail]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/student/profile/${userEmail}`);
      if (res.data) {
        // Merge with defaults — never overwrite empty-string defaults with null from backend
        setStudent(prev => {
          const updated = { ...prev };
          Object.entries(res.data).forEach(([k, v]) => {
            if (v !== null && v !== undefined) updated[k] = v;
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showToast("error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileStrength = () => {
    let score = 0;
    let maxScore = 100;

    // Profile pic (5%)
    if (student.profilePic) score += 5;
    // Basic info (15%)
    if (student.name?.trim()) score += 5;
    if (student.phone?.length === 10) score += 5;
    if (student.gender) score += 5;
    // Family (15%)
    if (student.fatherName?.trim() && student.fatherPhone?.length === 10) score += 7.5;
    if (student.motherName?.trim() && student.motherPhone?.length === 10) score += 7.5;
    // Education (20%)
    if (student.currentlyStudying === true) {
      if (student.qualification?.trim()) score += 6;
      if (student.board10th) score += 7;
      if (student.marks10thUrl) score += 7;
    } else if (student.currentlyStudying === false) {
      if (student.yearOfPassing?.trim()) score += 5;
      if (student.aggregatePercentage?.trim()) score += 5;
      if (student.board10th && student.marks10thUrl) score += 5;
      if (student.board12th && student.marks12thUrl) score += 5;
    }
    // Aadhar (15%)
    if (student.aadharNumber?.length === 12) score += 7.5;
    if (student.aadharCardUrl) score += 7.5;
    // Banking (15%)
    if (student.bankAccountHolder?.trim()) score += 3;
    if (student.bankAccountNumber?.trim()) score += 3;
    if (student.bankIfscCode?.trim()) score += 3;
    if (student.bankName?.trim()) score += 3;
    if (student.bankPassbookUrl) score += 3;
    // Address (10%)
    if (student.address?.trim() && student.city?.trim() && student.state?.trim() && student.pincode?.trim()) score += 10;

    return Math.min(Math.round((score / maxScore) * 100), 100);
  };

  useEffect(() => {
    setProfileStrength(calculateProfileStrength());
  }, [student]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === "phone" || name === "fatherPhone" || name === "motherPhone" || name === "guardianPhone")) {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setStudent({ ...student, [name]: numericValue });
    } else if (name === "aadharNumber") {
      const numericValue = value.replace(/\D/g, "").slice(0, 12);
      setStudent({ ...student, [name]: numericValue });
    } else if (name === "aadharName") {
      setStudent(prev => ({ ...prev, aadharName: value, name: value }));
    } else {
      setStudent({ ...student, [name]: value });
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File must be under 5 MB.");
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("email", userEmail);

    try {
      const res = await api.post("/student/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { url } = res.data;
      const fieldMap = {
        profilePic: "profilePic",
        aadhar: "aadharCardUrl",
        marks10: "marks10thUrl",
        marks12: "marks12thUrl",
        grad: "graduationDocUrl",
        resume: "resumeUrl",
        bankPassbook: "bankPassbookUrl"
      };

      setStudent(prev => ({ ...prev, [fieldMap[type]]: url }));
      showToast("success", `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully! ☁️`);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("error", "Upload failed. Check Cloudinary settings.");
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    // Validation — only block if a value was provided but is incomplete
    if (!student.aadharName?.trim() && !student.name?.trim()) { showToast("error", "Name is required"); return; }
    if (student.phone && student.phone.length !== 10) { showToast("error", "Phone must be 10 digits"); return; }
    if (!student.gender) { showToast("error", "Gender is required"); return; }
    if (!student.fatherName?.trim()) { showToast("error", "Father name is required"); return; }
    if (student.fatherPhone && student.fatherPhone.length !== 10) { showToast("error", "Father phone must be 10 digits"); return; }
    if (!student.motherName?.trim()) { showToast("error", "Mother name is required"); return; }
    if (student.motherPhone && student.motherPhone.length !== 10) { showToast("error", "Mother phone must be 10 digits"); return; }
    if (student.hasGuardian && !student.guardianName?.trim()) { showToast("error", "Guardian name is required"); return; }
    if (student.hasGuardian && student.guardianPhone && student.guardianPhone.length !== 10) { showToast("error", "Guardian phone must be 10 digits"); return; }
    if (student.currentlyStudying === null) { showToast("error", "Please select education status"); return; }
    // Aadhar & bank: only validate format if user has started filling them in
    if (student.aadharNumber && student.aadharNumber.length !== 12) { showToast("error", "Aadhar number must be 12 digits"); return; }
    if (student.bankAccountNumber && !student.bankAccountNumber.trim()) { showToast("error", "Bank account number cannot be blank"); return; }

    setSaving(true);
    try {
      await api.put("/student/update-profile", student);
      showToast("success", "Profile updated successfully! ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleScrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ── DigiLocker OAuth helpers ─────────────────────────────────────────────
  const [digilockerLoading, setDigilockerLoading] = useState(false);

  // ── Offline Aadhaar Verification state ───────────────────────────────────
  const [offlineZip, setOfflineZip] = useState(null);
  const [offlineZipName, setOfflineZipName] = useState("");
  const [offlineShareCode, setOfflineShareCode] = useState("");
  const [offlineVerifying, setOfflineVerifying] = useState(false);
  const [offlineResult, setOfflineResult] = useState(null); // extracted data after verify
  const offlineFileRef = useRef(null);

  // On mount: check if we're returning from a DigiLocker OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dlResult = params.get("digilocker");
    if (dlResult === "success") {
      showToast("success", "Aadhaar verified via DigiLocker! ✅ Document saved automatically.");
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchProfile();
    } else if (dlResult === "error") {
      const reason = params.get("reason") || "Verification failed";
      showToast("error", `DigiLocker error: ${decodeURIComponent(reason)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDigiLockerVerify = async () => {
    setDigilockerLoading(true);
    try {
      const res = await api.get("/digilocker/auth-url");
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        showToast("error", "Could not get DigiLocker URL. Please try again.");
      }
    } catch (err) {
      const msg = err.response?.data?.hint || err.response?.data?.error || "DigiLocker is not available right now.";
      showToast("error", msg);
    } finally {
      setDigilockerLoading(false);
    }
  };

  const handleOfflineZipSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      showToast("error", "Please select the ZIP file downloaded from UIDAI.");
      return;
    }
    setOfflineZip(file);
    setOfflineZipName(file.name);
    setOfflineResult(null);
  };

  const handleOfflineVerify = async () => {
    if (!offlineZip) { showToast("error", "Please select the Offline eKYC ZIP file."); return; }
    if (!offlineShareCode.trim()) { showToast("error", "Please enter the share code you set during download."); return; }
    setOfflineVerifying(true);
    try {
      const formData = new FormData();
      formData.append("file", offlineZip);
      formData.append("shareCode", offlineShareCode.trim().toUpperCase());
      const res = await api.post("/student/verify-aadhaar-offline", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setOfflineResult(res.data);
      if (res.data.verified) {
        showToast("success", "Aadhaar verified successfully! ✅");
        // Update local state immediately
        setStudent(prev => ({
          ...prev,
          isAadharVerified: true,
          aadharCardUrl: res.data.cloudinaryUrl || prev.aadharCardUrl,
          aadharName: res.data.name || prev.aadharName,
          name: res.data.name || prev.name,
          aadhaarVerificationSource: "OFFLINE_XML"
        }));
      } else {
        showToast("error", res.data.message || "Verification failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Verification failed — please try again.";
      showToast("error", msg);
    } finally {
      setOfflineVerifying(false);
    }
  };

  const filteredBoards10 = INDIAN_BOARDS.filter(b => b.label.toLowerCase().includes(boardSearch10.toLowerCase()));
  const filteredBoards12 = INDIAN_BOARDS.filter(b => b.label.toLowerCase().includes(boardSearch12.toLowerCase()));

  const getStrengthColor = (percentage) => {
    if (percentage < 50) return "#ef4444";
    if (percentage < 80) return "#f59e0b";
    return "#10b981";
  };

  const completionHint = profileStrength < 50
    ? "Complete more sections to strengthen your profile"
    : profileStrength < 100
      ? "Almost there! Keep filling in your details"
      : "Your profile is complete!";

  if (loading) return (
    <div className="spa-page">
      <div className="spa-loader">
        <div className="spa-spinner" />
        <p>Loading your profile…</p>
      </div>
    </div>
  );

  return (
    <div className="spa-page">
      {/* Toast notification */}
      {toast.text && (
        <div className={`spa-toast spa-toast--${toast.type}`}>
          {toast.text}
        </div>
      )}

      {/* Hero Section */}
      <div className="spa-hero">
        <div className="spa-hero-top-bar">
          <div className="spa-hero-logo-area">
            {/* left side brand area */}
          </div>
          <button className="spa-hero-update-btn" onClick={handleScrollToForm}>
            Update Profile
          </button>
        </div>

        <div className="spa-hero-body">
          <div className="spa-hero-identity">
            <div className="spa-avatar-ring" onClick={() => fileInputRef.current?.click()}>
              {uploading.profilePic ? (
                <div className="spa-avatar-spinner" />
              ) : (
                <>
                  <img
                    src={student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                    alt="Profile"
                    className="spa-avatar-img"
                  />
                  <label className="spa-avatar-edit" onClick={(e) => e.stopPropagation()}>
                    📷
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e, "profilePic")}
                      hidden
                      accept="image/*"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="spa-hero-text">
              <h1 className="spa-hero-name">
                {student.aadharName || student.name || "Student"}
              </h1>
              <p className="spa-hero-email">{student.email}</p>
              {student.studentId && (
                <span className="spa-hero-id">ID: {student.studentId}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card overlap — profile completion */}
      <div className="spa-card-overlap">
        <div className="spa-completion-row">
          <span className="spa-completion-label">Profile Completion</span>
          <span className="spa-completion-pct">{profileStrength}%</span>
        </div>
        <div className="spa-bar-track">
          <div
            className="spa-bar-fill"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
        <span className="spa-completion-hint">{completionHint}</span>
      </div>

      {/* Form content */}
      <div className="spa-content" ref={formRef}>

        {/* ── Section 01: Basic Information ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">01</div>
            <div>
              <h2>Basic Information</h2>
              <p>Personal details and contact</p>
            </div>
          </div>
          <div className="spa-section-body">
            {/* Full Name (as on Aadhar) — first, full width */}
            <div className="spa-fields-grid spa-fields-grid--1">
              <div className="spa-field">
                <label>FULL NAME (AS ON AADHAR CARD)</label>
                <input
                  type="text"
                  name="aadharName"
                  value={student.aadharName}
                  onChange={handleChange}
                  placeholder="Enter your name exactly as it appears on Aadhar"
                />
                <span className="spa-field-hint">
                  This is your official name — it will appear on your profile, ID card, and all certificates
                </span>
              </div>
            </div>
            {/* Email full width */}
            <div className="spa-fields-grid spa-fields-grid--1">
              <div className="spa-field">
                <label>EMAIL ADDRESS</label>
                <input type="email" value={student.email} disabled readOnly />
                <span className="spa-field-hint">Your registered email — cannot be changed</span>
              </div>
            </div>
            {/* Phone + Gender in 2 cols */}
            <div className="spa-fields-grid spa-fields-grid--2">
              <div className="spa-field">
                <label>PHONE NUMBER</label>
                <input
                  type="text"
                  name="phone"
                  value={student.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength="10"
                />
                {student.phone && student.phone.length < 10 && (
                  <span className="spa-field-error">10 digits required</span>
                )}
              </div>
              <div className="spa-field">
                <label>GENDER</label>
                <select name="gender" value={student.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 02: Family Details ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">02</div>
            <div>
              <h2>Family Details</h2>
              <p>Parent and guardian information</p>
            </div>
          </div>
          <div className="spa-section-body">

            {/* Father's Details */}
            <div className="spa-subsection-header">Father's Details</div>
            <div className="spa-fields-grid spa-fields-grid--2">
              <div className="spa-field">
                <label>FATHER'S NAME</label>
                <input
                  type="text"
                  name="fatherName"
                  value={student.fatherName}
                  onChange={handleChange}
                  placeholder="Father's full name"
                />
              </div>
              <div className="spa-field">
                <label>PHONE NUMBER</label>
                <input
                  type="text"
                  name="fatherPhone"
                  value={student.fatherPhone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength="10"
                />
                {student.fatherPhone && student.fatherPhone.length < 10 && (
                  <span className="spa-field-error">10 digits required</span>
                )}
              </div>
              <div className="spa-field">
                <label>OCCUPATION</label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={student.fatherOccupation}
                  onChange={handleChange}
                  placeholder="e.g., Engineer, Doctor"
                />
              </div>
            </div>

            {/* Mother's Details */}
            <div className="spa-subsection-header" style={{ marginTop: "20px" }}>Mother's Details</div>
            <div className="spa-fields-grid spa-fields-grid--2">
              <div className="spa-field">
                <label>MOTHER'S NAME</label>
                <input
                  type="text"
                  name="motherName"
                  value={student.motherName}
                  onChange={handleChange}
                  placeholder="Mother's full name"
                />
              </div>
              <div className="spa-field">
                <label>PHONE NUMBER</label>
                <input
                  type="text"
                  name="motherPhone"
                  value={student.motherPhone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength="10"
                />
                {student.motherPhone && student.motherPhone.length < 10 && (
                  <span className="spa-field-error">10 digits required</span>
                )}
              </div>
              <div className="spa-field">
                <label>OCCUPATION</label>
                <input
                  type="text"
                  name="motherOccupation"
                  value={student.motherOccupation}
                  onChange={handleChange}
                  placeholder="e.g., Teacher, Business"
                />
              </div>
            </div>

            {/* Guardian toggle */}
            <div className="spa-guardian-toggle">
              <input
                type="checkbox"
                id="spa-has-guardian"
                checked={student.hasGuardian || false}
                onChange={(e) => setStudent({ ...student, hasGuardian: e.target.checked })}
              />
              <label htmlFor="spa-has-guardian">I have a different guardian</label>
            </div>

            {student.hasGuardian && (
              <div className="spa-fields-grid spa-fields-grid--2" style={{ marginTop: "16px" }}>
                <div className="spa-field">
                  <label>GUARDIAN'S NAME</label>
                  <input
                    type="text"
                    name="guardianName"
                    value={student.guardianName}
                    onChange={handleChange}
                    placeholder="Guardian's full name"
                  />
                </div>
                <div className="spa-field">
                  <label>RELATIONSHIP</label>
                  <input
                    type="text"
                    name="guardianRelationship"
                    value={student.guardianRelationship}
                    onChange={handleChange}
                    placeholder="e.g., Aunt, Uncle"
                  />
                </div>
                <div className="spa-field">
                  <label>PHONE NUMBER</label>
                  <input
                    type="text"
                    name="guardianPhone"
                    value={student.guardianPhone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength="10"
                  />
                  {student.guardianPhone && student.guardianPhone.length < 10 && (
                    <span className="spa-field-error">10 digits required</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 03: Education ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">03</div>
            <div>
              <h2>Education</h2>
              <p>Academic background and qualifications</p>
            </div>
          </div>
          <div className="spa-section-body">

            {/* Radio: Currently Studying / Graduated */}
            <div className="spa-radio-group">
              <label className="spa-radio-option">
                <input
                  type="radio"
                  name="educationStatus"
                  checked={student.currentlyStudying === true}
                  onChange={() => setStudent({ ...student, currentlyStudying: true })}
                />
                <span className="spa-radio-custom" />
                <span className="spa-radio-label">Currently Studying</span>
              </label>
              <label className="spa-radio-option">
                <input
                  type="radio"
                  name="educationStatus"
                  checked={student.currentlyStudying === false}
                  onChange={() => setStudent({ ...student, currentlyStudying: false })}
                />
                <span className="spa-radio-custom" />
                <span className="spa-radio-label">Graduated</span>
              </label>
            </div>

            {/* Currently Studying fields */}
            {student.currentlyStudying === true && (
              <div className="spa-education-panel">
                <div className="spa-fields-grid spa-fields-grid--2">
                  <div className="spa-field">
                    <label>QUALIFICATION PURSUING</label>
                    <input
                      type="text"
                      name="qualification"
                      value={student.qualification}
                      onChange={handleChange}
                      placeholder="e.g., B.Tech, BA"
                    />
                  </div>
                  <div className="spa-field">
                    <label>CURRENT YEAR</label>
                    <select name="yearOfPassing" value={student.yearOfPassing} onChange={handleChange}>
                      <option value="">Select Year</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="spa-board-field">
                  <label>10TH BOARD</label>
                  <div className="sp2-searchable-select">
                    <input
                      type="text"
                      placeholder="Search board..."
                      value={boardSearch10}
                      onChange={(e) => setBoardSearch10(e.target.value)}
                      onFocus={() => setShowBoard10Dropdown(true)}
                    />
                    {showBoard10Dropdown && (
                      <div className="sp2-dropdown-menu">
                        {filteredBoards10.map(board => (
                          <div
                            key={board.value}
                            className="sp2-dropdown-item"
                            onClick={() => {
                              setStudent({ ...student, board10th: board.value });
                              setBoardSearch10(board.label);
                              setShowBoard10Dropdown(false);
                            }}
                          >
                            {board.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DocUploadItem
                  label="10th Marks Card"
                  url={student.marks10thUrl}
                  loading={uploading.marks10}
                  onUpload={(e) => handleFileUpload(e, "marks10")}
                />
              </div>
            )}

            {/* Graduated fields */}
            {student.currentlyStudying === false && (
              <div className="spa-education-panel">
                <div className="spa-fields-grid spa-fields-grid--2">
                  <div className="spa-field">
                    <label>GRADUATION YEAR</label>
                    <input
                      type="number"
                      name="yearOfPassing"
                      value={student.yearOfPassing}
                      onChange={handleChange}
                      placeholder="e.g., 2023"
                      max="2050"
                    />
                  </div>
                  <div className="spa-field">
                    <label>AGGREGATE PERCENTAGE</label>
                    <input
                      type="text"
                      name="aggregatePercentage"
                      value={student.aggregatePercentage}
                      onChange={handleChange}
                      placeholder="e.g., 78.5%"
                    />
                  </div>
                </div>

                <div className="spa-board-field">
                  <label>10TH BOARD</label>
                  <div className="sp2-searchable-select">
                    <input
                      type="text"
                      placeholder="Search board..."
                      value={boardSearch10}
                      onChange={(e) => setBoardSearch10(e.target.value)}
                      onFocus={() => setShowBoard10Dropdown(true)}
                    />
                    {showBoard10Dropdown && (
                      <div className="sp2-dropdown-menu">
                        {filteredBoards10.map(board => (
                          <div
                            key={board.value}
                            className="sp2-dropdown-item"
                            onClick={() => {
                              setStudent({ ...student, board10th: board.value });
                              setBoardSearch10(board.label);
                              setShowBoard10Dropdown(false);
                            }}
                          >
                            {board.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DocUploadItem
                  label="10th Marks Card"
                  url={student.marks10thUrl}
                  loading={uploading.marks10}
                  onUpload={(e) => handleFileUpload(e, "marks10")}
                />

                <div className="spa-board-field">
                  <label>12TH BOARD</label>
                  <div className="sp2-searchable-select">
                    <input
                      type="text"
                      placeholder="Search board..."
                      value={boardSearch12}
                      onChange={(e) => setBoardSearch12(e.target.value)}
                      onFocus={() => setShowBoard12Dropdown(true)}
                    />
                    {showBoard12Dropdown && (
                      <div className="sp2-dropdown-menu">
                        {filteredBoards12.map(board => (
                          <div
                            key={board.value}
                            className="sp2-dropdown-item"
                            onClick={() => {
                              setStudent({ ...student, board12th: board.value });
                              setBoardSearch12(board.label);
                              setShowBoard12Dropdown(false);
                            }}
                          >
                            {board.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DocUploadItem
                  label="12th Marks Card"
                  url={student.marks12thUrl}
                  loading={uploading.marks12}
                  onUpload={(e) => handleFileUpload(e, "marks12")}
                />

                <DocUploadItem
                  label="Graduation Certificate"
                  url={student.graduationDocUrl}
                  loading={uploading.grad}
                  onUpload={(e) => handleFileUpload(e, "grad")}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 04: Identity Verification ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">04</div>
            <div>
              <h2>Identity Verification</h2>
              <p>Aadhaar verification via UIDAI Offline eKYC</p>
            </div>
          </div>
          <div className="spa-section-body">

            {/* Aadhaar Number */}
            <div className="spa-fields-grid spa-fields-grid--1">
              <div className="spa-field">
                <label>AADHAAR NUMBER</label>
                <div className="spa-aadhar-row">
                  <input
                    type="text"
                    name="aadharNumber"
                    value={student.aadharNumber}
                    onChange={handleChange}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength="12"
                    className="spa-aadhar-input"
                  />
                  {student.isAadharVerified ? (
                    <span className="spa-verified-badge">✓ Verified</span>
                  ) : student.aadharCardUrl ? (
                    <span className="spa-pending-badge">⏳ Pending Review</span>
                  ) : (
                    <span className="spa-unverified-badge">Not Verified</span>
                  )}
                </div>
                {student.aadharNumber && student.aadharNumber.length < 12 && (
                  <span className="spa-field-error">12 digits required</span>
                )}
                <span className="spa-field-hint">Your 12-digit Aadhaar number issued by UIDAI</span>
              </div>
            </div>

            {/* ── Already Verified State ── */}
            {student.isAadharVerified ? (
              <div className="spa-id-verified-wrap">
                <div className="spa-id-verified-check">✓</div>
                <div className="spa-id-verified-body">
                  <div className="spa-id-verified-title">Aadhaar Identity Verified</div>
                  <div className="spa-id-verified-sub">
                    {student.aadhaarVerificationSource === "OFFLINE_XML"
                      ? "Verified via UIDAI Offline eKYC — document is digitally authentic"
                      : student.aadhaarVerificationSource === "DIGILOCKER_OAUTH"
                        ? "Verified via DigiLocker — document fetched automatically from UIDAI"
                        : "Your Aadhaar has been verified by the admin team"}
                  </div>
                  {offlineResult?.name && (
                    <div className="spa-id-verified-chips">
                      {offlineResult.name && <span className="spa-id-chip"><span>👤</span>{offlineResult.name}</span>}
                      {offlineResult.dob && <span className="spa-id-chip"><span>🎂</span>{offlineResult.dob}</span>}
                      {offlineResult.gender && <span className="spa-id-chip"><span>⚧</span>{offlineResult.gender}</span>}
                      {offlineResult.maskedAadhaar && <span className="spa-id-chip"><span>🪪</span>{offlineResult.maskedAadhaar}</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Not Verified — Full Verification Flow ── */
              <div className="spa-id-flow">

                {/* ── Step Guide: How to get the ZIP ── */}
                <div className="spa-id-guide">
                  <div className="spa-id-guide-header">
                    <div className="spa-id-guide-icon">🏛️</div>
                    <div>
                      <div className="spa-id-guide-title">How to get your Offline eKYC file</div>
                      <div className="spa-id-guide-sub">
                        Free from Government of India — takes 2 minutes on your phone
                      </div>
                    </div>
                    <a
                      href="https://myaadhaar.uidai.gov.in/offlineaadhaar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spa-id-uidai-btn"
                    >
                      Open UIDAI Portal ↗
                    </a>
                  </div>

                  <div className="spa-id-guide-steps">
                    <div className="spa-id-guide-step">
                      <div className="spa-id-gs-num">1</div>
                      <div className="spa-id-gs-body">
                        <div className="spa-id-gs-title">Open the UIDAI Aadhaar portal</div>
                        <div className="spa-id-gs-desc">
                          Click <strong>Open UIDAI Portal</strong> above or visit
                          <span className="spa-id-gs-url"> myaadhaar.uidai.gov.in/offlineaadhaar</span>
                        </div>
                      </div>
                    </div>

                    <div className="spa-id-guide-step">
                      <div className="spa-id-gs-num">2</div>
                      <div className="spa-id-gs-body">
                        <div className="spa-id-gs-title">Enter your Aadhaar &amp; verify OTP</div>
                        <div className="spa-id-gs-desc">
                          Enter your 12-digit Aadhaar number and the captcha shown.
                          Click <strong>Send OTP</strong> — you'll get an SMS on your Aadhaar-linked mobile number.
                          Enter that OTP.
                        </div>
                      </div>
                    </div>

                    <div className="spa-id-guide-step">
                      <div className="spa-id-gs-num">3</div>
                      <div className="spa-id-gs-body">
                        <div className="spa-id-gs-title">Set a Share Code &amp; download</div>
                        <div className="spa-id-gs-desc">
                          You'll see a field to set a <strong>Share Code</strong> (any 4 characters — e.g. <code>AB12</code>).
                          <span className="spa-id-gs-warning">⚠ Remember this code — you'll need it below.</span>
                          Then click <strong>Download</strong> — a ZIP file saves to your device.
                        </div>
                      </div>
                    </div>

                    <div className="spa-id-guide-step">
                      <div className="spa-id-gs-num">4</div>
                      <div className="spa-id-gs-body">
                        <div className="spa-id-gs-title">Upload here &amp; verify instantly</div>
                        <div className="spa-id-gs-desc">
                          Come back to this page, upload the ZIP file below, enter your share code, and click
                          <strong> Verify Aadhaar</strong>. Your identity is confirmed automatically.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Upload Form ── */}
                <div className="spa-id-upload-card">
                  <div className="spa-id-upload-title">Upload &amp; Verify</div>

                  {/* Drop zone */}
                  <div
                    className={`spa-id-dropzone ${offlineZip ? "spa-id-dropzone--filled" : ""}`}
                    onClick={() => offlineFileRef.current?.click()}
                  >
                    <input
                      ref={offlineFileRef}
                      type="file"
                      accept=".zip"
                      hidden
                      onChange={handleOfflineZipSelect}
                    />
                    {offlineZip ? (
                      <div className="spa-id-dz-filled">
                        <div className="spa-id-dz-file-icon">📦</div>
                        <div className="spa-id-dz-file-info">
                          <div className="spa-id-dz-filename">{offlineZipName}</div>
                          <div className="spa-id-dz-replace">Click to replace file</div>
                        </div>
                        <div className="spa-id-dz-ok">✓</div>
                      </div>
                    ) : (
                      <div className="spa-id-dz-empty">
                        <div className="spa-id-dz-icon">📂</div>
                        <div className="spa-id-dz-label">Click to select your Offline eKYC ZIP</div>
                        <div className="spa-id-dz-hint">The .zip file downloaded from UIDAI portal</div>
                      </div>
                    )}
                  </div>

                  {/* Share Code + Verify row */}
                  <div className="spa-id-bottom-row">
                    <div className="spa-field spa-id-sc-field">
                      <label>SHARE CODE</label>
                      <input
                        type="text"
                        value={offlineShareCode}
                        onChange={(e) => setOfflineShareCode(e.target.value.toUpperCase().slice(0, 8))}
                        placeholder="e.g.  AB12"
                        maxLength="8"
                        className="spa-av-sharecode-input"
                      />
                      <span className="spa-field-hint">Code you set on UIDAI portal</span>
                    </div>

                    <button
                      className="spa-id-verify-btn"
                      onClick={handleOfflineVerify}
                      disabled={offlineVerifying || !offlineZip || !offlineShareCode.trim()}
                    >
                      {offlineVerifying ? (
                        <><span className="spa-btn-spinner spa-btn-spinner--sm" />Verifying…</>
                      ) : (
                        <>🔐 Verify Aadhaar</>
                      )}
                    </button>
                  </div>

                  {/* Result */}
                  {offlineResult && (
                    <div className={`spa-id-result ${offlineResult.verified ? "spa-id-result--ok" : "spa-id-result--fail"}`}>
                      {offlineResult.verified ? (
                        <>
                          <div className="spa-id-result-head">
                            <span className="spa-id-result-icon spa-id-result-icon--ok">✓</span>
                            <div>
                              <div className="spa-id-result-title">Aadhaar Verified Successfully</div>
                              <div className="spa-id-result-lvl">
                                {offlineResult.verificationLevel === "CRYPTOGRAPHIC"
                                  ? "🔒 Cryptographic signature confirmed by UIDAI"
                                  : "📄 Document structure confirmed — authentic UIDAI format"}
                              </div>
                            </div>
                          </div>
                          <div className="spa-id-result-chips">
                            {offlineResult.name && <div className="spa-id-rchip"><div className="spa-id-rchip-label">NAME</div><div className="spa-id-rchip-val">{offlineResult.name}</div></div>}
                            {offlineResult.dob && <div className="spa-id-rchip"><div className="spa-id-rchip-label">DATE OF BIRTH</div><div className="spa-id-rchip-val">{offlineResult.dob}</div></div>}
                            {offlineResult.gender && <div className="spa-id-rchip"><div className="spa-id-rchip-label">GENDER</div><div className="spa-id-rchip-val">{offlineResult.gender}</div></div>}
                            {offlineResult.maskedAadhaar && <div className="spa-id-rchip"><div className="spa-id-rchip-label">AADHAAR</div><div className="spa-id-rchip-val">{offlineResult.maskedAadhaar}</div></div>}
                          </div>
                        </>
                      ) : (
                        <div className="spa-id-result-head">
                          <span className="spa-id-result-icon spa-id-result-icon--fail">✕</span>
                          <div>
                            <div className="spa-id-result-title">Verification Failed</div>
                            <div className="spa-id-result-lvl">{offlineResult.message}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual upload fallback */}
                <div className="spa-id-manual">
                  <div className="spa-id-manual-label">
                    <span>Can't access UIDAI portal?</span>
                    <span className="spa-id-manual-sub">Upload a scanned copy for admin review (slower — 24–48 hrs)</span>
                  </div>
                  <DocUploadItem
                    label="Aadhaar Card (scanned copy)"
                    url={student.aadharCardUrl}
                    loading={uploading.aadhar}
                    onUpload={(e) => handleFileUpload(e, "aadhar")}
                  />
                  {student.aadharCardUrl && (
                    <p className="spa-verification-note">
                      📋 Document uploaded — admin will review and mark you verified within 24–48 hours
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 05: Banking Details ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">05</div>
            <div>
              <h2>Banking Details</h2>
              <p>Bank account for scholarship &amp; payments</p>
            </div>
          </div>
          <div className="spa-section-body">
            <div className="spa-fields-grid spa-fields-grid--2">
              <div className="spa-field">
                <label>ACCOUNT HOLDER NAME</label>
                <input
                  type="text"
                  name="bankAccountHolder"
                  value={student.bankAccountHolder}
                  onChange={handleChange}
                  placeholder="Name as per bank account"
                />
              </div>
              <div className="spa-field">
                <label>BANK NAME</label>
                <input
                  type="text"
                  name="bankName"
                  value={student.bankName}
                  onChange={handleChange}
                  placeholder="e.g., HDFC Bank, SBI"
                />
              </div>
              <div className="spa-field">
                <label>ACCOUNT NUMBER</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={student.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Your account number"
                />
              </div>
              <div className="spa-field">
                <label>ACCOUNT TYPE</label>
                <select name="bankAccountType" value={student.bankAccountType} onChange={handleChange}>
                  <option value="">Select Type</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="spa-field">
                <label>IFSC CODE</label>
                <input
                  type="text"
                  name="bankIfscCode"
                  value={student.bankIfscCode}
                  onChange={handleChange}
                  placeholder="e.g., HDFC0001234"
                />
              </div>
            </div>

            <DocUploadItem
              label="Bank Passbook First Page"
              url={student.bankPassbookUrl}
              loading={uploading.bankPassbook}
              onUpload={(e) => handleFileUpload(e, "bankPassbook")}
            />
          </div>
        </div>

        {/* ── Section 06: Address ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">06</div>
            <div>
              <h2>Address</h2>
              <p>Your residential address</p>
            </div>
          </div>
          <div className="spa-section-body">
            <div className="spa-fields-grid spa-fields-grid--1">
              <div className="spa-field">
                <label>STREET ADDRESS</label>
                <input
                  type="text"
                  name="address"
                  value={student.address}
                  onChange={handleChange}
                  placeholder="House no, building, street..."
                />
              </div>
            </div>
            <div className="spa-fields-grid spa-fields-grid--3">
              <div className="spa-field">
                <label>CITY</label>
                <input
                  type="text"
                  name="city"
                  value={student.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="spa-field">
                <label>STATE</label>
                <input
                  type="text"
                  name="state"
                  value={student.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div className="spa-field">
                <label>PINCODE</label>
                <input
                  type="text"
                  name="pincode"
                  value={student.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 07: Documents ── */}
        <div className="spa-section">
          <div className="spa-section-head">
            <div className="spa-section-num">07</div>
            <div>
              <h2>Documents</h2>
              <p>Resume and additional documents</p>
            </div>
          </div>
          <div className="spa-section-body">
            <DocUploadItem
              label="Resume / CV"
              url={student.resumeUrl}
              loading={uploading.resume}
              onUpload={(e) => handleFileUpload(e, "resume")}
            />
          </div>
        </div>

        {/* ── Save Area ── */}
        <div className="spa-save-area">
          <button
            className="spa-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spa-btn-spinner" />
                Saving…
              </>
            ) : (
              `Save Changes (${profileStrength}% Complete)`
            )}
          </button>
          <p className="spa-save-hint">
            {profileStrength < 50
              ? "Complete more sections to strengthen your profile"
              : profileStrength < 100
                ? "Continue filling your profile for full completion"
                : "Your profile is complete!"}
          </p>
        </div>

      </div>
    </div>
  );
}

function DocUploadItem({ label, url, loading, onUpload }) {
  return (
    <div className={`sp2-doc-item ${url ? "sp2-doc-item--uploaded" : ""}`}>
      <div className="sp2-doc-label">
        <span>{label}</span>
        {url && (
          <span className="sp2-doc-badge">
            <FaCheckCircle /> Uploaded
          </span>
        )}
      </div>
      <div className="sp2-doc-action">
        {loading ? (
          <div className="sp2-doc-spinner" />
        ) : url ? (
          <div className="sp2-doc-buttons">
            <a href={url} target="_blank" rel="noreferrer" className="sp2-btn-view">
              <FaExternalLinkAlt /> View
            </a>
            <label className="sp2-btn-replace">
              <input type="file" onChange={onUpload} hidden />
              Replace
            </label>
          </div>
        ) : (
          <label className="sp2-btn-upload">
            <input type="file" onChange={onUpload} hidden />
            <FaFileUpload /> Upload
          </label>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;
