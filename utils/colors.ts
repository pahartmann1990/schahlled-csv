export const CHART_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#d97706", // amber-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#be123c", // rose-700
  "#4d7c0f", // lime-700
  "#4338ca", // indigo-700
  "#b45309", // amber-700
];

export const getColor = (index: number): string => {
  return CHART_COLORS[index % CHART_COLORS.length];
};
