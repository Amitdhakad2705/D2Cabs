import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Services from './pages/Services';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Dashboard from './pages/Dashboard';
import ScrollGuard from './components/ScrollGuard';

function NotFound() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Page not found</h1>
      <p><a href="/">Go to the D2Cabs home page</a></p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollGuard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/index.html" element={<Home />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/faq.html" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact.html" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services.html" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/about.html" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy.html" element={<Privacy />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard.html" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
