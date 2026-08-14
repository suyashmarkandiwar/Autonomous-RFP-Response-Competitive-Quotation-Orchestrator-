import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UploadRFP from './pages/UploadRFP';
import ReviewQuotation from './pages/ReviewQuotation';
import PreviewPDF from './pages/PreviewPDF';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/upload" element={<UploadRFP />} />

        {/* New route for the review section */}
        <Route path="/review" element={<ReviewQuotation />} />
        
        {/* PDF Preview and Download Route */}
        <Route path="/preview/:quoteId" element={<PreviewPDF />} />
      </Routes>
    </Router>
  );
}

export default App;