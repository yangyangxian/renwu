export function getTimelineTargetScrollTop({
  containerScrollTop,
  containerTop,
  targetTop,
}: {
  containerScrollTop: number;
  containerTop: number;
  targetTop: number;
}) {
  return Math.max(0, containerScrollTop + targetTop - containerTop);
}

export function isTimelineTargetAligned({
  containerTop,
  targetTop,
  tolerance = 8,
}: {
  containerTop: number;
  targetTop: number;
  tolerance?: number;
}) {
  return Math.abs(targetTop - containerTop) <= tolerance;
}