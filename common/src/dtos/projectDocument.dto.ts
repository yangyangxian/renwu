import { z } from 'zod';

export const ProjectDocumentCreateReqSchema = z.object({
  title: z.string().trim().min(1, 'Document title is required').max(255, 'Document title is too long').optional(),
  content: z.string().optional(),
});

export class ProjectDocumentCreateReqDto {
  title?: string = '';
  content?: string = '';
}

export class ProjectDocumentUpdateReqDto {
  title?: string;
  content?: string;
  position?: number;
}

export class ProjectDocumentResDto {
  id: string = '';
  projectId: string = '';
  title: string = '';
  content: string = '';
  position: number = 0;
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
}
