import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Guide from './pages/Guide.jsx';
import './styles/site.css';

createRoot(document.getElementById('root')).render(<StrictMode><Guide /></StrictMode>);
