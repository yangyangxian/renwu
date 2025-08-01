// Generic deep mapping function
export function mapObject<TSource extends object, TTarget extends object>(
  source: TSource,
  target: TTarget,
  mapRules?: Record<string, string>
): TTarget {
  const targetKeys = Object.keys(target);

  for (const sourceKey in source) {
    let targetKey: string = sourceKey;
    
    // Check if there's a mapping rule for this key
    if (mapRules && sourceKey in mapRules) {
      targetKey = mapRules[sourceKey];
    }
    
    if (targetKeys.includes(targetKey)) {
      const sourceValue = (source as any)[sourceKey];
      const targetValue = (target as any)[targetKey];
      
      // Skip if source value is null or undefined
      if (sourceValue === null || sourceValue === undefined) {
        (target as any)[targetKey] = sourceValue;
        continue;
      }
      
      // Handle deep copying for nested objects
      if (typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        // If target already has an object of the same type, use it as template
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          // Create a new instance of the target object type and recursively map
          const TargetConstructor = targetValue.constructor;
          const newTargetInstance = new TargetConstructor();
          (target as any)[targetKey] = mapObject(sourceValue, newTargetInstance);
        } else {
          // If no target template exists, just assign the source value
          (target as any)[targetKey] = sourceValue;
        }
      } else {
        // Direct assignment for primitive values
        (target as any)[targetKey] = sourceValue;
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
