import { useState } from "react";
import "./TrainerAssignments.css";

function TrainerAssignments() {
  const [course, setCourse] = useState("Java Full Stack");
  const [testType, setTestType] = useState("MCQ");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  // Add New Question
  const addQuestion = () => {
    if (testType === "MCQ") {
      setQuestions([
        ...questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
        },
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          question: "",
          starterCode: "",
        },
      ]);
    }
  };

  // Handle Question Change
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // Handle MCQ Option Change
  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Remove Question
  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  // Save Assignment
  const handleSave = () => {
    const assignmentData = {
      course,
      testType,
      title,
      questions,
    };

    console.log("Saved Assignment:", assignmentData);
    alert("Assignment Created Successfully ✅");
  };

  return (
    <div className="trainer-assignment-container">
      <h2 className="page-title">📝 Create Assignment</h2>

      {/* Top Controls */}
      <div className="assignment-controls">
        <div>
          <label>Select Course:</label>
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            <option>Java Full Stack</option>
            <option>React Development</option>
            <option>Spring Boot</option>
          </select>
        </div>

        <div>
          <label>Test Type:</label>
          <select value={testType} onChange={(e) => {
            setTestType(e.target.value);
            setQuestions([]);
          }}>
            <option value="MCQ">MCQ Test</option>
            <option value="CODING">Coding Test</option>
          </select>
        </div>

        <div>
          <label>Assignment Title:</label>
          <input
            type="text"
            placeholder="Enter Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      {/* Questions Section */}
      <div className="questions-section">
        <h3>Questions</h3>
        <button className="add-btn" onClick={addQuestion}>
          ➕ Add Question
        </button>

        {questions.map((q, index) => (
          <div key={index} className="question-card">
            <div className="question-header">
              <h4>Question {index + 1}</h4>
              <button
                className="delete-btn"
                onClick={() => removeQuestion(index)}
              >
                ❌
              </button>
            </div>

            <textarea
              placeholder="Enter Question"
              value={q.question}
              onChange={(e) =>
                handleQuestionChange(index, "question", e.target.value)
              }
            />

            {testType === "MCQ" ? (
              <>
                {q.options.map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(index, optIndex, e.target.value)
                    }
                  />
                ))}

                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(index, "correctAnswer", e.target.value)
                  }
                />
              </>
            ) : (
              <textarea
                placeholder="Starter Code (Optional)"
                value={q.starterCode}
                onChange={(e) =>
                  handleQuestionChange(index, "starterCode", e.target.value)
                }
              />
            )}
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={handleSave}>
        💾 Save Assignment
      </button>
    </div>
  );
}

export default TrainerAssignments;