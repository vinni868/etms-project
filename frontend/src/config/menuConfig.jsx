import { 
  FaShieldAlt, FaUsers, FaUniversity, FaClipboardList, 
  FaChartBar, FaCogs, FaUserTie, FaChalkboardTeacher,
  FaBook, FaCalendarAlt, FaMoneyBillWave, FaBullhorn,
  FaBriefcase, FaIdCard, FaQrcode, FaHistory,
  FaFileInvoiceDollar, FaUserCheck, FaMapMarkerAlt,
  FaGraduationCap, FaCertificate, FaHandHoldingHeart,
  FaRocket, FaUserShield, FaBell, FaPlusSquare
} from 'react-icons/fa';

export const MENU_CONFIG = {
  SUPERADMIN: {
    basePath: '/superadmin',
    hubs: [
      {
        title: 'Governance',
        icon: <FaShieldAlt />,
        links: [
          { label: 'Admin Desk', path: 'dashboard', icon: <FaUserShield /> },
          { label: 'Provisioning', path: 'create-admin', icon: <FaUserTie /> }
        ]
      },
      {
        title: 'Registry',
        icon: <FaUsers />,
        links: [
          { label: 'Global Directory', path: 'users', icon: <FaUsers /> },
          { label: 'New User', path: 'create-user', icon: <FaUserTie /> }
        ]
      },
      {
        title: 'Operations',
        icon: <FaClipboardList />,
        links: [
          { label: 'Finance Ledger', path: 'finance', icon: <FaMoneyBillWave /> },
          { label: 'Attendance Board', path: 'attendance-report', icon: <FaUserCheck /> },
          { label: 'Leave Board', path: 'leave', icon: <FaClipboardList /> }
        ]
      },
      {
        title: 'Intelligence',
        icon: <FaChartBar />,
        links: [
          { label: 'Performance', path: 'performance', icon: <FaChartBar /> },
          { label: 'Strategy Room', path: 'messages', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'System',
        icon: <FaCogs />,
        links: [
          { label: 'QR Station', path: 'qr-station', icon: <FaQrcode /> },
          { label: 'Core Settings', path: 'settings', icon: <FaCogs /> },
          { label: 'Notifications', path: 'notifications', icon: <FaBell /> }
        ]
      }
    ]
  },
  ADMIN: {
    basePath: '/admin',
    hubs: [
      {
        title: 'Registry Hub',
        icon: <FaUsers />,
        links: [
          { label: 'Students', path: 'students', icon: <FaUsers /> },
          { label: 'Trainers', path: 'trainers', icon: <FaChalkboardTeacher /> },
          { label: 'Provisioning', path: 'create-user', icon: <FaUserTie /> }
        ]
      },
      {
        title: 'Academic Hub',
        icon: <FaUniversity />,
        links: [
          { label: 'Course Catalog', path: 'courses', icon: <FaBook /> },
          { label: 'New Course', path: 'create-course', icon: <FaPlusSquare /> },
          { label: 'Batch Control', path: 'create-batch', icon: <FaCalendarAlt /> },
          { label: 'Class Scheduler', path: 'schedule-class', icon: <FaHistory /> },
          { label: 'Student Mapping', path: 'student-allotment', icon: <FaUserCheck /> }
        ]
      },
      {
        title: 'Operations',
        icon: <FaClipboardList />,
        links: [
          { label: 'Attendance', path: 'attendance', icon: <FaUserCheck /> },
          { label: 'Leaves', path: 'leave', icon: <FaClipboardList /> },
          { label: 'Finance', path: 'fees', icon: <FaMoneyBillWave /> },
          { label: 'Bulletins', path: 'announcements', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'Career Hub',
        icon: <FaBriefcase />,
        links: [
          { label: 'Post Opportunity', path: 'post-job', icon: <FaRocket /> },
          { label: 'Manage Listings', path: 'manage-jobs', icon: <FaBriefcase /> },
          { label: 'Company Partners', path: 'company-partners', icon: <FaUniversity /> }
        ]
      },
      {
        title: 'Terminal',
        icon: <FaQrcode />,
        links: [
          { label: 'QR Station', path: 'qr-station', icon: <FaQrcode /> },
          { label: 'ID Control', path: 'id-management', icon: <FaIdCard /> },
          { label: 'System Check-in', path: 'time-tracking', icon: <FaHistory /> }
        ]
      }
    ]
  },
  STUDENT: {
    basePath: '/student',
    hubs: [
      {
        title: 'Learning Hub',
        icon: <FaGraduationCap />,
        links: [
          { label: 'My Dashboard', path: 'dashboard', icon: <FaChartBar /> },
          { label: 'Curriculum', path: 'courses', icon: <FaBook /> },
          { label: 'Timetable', path: 'timetable', icon: <FaCalendarAlt /> },
          { label: 'Bulletins', path: 'announcements', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'Operations',
        icon: <FaClipboardList />,
        links: [
          { label: 'Punch Portal', path: 'attendance', icon: <FaUserCheck /> },
          { label: 'Time Audit', path: 'time-tracking', icon: <FaHistory /> },
          { label: 'Absence Portal', path: 'leave', icon: <FaClipboardList /> }
        ]
      },
      {
        title: 'Progress',
        icon: <FaChartBar />,
        links: [
          { label: 'Analytics', path: 'performance', icon: <FaChartBar /> },
          { label: 'Achievements', path: 'certificates', icon: <FaCertificate /> },
          { label: 'Fees & Dues', path: 'fees', icon: <FaMoneyBillWave /> }
        ]
      },
      {
        title: 'Career Hub',
        icon: <FaRocket />,
        links: [
          { label: 'Job Board', path: 'jobs', icon: <FaBriefcase /> },
          { label: 'Internships', path: 'internships', icon: <FaRocket /> },
          { label: 'Wellness Check', path: 'counseling', icon: <FaHandHoldingHeart /> }
        ]
      }
    ]
  },
  TRAINER: {
    basePath: '/trainer',
    hubs: [
      {
        title: 'Faculty Hub',
        icon: <FaChalkboardTeacher />,
        links: [
          { label: 'Dashboard', path: 'dashboard', icon: <FaChartBar /> },
          { label: 'My Batches', path: 'course', icon: <FaBook /> },
          { label: 'Staff Timetable', path: 'timetable', icon: <FaCalendarAlt /> }
        ]
      },
      {
        title: 'Performance',
        icon: <FaChartBar />,
        links: [
          { label: 'Metrics', path: 'performance', icon: <FaChartBar /> },
          { label: 'Attendance', path: 'attendance', icon: <FaUserCheck /> },
          { label: 'Announcements', path: 'announcements', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'Support',
        icon: <FaHandHoldingHeart />,
        links: [
          { label: 'Leaves', path: 'leave', icon: <FaClipboardList /> },
          { label: 'Time Tracking', path: 'time-tracking', icon: <FaHistory /> },
          { label: 'Profile Settings', path: 'profile', icon: <FaUserTie /> }
        ]
      }
    ]
  },
  MARKETER: {
    basePath: '/marketer',
    hubs: [
      {
        title: 'Strategy Hub',
        icon: <FaRocket />,
        links: [
          { label: 'Engagement', path: 'dashboard', icon: <FaChartBar /> },
          { label: 'Lead CRM', path: 'leads', icon: <FaUsers /> },
          { label: 'Campaigns', path: 'campaigns', icon: <FaBullhorn /> },
          { label: 'Bulletins', path: 'announcements', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'Support',
        icon: <FaHandHoldingHeart />,
        links: [
          { label: 'Leave Request', path: 'leave', icon: <FaClipboardList /> },
          { label: 'Time Tracking', path: 'time-tracking', icon: <FaHistory /> }
        ]
      }
    ]
  },
  COUNSELOR: {
    basePath: '/counselor',
    hubs: [
      {
        title: 'Wellness Hub',
        icon: <FaHandHoldingHeart />,
        links: [
          { label: 'Case Load', path: 'dashboard', icon: <FaChartBar /> },
          { label: 'Schedules', path: 'sessions', icon: <FaCalendarAlt /> },
          { label: 'Student Logs', path: 'messages', icon: <FaBullhorn /> },
          { label: 'Bulletins', path: 'announcements', icon: <FaBullhorn /> }
        ]
      },
      {
        title: 'Support',
        icon: <FaHandHoldingHeart />,
        links: [
          { label: 'Leave Request', path: 'leave', icon: <FaClipboardList /> },
          { label: 'Time Tracking', path: 'time-tracking', icon: <FaHistory /> }
        ]
      }
    ]
  }
};
