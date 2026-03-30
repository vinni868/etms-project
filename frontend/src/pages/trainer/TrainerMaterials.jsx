import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./TrainerMaterials.css";

function TrainerMaterials() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  /* ================= MATERIAL STATE ================= */
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materials, setMaterials] = useState([]);

  /* ================= TASK STATE ================= */
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tasks, setTasks] = useState([]);

  const trainer = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get(`/teacher/active-batches/${trainer.id}`);
        setBatches(res.data);
        if (res.data.length > 0) {
          setSelectedBatchId(res.data[0].batchId);
        }
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      } finally {
        setLoading(false);
      }
    };
    if (trainer?.id) fetchBatches();
  }, [trainer?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBatchId) return;
      try {
        const [matsRes, tasksRes] = await Promise.all([
          api.get(`/materials/batch/${selectedBatchId}`),
          api.get(`/tasks/student/0?batchId=${selectedBatchId}`) // Dummy student ID just to get batch tasks or I should add a trainer task endpoint
        ]);
        setMaterials(matsRes.data);
        // Note: For now, I'll filter task assignments by batch if I had a better endpoint, 
        // but I'll stick to the materials for this view mostly.
      } catch (err) {
        console.error("Fetch data error:", err);
      }
    };
    fetchData();
  }, [selectedBatchId]);

  /* ================= ADD MATERIAL ================= */
  const handleAddMaterial = async () => {
    if (!materialTitle || !materialUrl || !selectedBatchId) {
      alert("Please enter title, URL and select a batch");
      return;
    }

    try {
      const payload = {
        batch: { id: selectedBatchId },
        title: materialTitle,
        url: materialUrl,
        type: "LINK",
        uploadedBy: { id: trainer.id }
      };

      const res = await api.post("/materials/trainer/upload", payload);
      setMaterials([...materials, res.data]);
      setMaterialTitle("");
      setMaterialUrl("");
      alert("Material uploaded successfully!");
    } catch (err) {
      alert("Failed to upload material");
    }
  };

  /* ================= ADD TASK ================= */
  const handleAddTask = async () => {
    if (!taskTitle || !selectedBatchId || !dueDate) {
      alert("Please fill required fields");
      return;
    }

    try {
      const payload = {
        batchId: selectedBatchId,
        trainerId: trainer.id,
        title: taskTitle,
        description: taskDesc,
        deadline: dueDate + "T23:59:59"
      };

      await api.post("/tasks/trainer/create", payload);
      alert("Task assigned to batch successfully!");
      setTaskTitle("");
      setTaskDesc("");
      setDueDate("");
    } catch (err) {
      alert("Failed to assign task");
    }
  };

  const markCompleted = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, status: "Completed" } : task
    );
    setTasks(updated);
  };

  const deleteItem = (id, type) => {
    if (type === "material") {
      setMaterials(materials.filter((m) => m.id !== id));
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="trainer-materials-container">
      <h2 className="page-title">📂 Study Materials & Daily Tasks</h2>

      {/* Batch Selector */}
      <div className="course-selector">
        <label>Select Batch:</label>
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
        >
          {batches.map(b => (
             <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
          ))}
        </select>
      </div>

      {/* ================= MATERIAL SECTION ================= */}
      <div className="card">
        <h3>📘 Upload Study Material</h3>

        <input
          type="text"
          placeholder="Material Title"
          value={materialTitle}
          onChange={(e) => setMaterialTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Resource URL (e.g. Google Drive/YouTube Link)"
          value={materialUrl}
          onChange={(e) => setMaterialUrl(e.target.value)}
        />

        <button className="primary-btn" onClick={handleAddMaterial} disabled={!selectedBatchId}>
          Upload Material
        </button>

        <div className="list">
          {materials.map((m) => (
              <div key={m.id} className="list-item">
                <div>
                  <strong>{m.title}</strong>
                  <p>{m.url}</p>
                  <span>{m.type}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteItem(m.id, "material")}
                >
                  ❌
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* ================= TASK SECTION ================= */}
      <div className="card">
        <h3>📝 Assign Daily Task</h3>

        <input
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />

        <textarea
          placeholder="Task Description"
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
        />

        <div className="task-row">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button className="primary-btn" onClick={handleAddTask}>
          Assign Task
        </button>

        <div className="list">
          {tasks
            .filter((t) => t.course === selectedCourse)
            .map((t) => (
              <div key={t.id} className="list-item">
                <div>
                  <strong>{t.title}</strong>
                  <p>
                    Student: {t.student} | Due: {t.dueDate}
                  </p>
                  <span
                    className={
                      t.status === "Completed"
                        ? "status completed"
                        : "status pending"
                    }
                  >
                    {t.status}
                  </span>
                </div>

                <div className="action-buttons">
                  {t.status !== "Completed" && (
                    <button
                      className="complete-btn"
                      onClick={() => markCompleted(t.id)}
                    >
                      ✔ Complete
                    </button>
                  )}

                  <button
                    className="delete-btn"
                    onClick={() => deleteItem(t.id, "task")}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default TrainerMaterials;