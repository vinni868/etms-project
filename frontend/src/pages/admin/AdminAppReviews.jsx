import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import "./AdminAppReviews.css";

const AdminAppReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get("/app-reviews");
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} className={`admin-star ${i < rating ? 'active' : ''}`} />
    ));
  };

  if (loading) return <div className="loader-container"><span className="loader-spin"></span></div>;

  return (
    <div className="admin-reviews-wrapper">
      <div className="admin-reviews-header">
        <h1>Platform Reviews</h1>
        <p>Monitor user feedback and platform experience scores.</p>
        
        <div className="stats-bar">
          <div className="stat-card">
            <h3>Total Reviews</h3>
            <span>{reviews.length}</span>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <span>
              {reviews.length ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 0}
              <FaStar className="inline-star active" />
            </span>
          </div>
        </div>
      </div>

      <div className="reviews-grid">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="review-display-card">
              <div className="review-card-head">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.userName}</span>
                    <span className="reviewer-role">{review.userRole}</span>
                  </div>
                </div>
                <div className="review-card-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="review-card-body">
                <FaQuoteLeft className="quote-icon"/>
                <p>{review.feedback}</p>
              </div>
              <div className="review-card-footer">
                <span className="review-email">{review.userEmail}</span>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-reviews">No reviews collected yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminAppReviews;
