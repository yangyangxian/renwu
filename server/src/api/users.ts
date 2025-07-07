import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/UserService.js';
import { UserReqDto, UserResDto, ApiResponse, ErrorCodes, UpdateUserReqDto} from '@fullstack/common';
import { mapObject } from '../utils/mappers.js';
import { createApiResponse } from '../utils/apiUtils.js';
import { CustomError } from '../classes/CustomError.js';

const router = Router();

// GET /api/users/email/:email
router.get('/email/:email', async (req: Request<UserReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  const email = req.params.email;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new CustomError('User not found', ErrorCodes.NOT_FOUND);
  }
  const userDto = mapObject(user, new UserResDto());
  res.json(createApiResponse<UserResDto>(userDto));
});

router.put('/me', async (req: Request<{}, {}, UpdateUserReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new CustomError('Unauthorized', ErrorCodes.UNAUTHORIZED);
    }
    const { name } = req.body;
    // You can add more validation for other fields if needed
    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      throw new CustomError('Name is required', ErrorCodes.VALIDATION_ERROR);
    }
    // Remove undefined fields from req.body
    const updateFields: Partial<UpdateUserReqDto> = {};
    if (name !== undefined) updateFields.name = name.trim();
    // Add more fields as needed
    const updatedUser = await userService.updateUser(user.userId, updateFields);
    const userDto = mapObject(updatedUser, new UserResDto());
    res.json(createApiResponse<UserResDto>(userDto));
  } catch (err) {
    next(err);
  }
});

export default router;
