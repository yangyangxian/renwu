import { Router, Request, Response, NextFunction } from 'express';
import { labelService } from '../services/LabelService';
import { createApiResponse } from '../utils/apiUtils';
import { LabelResDto, LabelCreateReqDto, LabelUpdateReqDto } from '@fullstack/common';
import { mapObject } from '../utils/mappers';

const router = Router();

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
      const rows: LabelResDto[] = raw.map(r => mapObject(r, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      }));
      res.json(createApiResponse(rows));
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
      const { labelName, description, color } = req.body;
      const createdRaw = await labelService.create({ labelName: labelName as string, labelDescription: description, labelColor: color, createdBy: userId });
      const created: LabelResDto = mapObject(createdRaw, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      });
      res.json(createApiResponse(created));
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
      const found: LabelResDto | null = foundRaw ? mapObject(foundRaw, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      }) : null;
      res.json(createApiResponse(found || undefined));
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
      const updated: LabelResDto = mapObject(patched, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      });
      res.json(createApiResponse(updated));
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
      const rows = await labelService.listSetsByUser(userId);
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
      const { labelSetName, labelSetDescription } = req.body;
      const created = await labelService.createSet({ labelSetName, labelSetDescription, createdBy: userId });
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
      const created: LabelResDto = mapObject(createdRaw, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      });
      res.json(createApiResponse(created));
    } catch (err) { next(err); }
  }
);

// GET labels for a specific set (ownership enforced)
router.get('/sets/:setId/labels',
  async (
    req: Request<{ setId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { setId } = req.params;
      const rows = await labelService.listLabelsInSet(setId);
      const mapped: LabelResDto[] = rows.map(r => mapObject(r, new LabelResDto(), {
        labelName: 'name',
        labelDescription: 'description',
        labelColor: 'color',
      }));
      res.json(createApiResponse(mapped));
    } catch (err) { next(err); }
  }
);

export default router;
