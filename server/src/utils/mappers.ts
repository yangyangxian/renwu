export function mapObject<TSource extends object, TTarget extends object>(
  source: TSource,
  target: TTarget,
  mapRules?: Record<string, string>
): TTarget {
  const targetKeys = Object.keys(target);

  for (const sourceKey in source) {
    if (mapRules && sourceKey in mapRules) {
      const targetKey = mapRules[sourceKey];
      if (targetKeys.includes(targetKey)) {
        (target as any)[targetKey] = (source as any)[sourceKey];
      }
    } else {
      // If no mapRules or sourceKey not mapped, try direct matching
      if (targetKeys.includes(sourceKey)) {
        (target as any)[sourceKey] = (source as any)[sourceKey];
      }
    }
  }

  return target;
}

export function mapDbToEntity<TSource extends object, TTarget extends object>(
  source: TSource,
  target: TTarget,
  fieldConfig?: {
    [K in keyof TTarget]?: {
      mapFrom?: keyof TSource;
      default?: any;
      date?: boolean;
    }
  }
): TTarget {
  // Default config for common entity fields
  const defaultConfig: Record<string, any> = {
    description: { default: '' },
    projectId: { default: '' },
    projectName: { default: '' },
    dueDate: { date: true, default: '' },
    createdAt: { date: true, default: '' },
    updatedAt: { date: true, default: '' },
  };
  const config = { ...defaultConfig, ...(fieldConfig || {}) };
  const result = { ...target };
  const configObj = config as Record<string, any>;
  for (const key in result) {
    const field = configObj[key];
    const sourceKey = field?.mapFrom || key;
    let value = (source as any)[sourceKey];
    if (field?.date) {
      if (value instanceof Date) {
        value = value.toISOString();
      } else if (typeof value === 'string') {
        value = value;
      } else {
        value = field.default ?? '';
      }
    } else {
      if (value === undefined || value === null) {
        value = field?.default ?? '';
      }
    }
    (result as any)[key] = value;
  }
  return result;
}
