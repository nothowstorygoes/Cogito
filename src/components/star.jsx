import * as React from "react";

// Star with optional vertical fill percentage.
// Props:
// - achieved: boolean -> if true, fully filled
// - fillPercent: number in [0..1] -> partial vertical fill from bottom to top
// - size: number -> pixel size
// - fillColor/bgColor: colors (fallback to CSS vars)
const Star = ({
  achieved,
  fillPercent,
  size = 35,
  fillColor = "var(--color-primary)",
  bgColor = "var(--color-primary-weak)",
}) => {
  const view = 24;
  const d =
    "M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z";

  // Determine fill amount
  const fill = achieved ? 1 : Math.max(0, Math.min(1, fillPercent ?? 0));
  const fillHeight = view * fill;
  // Inverted: fill from top to bottom
  const fillY = 0;

  // Use unique ids per instance for clipPath
  const clipId = React.useId ? React.useId() : Math.random().toString(36).slice(2);
  const clipUrl = `url(#star-clip-${clipId})`;

  const bg = achieved && !fillPercent ? fillColor : bgColor;

  return (
    <svg
      viewBox={`0 0 ${view} ${view}`}
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`star-clip-${clipId}`}>
          <path d={d} />
        </clipPath>
      </defs>

      {/* Background star */}
      <path d={d} fill={bg} opacity={achieved ? 1 : 0.35} />

      {/* Vertical filled area */}
      {fill > 0 && (
        <rect x="0" y={fillY} width={view} height={fillHeight} clipPath={clipUrl} fill={fillColor} />
      )}

      {/* Outline for contrast */}
      <path d={d} fill="none" stroke={fillColor} strokeOpacity="0.4" strokeWidth="0.75" />
    </svg>
  );
};

export default Star;
