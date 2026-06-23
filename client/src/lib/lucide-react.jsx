import React from 'react';

const createIcon = (name, paths, viewBox = "0 0 24 24") => {
  const IconComponent = React.forwardRef(({ size = 24, className = '', color = 'currentColor', strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide lucide-${name} ${className}`}
        {...props}
      >
        {paths}
      </svg>
    );
  });
  IconComponent.displayName = name;
  return IconComponent;
};

export const X = createIcon('x', [
  <path key="1" d="M18 6 6 18" />,
  <path key="2" d="m6 6 12 12" />
]);

export const ShieldCheck = createIcon('shield-check', [
  <path key="1" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  <path key="2" d="m9 12 2 2 4-4" />
]);

export const Info = createIcon('info', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <path key="2" d="M12 16v-4" />,
  <path key="3" d="M12 8h.01" />
]);

export const FileText = createIcon('file-text', [
  <path key="1" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />,
  <path key="2" d="M14 2v4a2 2 0 0 0 2 2h4" />,
  <path key="3" d="M10 9H8" />,
  <path key="4" d="M16 13H8" />,
  <path key="5" d="M16 17H8" />
]);

export const Heart = createIcon('heart', [
  <path key="1" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
]);

export const Shield = createIcon('shield', [
  <path key="1" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
]);

export const RefreshCw = createIcon('refresh-cw', [
  <path key="1" d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />,
  <path key="2" d="M3 3v5h5" />,
  <path key="3" d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />,
  <path key="4" d="M16 16h5v5" />
]);

export const Mail = createIcon('mail', [
  <rect key="1" width="20" height="16" x="2" y="4" rx="2" />,
  <path key="2" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
]);

export const Lock = createIcon('lock', [
  <rect key="1" width="18" height="11" x="3" y="11" rx="2" ry="2" />,
  <path key="2" d="M7 11V7a5 5 0 0 1 10 0v4" />
]);

export const User = createIcon('user', [
  <path key="1" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />,
  <circle key="2" cx="12" cy="7" r="4" />
]);

export const MapPin = createIcon('map-pin', [
  <path key="1" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />,
  <circle key="2" cx="12" cy="10" r="3" />
]);

export const ArrowRight = createIcon('arrow-right', [
  <path key="1" d="M5 12h14" />,
  <path key="2" d="m12 5 7 7-7 7" />
]);

export const ChevronDown = createIcon('chevron-down', [
  <path key="1" d="m6 9 6 6 6-6" />
]);

export const ChevronUp = createIcon('chevron-up', [
  <path key="1" d="m18 15-6-6-6 6" />
]);

export const Clock = createIcon('clock', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <polyline key="2" points="12 6 12 12 16 14" />
]);

export const Tag = createIcon('tag', [
  <path key="1" d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l5-5c.94-.94.94-2.48 0-3.42z" />,
  <line key="2" x1="7" y1="7" x2="7.01" y2="7" />
]);

export const Compass = createIcon('compass', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <polygon key="2" points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
]);

export const FileDown = createIcon('file-down', [
  <path key="1" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />,
  <path key="2" d="M14 2v4a2 2 0 0 0 2 2h4" />,
  <path key="3" d="M12 18v-6" />,
  <path key="4" d="m9 15 3 3 3-3" />
]);

export const Save = createIcon('save', [
  <path key="1" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />,
  <polyline key="2" points="17 21 17 13 7 13 7 21" />,
  <polyline key="3" points="7 3 7 8 15 8" />
]);

export const ShieldAlert = createIcon('shield-alert', [
  <path key="1" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  <line key="2" x1="12" y1="8" x2="12" y2="12" />,
  <line key="3" x1="12" y1="16" x2="12.01" y2="16" />
]);

export const ArrowLeft = createIcon('arrow-left', [
  <path key="1" d="m12 19-7-7 7-7" />,
  <path key="2" d="M19 12H5" />
]);

export const Map = createIcon('map', [
  <path key="1" d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />,
  <line key="2" x1="9" y1="3" x2="9" y2="21" />,
  <line key="3" x1="15" y1="3" x2="15" y2="21" />
]);

export const Star = createIcon('star', [
  <polygon key="1" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
]);

export const BookOpen = createIcon('book-open', [
  <path key="1" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />,
  <path key="2" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
]);

export const LogOut = createIcon('log-out', [
  <path key="1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />,
  <polyline key="2" points="16 17 21 12 16 7" />,
  <line key="3" x1="21" y1="12" x2="9" y2="12" />
]);

export const Sparkles = createIcon('sparkles', [
  <path key="1" d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />,
  <path key="2" d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />,
  <path key="3" d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
]);

export const Menu = createIcon('menu', [
  <line key="1" x1="4" y1="12" x2="20" y2="12" />,
  <line key="2" x1="4" y1="6" x2="20" y2="6" />,
  <line key="3" x1="4" y1="18" x2="20" y2="18" />
]);

export const CheckCircle = createIcon('check-circle', [
  <path key="1" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />,
  <polyline key="2" points="22 4 12 14.01 9 11.01" />
]);

export const Gem = createIcon('gem', [
  <path key="1" d="M6 3h12l4 6-10 13L2 9z" />,
  <path key="2" d="M11 3 8 9l4 13 4-13-3-6" />,
  <path key="3" d="M2 9h20" />
]);

export const CheckCircle2 = createIcon('check-circle-2', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <path key="2" d="m9 12 2 2 4-4" />
]);

export const Calendar = createIcon('calendar', [
  <rect key="1" width="18" height="18" x="3" y="4" rx="2" ry="2" />,
  <line key="2" x1="16" y1="2" x2="16" y2="6" />,
  <line key="3" x1="8" y1="2" x2="8" y2="6" />,
  <line key="4" x1="3" y1="10" x2="21" y2="10" />
]);

export const DollarSign = createIcon('dollar-sign', [
  <line key="1" x1="12" y1="1" x2="12" y2="23" />,
  <path key="2" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
]);

export const Trash2 = createIcon('trash-2', [
  <path key="1" d="M3 6h18" />,
  <path key="2" d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />,
  <path key="3" d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />,
  <line key="4" x1="10" y1="11" x2="10" y2="17" />,
  <line key="5" x1="14" y1="11" x2="14" y2="17" />
]);

export const ExternalLink = createIcon('external-link', [
  <path key="1" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />,
  <polyline key="2" points="15 3 21 3 21 9" />,
  <line key="3" x1="10" y1="14" x2="21" y2="3" />
]);

export const PlaneTakeoff = createIcon('plane-takeoff', [
  <path key="1" d="M2 22h20" />,
  <path key="2" d="M6 3 3 6v3l4-2 6 6 8-8-4-1-6 4-3-4-2-1-1 2Z" />
]);

// --- Additional Icons from NearMe, Explore, and TripDetailsModal ---

export const Wallet = createIcon('wallet', [
  <path key="1" d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a1 1 0 0 1-1 1H5a2 2 0 0 1 0-4h14v-3" />,
  <path key="2" d="M16 11h.01" />
]);

export const Navigation = createIcon('navigation', [
  <polygon key="1" points="3 11 22 2 13 21 11 13 3 11" />
]);

export const Search = createIcon('search', [
  <circle key="1" cx="11" cy="11" r="8" />,
  <line key="2" x1="21" y1="21" x2="16.65" y2="16.65" />
]);

export const Bike = createIcon('bike', [
  <circle key="1" cx="5.5" cy="17.5" r="2.5" />,
  <circle key="2" cx="18.5" cy="17.5" r="2.5" />,
  <path key="3" d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
]);

export const Hotel = createIcon('hotel', [
  <path key="1" d="M10 22v-6.57a1 1 0 0 1 1-1h2a1 1 0 0 1 1-1v1.1a1 1 0 0 1-1-1v1" />,
  <path key="2" d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />,
  <circle key="3" cx="12" cy="6" r="0.5" />,
  <circle key="4" cx="12" cy="10" r="0.5" />,
  <circle key="5" cx="8" cy="6" r="0.5" />,
  <circle key="6" cx="8" cy="10" r="0.5" />,
  <circle key="7" cx="16" cy="6" r="0.5" />,
  <circle key="8" cx="16" cy="10" r="0.5" />
]);

export const Music = createIcon('music', [
  <path key="1" d="M9 18V5l12-2v13" />,
  <circle key="2" cx="6" cy="18" r="3" />,
  <circle key="3" cx="18" cy="16" r="3" />
]);

export const Coffee = createIcon('coffee', [
  <path key="1" d="M17 8h1a4 4 0 1 1 0 8h-1" />,
  <path key="2" d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />,
  <line key="3" x1="6" y1="2" x2="6" y2="4" />,
  <line key="4" x1="10" y1="2" x2="10" y2="4" />,
  <line key="5" x1="14" y1="2" x2="14" y2="4" />
]);

export const Utensils = createIcon('utensils', [
  <path key="1" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />,
  <path key="2" d="M7 2v20" />,
  <path key="3" d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z" />,
  <path key="4" d="M19 15v7" />
]);

export const ShoppingBag = createIcon('shopping-bag', [
  <path key="1" d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />,
  <line key="2" x1="3" y1="6" x2="21" y2="6" />,
  <path key="3" d="M16 10a4 4 0 0 1-8 0" />
]);

export const Camera = createIcon('camera', [
  <path key="1" d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />,
  <circle key="2" cx="12" cy="13" r="3" />
]);

export const Sun = createIcon('sun', [
  <circle key="1" cx="12" cy="12" r="4" />,
  <path key="2" d="M12 2v2" />,
  <path key="3" d="M12 20v2" />,
  <path key="4" d="m4.93 4.93 1.41 1.41" />,
  <path key="5" d="m17.66 17.66 1.41 1.41" />,
  <path key="6" d="M2 12h2" />,
  <path key="7" d="M20 12h2" />,
  <path key="8" d="m6.34 17.66-1.41 1.41" />,
  <path key="9" d="m19.07 4.93-1.41 1.41" />
]);

export const Car = createIcon('car', [
  <path key="1" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />,
  <circle key="2" cx="7" cy="17" r="2" />,
  <circle key="3" cx="17" cy="17" r="2" />,
  <path key="4" d="M9 17h6" />
]);

export const Zap = createIcon('zap', [
  <polygon key="1" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
]);

export const Umbrella = createIcon('umbrella', [
  <path key="1" d="M12 2v1m0 0a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zm0 8v9a2 2 0 1 0 4 0" />
]);

export const Mountain = createIcon('mountain', [
  <path key="1" d="m8 3 4 8 5-5 5 15H2L8 3z" />
]);

export const Building2 = createIcon('building-2', [
  <path key="1" d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />,
  <path key="2" d="M6 18h4" />,
  <path key="3" d="M14 18h4" />,
  <path key="4" d="M14 14h4" />,
  <path key="5" d="M6 14h4" />,
  <path key="6" d="M14 10h4" />,
  <path key="7" d="M6 10h4" />,
  <path key="8" d="M14 6h4" />,
  <path key="9" d="M6 6h4" />
]);

export const PartyPopper = createIcon('party-popper', [
  <path key="1" d="M5.8 11.3 2 22l10.7-3.8" />,
  <path key="2" d="M4 14h.01" />,
  <path key="3" d="M17 8c0-1.5-1.5-2.5-3-2.5" />,
  <path key="4" d="M8.5 8.5C9 7.5 10 7.5 11 8" />,
  <path key="5" d="M11.5 11.5c.5-1 1.5-1 2.5-.5" />,
  <path key="6" d="M14 14c.5-1.5 2-1.5 2.5-.5" />,
  <path key="7" d="m20 4-1.5.5-1.5-.5.5 1.5-.5 1.5 1.5-.5 1.5.5-.5-1.5.5-1.5z" />,
  <path key="8" d="m18 10-1.5.5-1.5-.5.5 1.5-.5 1.5 1.5-.5 1.5.5-.5-1.5.5-1.5z" />,
  <path key="9" d="m14 2-1.5.5-1.5-.5.5 1.5-.5 1.5 1.5-.5 1.5.5-.5-1.5.5-1.5z" />
]);

export const AlertCircle = createIcon('alert-circle', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <line key="2" x1="12" y1="8" x2="12" y2="12" />,
  <line key="3" x1="12" y1="16" x2="12.01" y2="16" />
]);

export const Sparkle = createIcon('sparkle', [
  <path key="1" d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.8 1.9a2 2 0 0 1 1.2 1.2l1.9 5.8 1.9-5.8a2 2 0 0 1 1.2-1.2l5.8-1.9-5.8-1.9a2 2 0 0 1-1.2-1.2L12 3Z" />
]);

export const Eye = createIcon('eye', [
  <path key="1" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />,
  <circle key="2" cx="12" cy="12" r="3" />
]);

export const EyeOff = createIcon('eye-off', [
  <path key="1" d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />,
  <path key="2" d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />,
  <path key="3" d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />,
  <line key="4" x1="2" y1="2" x2="22" y2="22" />
]);

export const Globe = createIcon('globe', [
  <circle key="1" cx="12" cy="12" r="10" />,
  <path key="2" d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />,
  <path key="3" d="M2 12h20" />
]);

export const TrendingUp = createIcon('trending-up', [
  <polyline key="1" points="22 7 13.5 15.5 8.5 10.5 2 17" />,
  <polyline key="2" points="16 7 22 7 22 13" />
]);

export const Users = createIcon('users', [
  <path key="1" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
  <circle key="2" cx="9" cy="7" r="4" />,
  <path key="3" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
  <path key="4" d="M16 3.13a4 4 0 0 1 0 7.75" />
]);

export const Twitter = createIcon('twitter', [
  <path key="1" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
]);

export const Instagram = createIcon('instagram', [
  <rect key="1" width="20" height="20" x="2" y="2" rx="5" ry="5" />,
  <path key="2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />,
  <line key="3" x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
]);

export const Linkedin = createIcon('linkedin', [
  <path key="1" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />,
  <rect key="2" width="4" height="12" x="2" y="9" />,
  <circle key="3" cx="4" cy="4" r="2" />
]);

export const Plane = createIcon('plane', [
  <path key="1" d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5 5.3 6.7 3.5 8.5l7 4-3 3-3-1-1.5 1.5 3 2 2 3 1.5-1.5-1-3 3-3 4 7 1.8-1.8z" />
]);

export const Train = createIcon('train', [
  <rect key="1" width="16" height="16" x="4" y="2" rx="2" />,
  <path key="2" d="M4 14h16" />,
  <path key="3" d="M8 10h.01" />,
  <path key="4" d="M16 10h.01" />,
  <path key="5" d="m6 22 2-3" />,
  <path key="6" d="m18 22-2-3" />
]);

export const Bus = createIcon('bus', [
  <path key="1" d="M8 6v6" />,
  <path key="2" d="M16 6v6" />,
  <path key="3" d="M4 18V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" />,
  <path key="4" d="M4 10h16" />,
  <circle key="5" cx="6.5" cy="18.5" r="2.5" />,
  <circle key="6" cx="17.5" cy="18.5" r="2.5" />
]);

export const Crown = createIcon('crown', [
  <path key="1" d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 6a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.519A.5.5 0 0 1 2.818 6l4.277 3.164a1 1 0 0 0 1.516-.294z" />,
  <path key="2" d="M5 21h14" />
]);

export const AlertTriangle = createIcon('alert-triangle', [
  <path key="1" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />,
  <line key="2" x1="12" y1="9" x2="12" y2="13" />,
  <line key="3" x1="12" y1="17" x2="12.01" y2="17" />
]);

export const BarChart3 = createIcon('bar-chart-3', [
  <path key="1" d="M3 3v18h18" />,
  <path key="2" d="M18 17V9" />,
  <path key="3" d="M13 17V5" />,
  <path key="4" d="M8 17v-3" />
]);
