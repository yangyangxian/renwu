import { Router, Request, Response, NextFunction } from 'express';
import { labelService } from '../services/LabelService';
import { createApiResponse } from '../utils/apiUtils';

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
      const rows = await labelService.listByUser(userId);
      res.json(createApiResponse(rows));
    } catch (err) { next(err); }
  }
);

// POST /api/labels - create (actor must be the creator)
router.post('/',
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { labelName, labelDescription, labelColor } = req.body;
      const created = await labelService.create({ labelName, labelDescription, labelColor, createdBy: userId });
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
      const found = await labelService.getById(id);
      res.json(createApiResponse(found || undefined));
    } catch (err) { next(err); }
  }
);

// PUT /api/labels/:id
router.put('/:id',
  async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const actor = req.user!.userId;
      const updated = await labelService.update(id, actor, req.body);
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
    req: Request<{ setId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { setId } = req.params;
      const { labelName, labelDescription, labelColor } = req.body;
      const created = await labelService.createLabelInSet({ labelName, labelDescription, labelColor }, setId, userId);
      res.json(createApiResponse(created));
    } catch (err) { next(err); }
  }
);

export default router;
