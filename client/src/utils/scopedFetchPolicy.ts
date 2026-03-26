interface ResolveScopedFetchPolicyOptions {
  hasLoadedScope: boolean;
  hasInFlightRequest: boolean;
  force?: boolean;
}

export function resolveScopedFetchPolicy({
  hasLoadedScope,
  hasInFlightRequest,
  force = false,
}: ResolveScopedFetchPolicyOptions): 'skip' | 'join' | 'fetch' {
  if (force) {
    return 'fetch';
  }

  if (hasLoadedScope) {
    return 'skip';
  }

  if (hasInFlightRequest) {
    return 'join';
  }

  return 'fetch';
}