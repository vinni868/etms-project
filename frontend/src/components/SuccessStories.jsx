import React from 'react';
import { FaQuoteLeft, FaCheckCircle, FaStar } from 'react-icons/fa';
import './SuccessStories.css';

const testimonials = [
  {
    name: "Vyshnavi",
    course: "Full Stack Java",
    text: "The trainers explained every concept step by step with real projects. The Full Stack Java course made me confident in coding. Best part—affordable fees and I got placed within 2 months.",
    img: "https://i.pravatar.cc/150?u=vyshnavi"
  },
  {
    name: "Bhupathi Raja",
    course: "Software Testing",
    text: "I joined the Software Testing program and the mock interviews helped a lot. The pricing was flexible with pay-after-placement option. Thanks to their support, I cleared my first interview.",
    img: "https://i.pravatar.cc/150?u=bhupathi"
  },
  {
    name: "Pratibha",
    course: "Python full stack",
    text: "The Python full stack course was very practical and industry-oriented. Trainers gave personal attention whenever I was stuck. Today I'm working in an IT company with their placement support.",
    img: "https://i.pravatar.cc/150?u=pratibha"
  },
  {
    name: "Sabeer",
    course: "MERN Stack",
    text: "I loved the MERN Stack training—it was fully project-based. The course fee was reasonable compared to others. They kept arranging interviews until I got selected.",
    img: "https://i.pravatar.cc/150?u=sabeer"
  },
  {
    name: "Usha",
    course: "Data Analytics",
    text: "The Data Analytics course gave me hands-on practice with SQL and Power BI. The trainers made complex topics very simple. Placement team helped me land my first analyst role.",
    img: "https://i.pravatar.cc/150?u=usha"
  },
  {
    name: "Shivam",
    course: "Software Engineering",
    text: "The teaching style is practical, not just theory. Courses are updated as per 2024 industry needs. Thanks to unlimited interviews, I secured a great job even as a fresher.",
    img: "https://i.pravatar.cc/150?u=shivam"
  }
];

const SuccessStories = () => {
  return (
    <section className="success-stories">
      <div className="container">
        <div className="section-header text-center">
          <span className="sub-tag">REAL RESULTS</span>
          <h2 className="section-heading">Real Testimonials from Real Students</h2>
          <p className="section-subheading">Hear from our students who have successfully transitioned to IT careers.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div className="testimonial-card" key={idx}>
              <div className="card-top">
                <FaQuoteLeft className="quote-icon" />
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
              </div>
              <p className="testimonial-text">{t.text}</p>
              <div className="student-profile">
                <img src={t.img} alt={t.name} className="student-img" />
                <div className="student-info">
                  <h4>{t.name}</h4>
                  <p className="student-course"><FaCheckCircle className="check-icon" /> {t.course}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
