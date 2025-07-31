import { db } from '../database/databaseAccess';
import { roles } from '../database/schema';

export class PermissionService {
  static async getAllRoles() {
    return db.select().from(roles);
  }
}
