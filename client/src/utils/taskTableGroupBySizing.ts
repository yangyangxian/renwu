const MIN_GROUP_BY_TRIGGER_CH = 16;
const MAX_GROUP_BY_TRIGGER_CH = 28;
const GROUP_BY_TRIGGER_PADDING_CH = 5;

export function getTaskTableGroupByTriggerWidth(labelSetNames: string[]): string {
  const longestOptionLength = labelSetNames.reduce((maxLength, labelSetName) => {
    return Math.max(maxLength, labelSetName.trim().length);
  }, 0);

  const triggerWidth = Math.min(
    Math.max(longestOptionLength + GROUP_BY_TRIGGER_PADDING_CH, MIN_GROUP_BY_TRIGGER_CH),
    MAX_GROUP_BY_TRIGGER_CH
  );

  return `${triggerWidth}ch`;
}