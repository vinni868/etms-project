import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop";

function LayoutWrapper() {
  const location = useLocation();

  // Hide layout for ALL dashboard roles
  const hideLayout =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/trainer") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/superadmin") ||
    location.pathname.startsWith("/marketer") ||
    location.pathname.startsWith("/counselor");

  return (
    <>
      <ScrollToTop />
      {!hideLayout && <Navbar />}
      <AppRoutes />
      {!hideLayout && <Footer />}
      <ChatWidget />
    </>
  );
}

function App() {
  return <LayoutWrapper />;
}

export default App;