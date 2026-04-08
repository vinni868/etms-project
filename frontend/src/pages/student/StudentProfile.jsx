import { useState, useEffect, useRef } from "react";
import { FaUser, FaGraduationCap, FaFileUpload, FaCheckCircle, FaExternalLinkAlt, FaLock, FaWhatsapp, FaHome, FaUsers, FaBank, FaSearch, FaTimes, FaSave } from "react-icons/fa";
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
    aadharNumber: "", aadharName: "", aadharCardUrl: "",
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
    if (!student.name?.trim()) { showToast("error", "Name is required"); return; }
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

  const filteredBoards10 = INDIAN_BOARDS.filter(b => b.label.toLowerCase().includes(boardSearch10.toLowerCase()));
  const filteredBoards12 = INDIAN_BOARDS.filter(b => b.label.toLowerCase().includes(boardSearch12.toLowerCase()));

  const getStrengthColor = (percentage) => {
    if (percentage < 50) return "#ef4444";
    if (percentage < 80) return "#f59e0b";
    return "#10b981";
  };

  if (loading) return (
    <div className="sp2-loader">
      <div className="sp2-spinner" />
      <p>Loading your profile…</p>
    </div>
  );

  return (
    <div className="sp2-page">
      {toast.text && <div className={`sp2-toast sp2-toast--${toast.type}`}>{toast.text}</div>}

      <div className="sp2-container">
        {/* Header Section */}
        <div className="sp2-header">
          <div className="sp2-photo-section">
            <div className="sp2-photo-frame">
              {uploading.profilePic && <div className="sp2-photo-spinner" />}
              {!uploading.profilePic && (
                <>
                  <img src={student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="sp2-photo-img" />
                  <label className="sp2-photo-upload" onClick={() => fileInputRef.current?.click()}>
                    📷
                  </label>
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, "profilePic")} hidden accept="image/*" />
                </>
              )}
            </div>
          </div>

          <div className="sp2-header-info">
            <h1 className="sp2-name">{student.aadharName || student.name || "Student Profile"}</h1>
            <p className="sp2-email">{student.email}</p>
            {student.studentId && <p className="sp2-id">ID: {student.studentId}</p>}
          </div>
        </div>

        {/* Profile Strength Indicator */}
        <div className="sp2-strength-container">
          <div className="sp2-strength-header">
            <span className="sp2-strength-label">Profile Completion</span>
            <span className="sp2-strength-percent" style={{ color: getStrengthColor(profileStrength) }}>
              {profileStrength}%
            </span>
          </div>
          <div className="sp2-strength-bar">
            <div className="sp2-strength-fill" style={{ width: `${profileStrength}%`, backgroundColor: getStrengthColor(profileStrength) }} />
          </div>
          <p className="sp2-strength-status">
            {profileStrength < 50 ? "⚠️ Complete more sections" : profileStrength < 100 ? "📝 Almost there!" : "✅ Profile complete!"}
          </p>
        </div>

        {/* Scrollable Form Sections */}
        <div className="sp2-form-wrapper">
          {/* Section 1: Basic Information */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaUser className="sp2-section-icon" />
              <h2>Basic Information</h2>
            </div>
            <div className="sp2-grid sp2-grid-2">
              <div className="sp2-field">
                <label>Full Name</label>
                <input type="text" name="name" value={student.name} onChange={handleChange} placeholder="Your full name" />
              </div>
              <div className="sp2-field">
                <label>Email (Read-only)</label>
                <input type="email" value={student.email} disabled />
              </div>
              <div className="sp2-field">
                <label>Phone Number</label>
                <input type="text" name="phone" value={student.phone} onChange={handleChange} placeholder="10-digit number" maxLength="10" />
                {student.phone && student.phone.length < 10 && <span className="sp2-error">⚠️ 10 digits required</span>}
              </div>
              <div className="sp2-field">
                <label>Gender</label>
                <select name="gender" value={student.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Family Information */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaUsers className="sp2-section-icon" />
              <h2>Family Information</h2>
            </div>

            {/* Father */}
            <div className="sp2-subsection">
              <h3>Father's Details</h3>
              <div className="sp2-grid sp2-grid-3">
                <div className="sp2-field">
                  <label>Father's Name</label>
                  <input type="text" name="fatherName" value={student.fatherName} onChange={handleChange} placeholder="Father's full name" />
                </div>
                <div className="sp2-field">
                  <label>Occupation</label>
                  <input type="text" name="fatherOccupation" value={student.fatherOccupation} onChange={handleChange} placeholder="e.g., Engineer, Doctor" />
                </div>
                <div className="sp2-field">
                  <label>Phone Number</label>
                  <input type="text" name="fatherPhone" value={student.fatherPhone} onChange={handleChange} placeholder="10-digit number" maxLength="10" />
                  {student.fatherPhone && student.fatherPhone.length < 10 && <span className="sp2-error">⚠️ 10 digits required</span>}
                </div>
              </div>
            </div>

            {/* Mother */}
            <div className="sp2-subsection">
              <h3>Mother's Details</h3>
              <div className="sp2-grid sp2-grid-3">
                <div className="sp2-field">
                  <label>Mother's Name</label>
                  <input type="text" name="motherName" value={student.motherName} onChange={handleChange} placeholder="Mother's full name" />
                </div>
                <div className="sp2-field">
                  <label>Occupation</label>
                  <input type="text" name="motherOccupation" value={student.motherOccupation} onChange={handleChange} placeholder="e.g., Teacher, Business" />
                </div>
                <div className="sp2-field">
                  <label>Phone Number</label>
                  <input type="text" name="motherPhone" value={student.motherPhone} onChange={handleChange} placeholder="10-digit number" maxLength="10" />
                  {student.motherPhone && student.motherPhone.length < 10 && <span className="sp2-error">⚠️ 10 digits required</span>}
                </div>
              </div>
            </div>

            {/* Guardian - Optional */}
            <div className="sp2-subsection">
              <div className="sp2-checkbox-field">
                <input
                  type="checkbox"
                  checked={student.hasGuardian || false}
                  onChange={(e) => setStudent({ ...student, hasGuardian: e.target.checked })}
                  id="has-guardian"
                />
                <label htmlFor="has-guardian" className="sp2-checkbox-label">I have a different guardian</label>
              </div>

              {student.hasGuardian && (
                <div className="sp2-grid sp2-grid-4">
                  <div className="sp2-field">
                    <label>Guardian's Name</label>
                    <input type="text" name="guardianName" value={student.guardianName} onChange={handleChange} placeholder="Guardian's full name" />
                  </div>
                  <div className="sp2-field">
                    <label>Relationship</label>
                    <input type="text" name="guardianRelationship" value={student.guardianRelationship} onChange={handleChange} placeholder="e.g., Aunt, Uncle" />
                  </div>
                  <div className="sp2-field">
                    <label>Phone Number</label>
                    <input type="text" name="guardianPhone" value={student.guardianPhone} onChange={handleChange} placeholder="10-digit number" maxLength="10" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Education Status */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaGraduationCap className="sp2-section-icon" />
              <h2>Education Status</h2>
            </div>

            <div className="sp2-radio-group">
              <label className="sp2-radio">
                <input type="radio" name="educationStatus" checked={student.currentlyStudying === true} onChange={() => setStudent({ ...student, currentlyStudying: true })} />
                <span>Currently Studying</span>
              </label>
              <label className="sp2-radio">
                <input type="radio" name="educationStatus" checked={student.currentlyStudying === false} onChange={() => setStudent({ ...student, currentlyStudying: false })} />
                <span>Graduated</span>
              </label>
            </div>

            {student.currentlyStudying === true && (
              <div className="sp2-education-section">
                <div className="sp2-grid sp2-grid-3">
                  <div className="sp2-field">
                    <label>Qualification Pursuing</label>
                    <input type="text" name="qualification" value={student.qualification} onChange={handleChange} placeholder="e.g., B.Tech, BA" />
                  </div>
                  <div className="sp2-field">
                    <label>Current Year</label>
                    <select name="yearOfPassing" value={student.yearOfPassing} onChange={handleChange}>
                      <option value="">Select Year</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="sp2-board-section">
                  <label>10th Board</label>
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

            {student.currentlyStudying === false && (
              <div className="sp2-education-section">
                <div className="sp2-grid sp2-grid-2">
                  <div className="sp2-field">
                    <label>Graduation Year</label>
                    <input type="number" name="yearOfPassing" value={student.yearOfPassing} onChange={handleChange} placeholder="e.g., 2023" max="2050" />
                  </div>
                  <div className="sp2-field">
                    <label>Aggregate Percentage</label>
                    <input type="text" name="aggregatePercentage" value={student.aggregatePercentage} onChange={handleChange} placeholder="e.g., 78.5%" />
                  </div>
                </div>

                <div className="sp2-board-section">
                  <label>10th Board</label>
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

                <div className="sp2-board-section">
                  <label>12th Board</label>
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

          {/* Section 4: Aadhar Verification */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaUser className="sp2-section-icon" />
              <h2>Aadhar Verification</h2>
            </div>

            <div className="sp2-grid sp2-grid-2">
              <div className="sp2-field">
                <label>Aadhar Number (12-digit)</label>
                <input type="text" name="aadharNumber" value={student.aadharNumber} onChange={handleChange} placeholder="Enter 12-digit Aadhar" maxLength="12" />
                {student.aadharNumber && student.aadharNumber.length < 12 && <span className="sp2-error">⚠️ 12 digits required</span>}
              </div>
              <div className="sp2-field">
                <label>Full Name (As on Aadhar)</label>
                <input type="text" name="aadharName" value={student.aadharName} onChange={handleChange} placeholder="Your full name from Aadhar" />
                <small>This will be shown as your profile name</small>
              </div>
            </div>

            <DocUploadItem
              label="Aadhar Card (Proof)"
              url={student.aadharCardUrl}
              loading={uploading.aadhar}
              onUpload={(e) => handleFileUpload(e, "aadhar")}
            />
          </div>

          {/* Section 5: Bank Details */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaBank className="sp2-section-icon" />
              <h2>Bank Account Details</h2>
            </div>

            <div className="sp2-subsection">
              <h3>Manual Entry (Required)</h3>
              <div className="sp2-grid sp2-grid-2">
                <div className="sp2-field">
                  <label>Account Holder Name</label>
                  <input type="text" name="bankAccountHolder" value={student.bankAccountHolder} onChange={handleChange} placeholder="Name as per bank account" />
                </div>
                <div className="sp2-field">
                  <label>Bank Name</label>
                  <input type="text" name="bankName" value={student.bankName} onChange={handleChange} placeholder="e.g., HDFC Bank, SBI" />
                </div>
                <div className="sp2-field">
                  <label>Account Number</label>
                  <input type="text" name="bankAccountNumber" value={student.bankAccountNumber} onChange={handleChange} placeholder="Your account number" />
                </div>
                <div className="sp2-field">
                  <label>Account Type</label>
                  <select name="bankAccountType" value={student.bankAccountType} onChange={handleChange}>
                    <option value="">Select Type</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="sp2-field">
                  <label>IFSC Code</label>
                  <input type="text" name="bankIfscCode" value={student.bankIfscCode} onChange={handleChange} placeholder="e.g., HDFC0001234" />
                </div>
              </div>
            </div>

            <div className="sp2-subsection">
              <h3>Upload Bank Passbook (First Page)</h3>
              <p className="sp2-subsection-desc">Upload the first page of your bank passbook for verification</p>
              <DocUploadItem
                label="Bank Passbook First Page"
                url={student.bankPassbookUrl}
                loading={uploading.bankPassbook}
                onUpload={(e) => handleFileUpload(e, "bankPassbook")}
              />
            </div>
          </div>

          {/* Section 6: Address */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaHome className="sp2-section-icon" />
              <h2>Residential Address</h2>
            </div>

            <div className="sp2-grid sp2-grid-1">
              <div className="sp2-field">
                <label>Street Address</label>
                <input type="text" name="address" value={student.address} onChange={handleChange} placeholder="House no, building, street..." />
              </div>
            </div>

            <div className="sp2-grid sp2-grid-4">
              <div className="sp2-field">
                <label>City</label>
                <input type="text" name="city" value={student.city} onChange={handleChange} placeholder="City" />
              </div>
              <div className="sp2-field">
                <label>State</label>
                <input type="text" name="state" value={student.state} onChange={handleChange} placeholder="State" />
              </div>
              <div className="sp2-field">
                <label>Pincode</label>
                <input type="text" name="pincode" value={student.pincode} onChange={handleChange} placeholder="6-digit pincode" />
              </div>
            </div>
          </div>

          {/* Section 7: Additional Documents */}
          <div className="sp2-section">
            <div className="sp2-section-header">
              <FaFileUpload className="sp2-section-icon" />
              <h2>Additional Documents (Optional)</h2>
            </div>

            <DocUploadItem
              label="Resume/CV"
              url={student.resumeUrl}
              loading={uploading.resume}
              onUpload={(e) => handleFileUpload(e, "resume")}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="sp2-footer">
          <button
            className="sp2-save-btn"
            onClick={handleSave}
            disabled={saving || profileStrength < 50}
          >
            {saving ? <><span className="sp2-btn-spinner" /> Saving…</> : `💾 Save Profile (${profileStrength}% Complete)`}
          </button>
          <p className="sp2-footer-note">
            {profileStrength < 50 && "⚠️ Please complete at least 50% of the form"}
            {profileStrength >= 50 && profileStrength < 100 && "📝 Continue filling your profile"}
            {profileStrength === 100 && "✅ Your profile is complete"}
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
        {url && <span className="sp2-doc-badge"><FaCheckCircle /> Uploaded</span>}
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
