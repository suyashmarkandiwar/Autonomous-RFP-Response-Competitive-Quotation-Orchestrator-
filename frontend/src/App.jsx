import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UploadRFP from './pages/UploadRFP';
import ReviewQuotation from './pages/ReviewQuotation';
import PreviewPDF from './pages/PreviewPDF';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — redirect to /login if not authenticated */}
      <Route path="/upload" element={<PrivateRoute><UploadRFP /></PrivateRoute>} />
      <Route path="/review" element={<PrivateRoute><ReviewQuotation /></PrivateRoute>} />
      <Route path="/preview/:quoteId" element={<PrivateRoute><PreviewPDF /></PrivateRoute>} />
    </Routes>
  );
}

export default App;