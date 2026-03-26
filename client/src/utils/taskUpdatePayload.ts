type LabelLike = { id?: string | null } | string | null | undefined;

function normalizeLabelIds(labels: LabelLike[] | undefined): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .map((label) => (typeof label === 'string' ? label : label?.id))
    .filter((labelId): labelId is string => Boolean(labelId));
}

export function shouldIncludeTaskUpdateLabels(initialLabels: LabelLike[] | undefined, nextLabels: LabelLike[] | undefined): boolean {
  const initialIds = normalizeLabelIds(initialLabels);
  const nextIds = normalizeLabelIds(nextLabels);

  if (initialIds.length !== nextIds.length) {
    return true;
  }

  const initialSet = new Set(initialIds);
  for (const labelId of nextIds) {
    if (!initialSet.has(labelId)) {
      return true;
    }
  }

  return false;
}