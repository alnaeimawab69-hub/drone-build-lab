/* Drone Build Lab mark: an X frame with four motors and the stack in the middle */
export default function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g fill="none" stroke="#e0894a" strokeWidth="2.2" strokeLinecap="round"><path d="M9 9l14 14M23 9L9 23" /></g>
      <g fill="#141c20" stroke="#e3eaed" strokeWidth="1.6">
        <circle cx="7" cy="7" r="4" /><circle cx="25" cy="7" r="4" /><circle cx="7" cy="25" r="4" /><circle cx="25" cy="25" r="4" />
      </g>
      <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="#e0894a" />
    </svg>
  );
}
