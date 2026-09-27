// Small hand-written line-icon set used across the dashboard, so we don't
// depend on an emoji font (renders inconsistently across devices) or pull
// in an icon library the project doesn't already have installed.
// Every icon is a plain 24x24 stroke SVG that inherits color via currentColor.

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function BookingsIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function GiftIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="9" width="18" height="4" />
      <rect x="5" y="13" width="14" height="8" />
      <path d="M12 9v12" />
      <path d="M12 9c-1.2 0-3-1-3-2.6C9 5 10 4 11 4c1.3 0 1.9 1.6 1 5z" />
      <path d="M12 9c1.2 0 3-1 3-2.6C15 5 14 4 13 4c-1.3 0-1.9 1.6-1 5z" />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CardIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...props}>
      <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5L2.5 9.2l6.6-.7z" />
    </svg>
  );
}

export function HelpIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.3a2.8 2.8 0 1 1 3.9 2.6c-.9.4-1.1.9-1.1 1.6" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function SettingsIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.6a7.6 7.6 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.6a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4z" />
    </svg>
  );
}

export function LogoutIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function CarIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16v-3l2-5h12l2 5v3" />
      <path d="M4 16h16v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="16" r="1.2" />
      <circle cx="16.5" cy="16" r="1.2" />
    </svg>
  );
}

export function RoadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3L5 21" />
      <path d="M15 3l4 18" />
      <path d="M12 3v3M12 10v3M12 17v3" />
    </svg>
  );
}

export function PlaneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 20l1-6.5L3 12l1.5-2 8-1L15 3l2 .5-1.5 7 5 1.5-1 2-5.5-.5-1 6.5-1.5 1z" />
    </svg>
  );
}

export function RepeatIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 .8l.7 3a1 1 0 0 1-.3 1L7.5 10a12 12 0 0 0 6.5 6.5l1.2-1.4a1 1 0 0 1 1-.3l3 .7a1 1 0 0 1 .8 1V19a1 1 0 0 1-1 1h-1C10.7 20 4 13.3 4 6z" />
    </svg>
  );
}

export function MessageIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BanIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
