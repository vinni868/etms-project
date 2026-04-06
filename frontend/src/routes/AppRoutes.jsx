import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import GoogleSignup from "../pages/auth/GoogleSignup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ResetPassword from "../pages/auth/ResetPassword";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

/* ================= SHARED MODULES ================= */
import UserTimeTracking from "../pages/auth/UserTimeTracking";
import AppReviewPage from "../pages/shared/AppReviewPage";
import AdminAppReviews from "../pages/admin/AdminAppReviews";

/* ================= COURSES ================= */
import JavaCoursePage from "../pages/courses/JavaCoursePage";
import AboutUs from "../pages/AboutUs";

/* ================= SUPER ADMIN ================= */
import SuperAdminDashboard from "../pages/superadmin/SuperAdminDashboard";
import FinanceManagement from "../pages/superadmin/FinanceManagement";
import MessagingHub from "../pages/superadmin/MessagingHub";
import SuperAdminProfile from "../pages/superadmin/SuperAdminProfile";
import UserManagement from "../pages/superadmin/UserManagement";
import CreateUser from "../pages/superadmin/CreateUser";
import PerformanceDashboard from "../pages/superadmin/PerformanceDashboard";
import SuperAdminSettings from "../pages/superadmin/SuperAdminSettings";
import SuperAdminAttendanceReport from "../pages/superadmin/SuperAdminAttendanceReport";

/* ================= STUDENT ================= */
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentCourses from "../pages/student/StudentCourses";
import StudentCourseDetails from "../pages/student/StudentCourseDetails";
import StudentAttendance from "../pages/student/StudentAttendance";
import StudentTimetable from "../pages/student/StudentTimetable";
import StudentAnnouncements from "../pages/student/StudentAnnouncements";
import StudentPerformance from "../pages/student/StudentPerformance";
import StudentCertificates from "../pages/student/StudentCertificates";
import StudentProfile from "../pages/student/StudentProfile";
import StudentJobs from "../pages/student/StudentJobs";
import StudentInternships from "../pages/student/StudentInternships";
import StudentFees from "../pages/student/StudentFees";
import StudentLeaves from "../pages/student/StudentLeaves";
import StudentCounseling from "../pages/student/StudentCounseling";
import MyApplications from "../pages/student/MyApplications";


/* ================= TRAINER ================= */
import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import TrainerProfile from "../pages/trainer/TrainerProfile";
import TrainerCourses from "../pages/trainer/TrainerCourses";

import TrainerAttendance from "../pages/trainer/TrainerAttendance";
import TrainerTimetable from "../pages/trainer/TrainerTimetable";
import TrainerPerformance from "../pages/trainer/TrainerPerformance";
import TrainerAnnouncements from "../pages/trainer/TrainerAnnouncements";
import TrainerLeaves from "../pages/trainer/TrainerLeaves";

/* ================= ADMIN ================= */
import AdminDashboard from "../pages/admin/AdminDashboard";
import CreateCourse from "../pages/admin/CreateCourse";

import AllCourses from "../pages/admin/AllCourses";
import CourseDetails from "../pages/admin/CourseDetails";
import CreateBatch from "../pages/admin/CreateBatch";
import ScheduleClass from "../pages/admin/AdminScheduleClass";
import ManageStudents from "../pages/admin/ManageStudents";
import ManageTrainers from "../pages/admin/ManageTrainers";
import AdminProfile from "../pages/admin/AdminProfile";
import StudentMapping from "../pages/admin/StudentMapping";
import AdminAttendance from "../pages/admin/AdminAttendance";
import AdminIdManagement from "../pages/admin/AdminIdManagement";
import AdminCreateUser from "../pages/admin/CreateUser";
import QrDisplayPage from "../pages/admin/QrDisplayPage";
import AdminFees from "../pages/admin/AdminFees";
import AdminAnnouncements from "../pages/admin/AdminAnnouncements";
import AdminLeaves from "../pages/admin/AdminLeaves";
import PostJob from "../pages/admin/PostJob";
import ManageJobs from "../pages/admin/ManageJobs";
import NotificationsPage from "../pages/admin/NotificationsPage";

/* ================= MARKETER ================= */
import MarketerDashboard from "../pages/marketer/MarketerDashboard";
import Leads from "../pages/marketer/Leads";

/* ================= COUNSELOR ================= */
import CounselorDashboard from "../pages/counselor/CounselorDashboard";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/java-training-bangalore" element={<JavaCoursePage />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/login" element={<Login />} />
      {/* /signup = Google chooser page; /register = the actual form */}
      <Route path="/signup" element={<GoogleSignup />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ================= STUDENT ================= */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"    element={<StudentDashboard />} />
        <Route path="courses"      element={<StudentCourses />} />
        <Route path="course/:id"   element={<StudentCourseDetails />} />
        <Route path="attendance"   element={<StudentAttendance />} />
        <Route path="time-tracking" element={<UserTimeTracking />} />
        <Route path="timetable"    element={<StudentTimetable />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="performance"  element={<StudentPerformance />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="profile"      element={<StudentProfile />} />
        <Route path="fees"         element={<StudentFees />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="leave"        element={<StudentLeaves />} />
        <Route path="counseling"   element={<StudentCounseling />} />
        <Route path="app-review"   element={<AppReviewPage />} />
        {/* ── Career Hub Routes ── */}


        <Route path="jobs"         element={<StudentJobs />} />
        <Route path="internships"  element={<StudentInternships />} />
      </Route>

      {/* ================= TRAINER ================= */}
      <Route
        path="/trainer/*"
        element={
          <ProtectedRoute allowedRoles={["TRAINER"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"       element={<TrainerDashboard />} />
        <Route path="profile"         element={<TrainerProfile />} />
        <Route path="course"          element={<TrainerCourses />} />

        <Route path="attendance"      element={<TrainerAttendance />} />
        <Route path="time-tracking"   element={<UserTimeTracking />} />
        <Route path="timetable"       element={<TrainerTimetable />} />
        <Route path="performance"     element={<TrainerPerformance />} />
        <Route path="announcements"   element={<TrainerAnnouncements />} />
        <Route path="notifications"   element={<NotificationsPage />} />
        <Route path="leave"           element={<TrainerLeaves />} />
        <Route path="app-review"      element={<AppReviewPage />} />
      </Route>

      {/* ================= SUPER ADMIN ================= */}
      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"         element={<SuperAdminDashboard />} />
        <Route path="finance"           element={<FinanceManagement />} />
        <Route path="messages"          element={<MessagingHub />} />
        <Route path="profile"           element={<SuperAdminProfile />} />
        <Route path="users"             element={<UserManagement />} />
        <Route path="create-user"       element={<CreateUser />} />
        <Route path="performance"       element={<PerformanceDashboard />} />
        <Route path="meetings"          element={<MessagingHub />} />
        <Route path="settings"          element={<SuperAdminSettings />} />
        <Route path="qr-station"        element={<QrDisplayPage />} />
        <Route path="attendance-report" element={<SuperAdminAttendanceReport />} />
        <Route path="announcements"     element={<AdminAnnouncements />} />
        <Route path="leave"             element={<AdminLeaves />} />
        <Route path="notifications"     element={<NotificationsPage />} />
        <Route path="app-review"        element={<AppReviewPage />} />
        <Route path="reviews"           element={<AdminAppReviews />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"      element={<AdminDashboard />} />
        <Route path="create-user"    element={<AdminCreateUser />} />
        <Route path="create-course"  element={<CreateCourse />} />
      
        <Route path="courses"        element={<AllCourses />} />
        <Route path="course-details/:id" element={<CourseDetails />} />
        <Route path="create-batch"   element={<CreateBatch />} />
        <Route path="schedule-class" element={<ScheduleClass />} />
        <Route path="students"       element={<ManageStudents />} />
        <Route path="trainers"       element={<ManageTrainers />} />
        <Route path="student-allotment" element={<StudentMapping />} />
        <Route path="attendance"     element={<AdminAttendance />} />
        <Route path="time-tracking"  element={<UserTimeTracking />} />
        <Route path="qr-station"     element={<QrDisplayPage />} />
        <Route path="id-management"  element={<AdminIdManagement />} />
        <Route path="fees"           element={<AdminFees />} />
        <Route path="announcements"  element={<AdminAnnouncements />} />
        <Route path="profile"        element={<AdminProfile />} />
        <Route path="leave"          element={<AdminLeaves />} />
        <Route path="my-leave"       element={<TrainerLeaves />} />
        <Route path="notifications"  element={<NotificationsPage />} />
        <Route path="app-review"     element={<AppReviewPage />} />
        <Route path="reviews"        element={<AdminAppReviews />} />
        
        {/* Career Hub */}
        <Route path="post-job"           element={<PostJob />} />
        <Route path="manage-jobs"        element={<ManageJobs />} />
        <Route path="post-internship"    element={<PostJob />} /> {/* Reusing PostJob for internships */}
        <Route path="job-applications"   element={<ManageJobs />} /> {/* Reusing ManageJobs since it has the modal built-in */}
        <Route path="company-partners"   element={<div style={{padding:'20px'}}><h3>Industry Partners</h3><p>Coming Soon</p></div>} />
        <Route path="placement-stats"    element={<div style={{padding:'20px'}}><h3>Placement CRM</h3><p>Coming Soon</p></div>} />
      </Route>



      {/* ================= MARKETER ================= */}
      <Route
        path="/marketer/*"
        element={
          <ProtectedRoute allowedRoles={["MARKETER"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"    element={<MarketerDashboard />} />
        <Route path="leads"        element={<Leads />} />
        <Route path="time-tracking" element={<UserTimeTracking />} />
        <Route path="performance"  element={<MarketerDashboard />} />
        <Route path="profile"      element={<MarketerDashboard />} />
        
        {/* Marketing Hub Placeholders */}
        <Route path="campaigns"    element={<div style={{padding:'20px'}}><h3>Campaigns</h3><p>Coming Soon</p></div>} />
        <Route path="vouchers"     element={<div style={{padding:'20px'}}><h3>Vouchers</h3><p>Coming Soon</p></div>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="leave"        element={<TrainerLeaves />} />
        <Route path="app-review"   element={<AppReviewPage />} />
      </Route>


      {/* ================= COUNSELOR ================= */}
      <Route
        path="/counselor/*"
        element={
          <ProtectedRoute allowedRoles={["COUNSELOR"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<CounselorDashboard />} />
        <Route path="sessions"  element={<CounselorDashboard />} />
        <Route path="time-tracking" element={<UserTimeTracking />} />
        <Route path="messages"      element={<CounselorDashboard />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="leave"         element={<TrainerLeaves />} />
        <Route path="app-review"    element={<AppReviewPage />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<h2 style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>404 — Page Not Found</h2>} />


    </Routes>
  );
}
