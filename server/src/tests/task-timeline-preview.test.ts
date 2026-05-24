import { describe, expect, it } from 'vitest';

import { resolveTaskPreviewImageUrl } from '../services/taskTimelinePreview';

describe('resolveTaskPreviewImageUrl', () => {
  it('prefers the first image from the task description markdown', () => {
    const previewUrl = resolveTaskPreviewImageUrl({
      description: 'Intro\n\n![cover](https://img.example.com/cover.png)\n\nMore text',
      comments: [
        '![comment](https://img.example.com/comment.png)',
      ],
    });

    expect(previewUrl).toBe('https://img.example.com/cover.png');
  });

  it('falls back to the first image found in comments when the description has no image', () => {
    const previewUrl = resolveTaskPreviewImageUrl({
      description: 'No image here',
      comments: [
        'first comment without image',
        '![comment](https://img.example.com/comment.png)',
        '![later](https://img.example.com/later.png)',
      ],
    });

    expect(previewUrl).toBe('https://img.example.com/comment.png');
  });
});