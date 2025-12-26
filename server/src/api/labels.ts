import { Router, Request, Response, NextFunction } from 'express';
import { labelService } from '../services/LabelService';
import { createApiResponse } from '../utils/apiUtils';
import { LabelResDto, LabelCreateReqDto, LabelUpdateReqDto } from '@fullstack/common';
import { mapObject } from '../utils/mappers';

const router = Router();

// Field mapping used to map DB/entity keys to DTO properties for labels
const labelFieldMap: Record<string, string> = {
  labelName: 'name',
  labelDescription: 'description',
  labelColor: 'color',
};

// Convenience: GET /api/labels/me (declare before /:id to avoid collision)
router.get('/me',
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const raw = await labelService.listByUser(userId);
      const rows: LabelResDto[] = raw.map(r => mapObject(r, new LabelResDto(), labelFieldMap));
      res.json(createApiResponse<LabelResDto[]>(rows));
    } catch (err) { next(err); }
  }
);

// GET /api/labels/project/:projectId - list labels by project
router.get('/project/:projectId',
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const raw = await labelService.listByProject(projectId, userId);
      const rows: LabelResDto[] = raw.map(r => mapObject(r, new LabelResDto(), labelFieldMap));
      res.json(createApiResponse<LabelResDto[]>(rows));
    } catch (err) { next(err); }
  }
);

// POST /api/labels - create (actor must be the creator)
router.post('/',
  async (
    req: Request<{}, any, LabelCreateReqDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      // expect new DTO shape: { labelName, description?, color? }
      const { labelName, description, color, projectId } = req.body as any;
      const createdRaw = await labelService.create({ labelName: labelName as string, labelDescription: description, labelColor: color, projectId: projectId ?? null, createdBy: userId });
      const created: LabelResDto = mapObject(createdRaw, new LabelResDto(), labelFieldMap);
      res.json(createApiResponse<LabelResDto>(created));
    } catch (err) { next(err); }
  }
);

// GET /api/labels/:id
router.get('/:id',
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const foundRaw = await labelService.getById(id);
      const found: LabelResDto | null = foundRaw ? mapObject(foundRaw, new LabelResDto(), labelFieldMap) : null;
      res.json(createApiResponse<LabelResDto | null>(found || undefined));
    } catch (err) { next(err); }
  }
);

// PUT /api/labels/:id
router.put('/:id',
  async (
    req: Request<{ id: string }, any, LabelUpdateReqDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const actor = req.user!.userId;
      const { name, description, color } = req.body;
      const patched = await labelService.update(id, actor, { labelName: name, labelDescription: description, labelColor: color });
      const updated: LabelResDto = mapObject(patched, new LabelResDto(), labelFieldMap);
      res.json(createApiResponse<LabelResDto>(updated));
    } catch (err) { next(err); }
  }
);

// DELETE /api/labels/:id
router.delete('/:id',
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const actor = req.user!.userId;
      await labelService.delete(id, actor);
      res.json(createApiResponse(null));
    } catch (err) { next(err); }
  }
);

// Label sets endpoints (basic)
router.get('/sets/me',
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
  const rows = await labelService.listSetsByUserWithLabels(userId);
      res.json(createApiResponse(rows));
    } catch (err) { next(err); }
  }
);

// GET /api/labels/sets/project/:projectId - list label sets by project
router.get('/sets/project/:projectId',
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
  const rows = await labelService.listSetsByProjectWithLabels(projectId, userId);
      res.json(createApiResponse(rows));
    } catch (err) { next(err); }
  }
);

router.post('/sets',
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { labelSetName, labelSetDescription, projectId } = req.body as any;
      const created = await labelService.createSet({ labelSetName, labelSetDescription, projectId: projectId ?? null, createdBy: userId });
      res.json(createApiResponse(created));
    } catch (err) { next(err); }
  }
);

// create a new label and attach to set in one call
router.post('/sets/:setId/labels',
  async (
    req: Request<{ setId: string }, any, LabelCreateReqDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { setId } = req.params;
      // expect new DTO shape: { name, description?, color? }
      const { labelName, description, color } = req.body;
      const createdRaw = await labelService.createLabelInSet({ labelName: labelName as string, labelDescription: description, labelColor: color }, setId, userId);
      const created: LabelResDto = mapObject(createdRaw, new LabelResDto(), labelFieldMap);
      res.json(createApiResponse<LabelResDto>(created));
    } catch (err) { next(err); }
  }
);

// GET labels for a specific set
router.get('/sets/:setId/labels',
  async (
    req: Request<{ setId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { setId } = req.params;
      const rows = await labelService.listLabelsInSet(setId);
      const mapped: LabelResDto[] = rows.map(r => mapObject(r, new LabelResDto(), labelFieldMap));
      res.json(createApiResponse<LabelResDto[]>(mapped));
    } catch (err) { next(err); }
  }
);

// DELETE /api/labels/sets/:id - delete a label set (ownership enforced)
router.delete('/sets/:id',
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const actor = req.user!.userId;
      await labelService.deleteSet(id, actor);
      res.json(createApiResponse(null));
    } catch (err) { next(err); }
  }
);

export default router;
