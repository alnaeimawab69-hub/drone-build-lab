import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Lab from './pages/Lab.jsx';
import './styles/lab.css';

createRoot(document.getElementById('root')).render(<StrictMode><Lab /></StrictMode>);

/* the engine holds on to the page's elements and WebGL context, so code changes reload the page instead of hot-swapping */
if (import.meta.hot) import.meta.hot.on('vite:beforeUpdate', () => location.reload());
