/**
 * Decorative 3D-style wireless mouse for the home hero (pure SVG, no assets or libraries).
 * Depth comes from a darker side wall under the top shell, layered gradients,
 * a specular highlight and a soft ground shadow.
 */
const BODY = "M100 14 C146 14 168 52 170 110 C172 170 160 232 100 244 C40 232 28 170 30 110 C32 52 54 14 100 14 Z";

export default function HeroMouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 280" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hm-shell" cx="35%" cy="22%" r="85%">
          <stop offset="0%" stopColor="#6b6f79" />
          <stop offset="38%" stopColor="#474a52" />
          <stop offset="78%" stopColor="#2b2d33" />
          <stop offset="100%" stopColor="#1d1e22" />
        </radialGradient>
        <linearGradient id="hm-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#141518" />
          <stop offset="45%" stopColor="#2a2c31" />
          <stop offset="100%" stopColor="#0f1012" />
        </linearGradient>
        <linearGradient id="hm-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hm-wheel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1b1f" />
          <stop offset="40%" stopColor="#8d919b" />
          <stop offset="60%" stopColor="#c9ccd3" />
          <stop offset="100%" stopColor="#2a2c31" />
        </linearGradient>
        <pattern id="hm-ridges" width="16" height="3" patternUnits="userSpaceOnUse">
          <rect width="16" height="1.2" fill="#000" opacity="0.35" />
        </pattern>
        <radialGradient id="hm-gloss" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="hm-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="hm-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="hm-clip"><path d={BODY} /></clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="110" cy="252" rx="72" ry="16" fill="#1b1c12" opacity="0.28" filter="url(#hm-blur)" />
      <ellipse cx="104" cy="246" rx="52" ry="8" fill="#1b1c12" opacity="0.3" filter="url(#hm-soft)" />

      {/* side wall (thickness) */}
      <path d={BODY} transform="translate(0 12)" fill="url(#hm-wall)" />

      {/* top shell */}
      <path d={BODY} fill="url(#hm-shell)" />

      <g clipPath="url(#hm-clip)">
        {/* button split and palm seam */}
        <path d="M100 14 L100 104" stroke="#111215" strokeWidth="1.6" />
        <path d="M100 14 L100 104" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" transform="translate(1.4 0)" />
        <path d="M28 98 Q100 122 172 98" fill="none" stroke="#111215" strokeWidth="1.6" />
        <path d="M28 100 Q100 124 172 100" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

        {/* specular highlights */}
        <ellipse cx="72" cy="66" rx="34" ry="46" fill="url(#hm-gloss)" transform="rotate(-18 72 66)" />
        <ellipse cx="128" cy="170" rx="30" ry="50" fill="#ffffff" opacity="0.06" filter="url(#hm-blur)" />
        {/* edge falloff on the right for roundness */}
        <path d={BODY} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="14" transform="translate(6 4)" filter="url(#hm-soft)" />
      </g>

      {/* rim light */}
      <path d={BODY} fill="none" stroke="url(#hm-rim)" strokeWidth="1.5" />

      {/* scroll wheel */}
      <rect x="90" y="36" width="20" height="46" rx="10" fill="#0e0f11" />
      <rect x="93" y="40" width="14" height="38" rx="7" fill="url(#hm-wheel)" />
      <rect x="93" y="40" width="14" height="38" rx="7" fill="url(#hm-ridges)" />
      <rect x="95" y="42" width="4" height="16" rx="2" fill="#ffffff" opacity="0.35" />

      {/* status LED */}
      <circle cx="100" cy="132" r="2.2" fill="#c7f464" />
      <circle cx="100" cy="132" r="5" fill="#c7f464" opacity="0.25" filter="url(#hm-soft)" />
    </svg>
  );
}
