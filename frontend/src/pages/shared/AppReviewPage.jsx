import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaStar, FaWpforms, FaPaperPlane, FaSmileBeam, FaFrownOpen } from 'react-icons/fa';
import './AppReviewPage.css';

const AppReviewPage = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};

  // Provide realistic fallbacks strictly for visual consistency
  const displayName = user?.name || "Verified User";
  const displayEmail = user?.email || "user@apptechno.com";
  const displayId = user?.portalId || user?.studentId || (user?.id ? `ID-${user.id}` : "Global-ID");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError("Please select a rating before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      await api.post("/app-reviews", {
        userId: user?.id,
        rating: rating,
        feedback: feedback
      });
      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to submit review. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formPrompt = rating >= 5 
    ? "Awesome! Everything is good. Please share your experience with us:" 
    : "How can we improvise our platform to serve you better?";

  if (submitSuccess) {
    return (
      <div className="review-page-wrapper">
        <div className="review-success-card">
          <div className="success-icon-wrapper">
            <FaSmileBeam className="success-emoji" />
          </div>
          <h2>Thank You!</h2>
          <p>Your feedback has been successfully submitted and sent directly to our administrative team.</p>
          <button className="review-btn-primary mt-4" onClick={() => setSubmitSuccess(false)}>
            Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page-wrapper">
      <div className="review-header">
        <h1>Platform Experience Review</h1>
        <p>Your feedback directly shapes the future of AppTechno Careers.</p>
      </div>

      <div className="review-content-grid">
        {/* User Identity Ghost Card */}
        <div className="review-identity-card">
          <div className="identity-header">
            <FaWpforms /> Reviewer Identity
          </div>
          <div className="identity-body">
            <div className="identity-field">
              <label>Full Name</label>
              <div className="identity-value">{displayName}</div>
            </div>
            <div className="identity-field">
              <label>Email Address</label>
              <div className="identity-value">{displayEmail}</div>
            </div>
            <div className="identity-field">
              <label>System ID</label>
              <div className="identity-value">{displayId}</div>
            </div>
          </div>
          <div className="identity-footer">
            * This information is securely tied to your feedback to ensure authenticity and rapid support.
          </div>
        </div>

        {/* Dynamic Form Area */}
        <div className="review-interactive-card">
          <form onSubmit={handleSubmit} className="review-form">
            
            <div className="star-rating-section">
              <label className="section-label">Overall Rating</label>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    size={42}
                    className={`rating-star ${(hoverRating || rating) >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <div className="rating-text">
                {rating === 5 && <span className="rating-desc superb">Excellent Platform</span>}
                {rating === 4 && <span className="rating-desc good">Great, but needs minor tweaks</span>}
                {rating === 3 && <span className="rating-desc average">Average Experience</span>}
                {rating === 2 && <span className="rating-desc poor">Below Expectations</span>}
                {rating === 1 && <span className="rating-desc terrible">Needs Immediate Improvement</span>}
              </div>
            </div>

            {rating > 0 && (
              <div className="feedback-section fade-in">
                <label className="section-label">
                  {rating >= 5 ? <FaSmileBeam className="inline-icon text-green-500" /> : <FaFrownOpen className="inline-icon text-amber-500" />}
                  {formPrompt}
                </label>
                <textarea
                  className="feedback-textarea"
                  rows="5"
                  placeholder="Type your detailed feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                ></textarea>
              </div>
            )}

            {submitError && <div className="review-error-msg">{submitError}</div>}

            <button 
              type="submit" 
              className={`review-submit-btn ${rating === 0 ? 'disabled' : ''}`}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? <span className="loader-spin"></span> : <><FaPaperPlane /> Submit Secure Review</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppReviewPage;
