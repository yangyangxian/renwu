-- Custom SQL migration file, put your code below! --

-- Seed default roles (matching ProjectRole enum)
INSERT INTO roles (id, name, description) VALUES
  (gen_random_uuid(), 'member', 'Project member'),
  (gen_random_uuid(), 'admin', 'Project admin'),
  (gen_random_uuid(), 'owner', 'Project owner')
ON CONFLICT (name) DO NOTHING;

-- Seed default permissions (matching PermissionAction enum)
INSERT INTO permissions (id, action, description) VALUES
  (gen_random_uuid(), 'delete_project', 'Delete project'),
  (gen_random_uuid(), 'update_project', 'Update project')
ON CONFLICT (action) DO NOTHING;

-- Optionally, seed role_permissions (assign permissions according to role)
-- Owner: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'owner';
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin' AND p.action = 'update_project';