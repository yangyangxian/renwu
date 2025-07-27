import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import { Input } from '@/components/ui-kit/Input';
import { Button } from '@/components/ui-kit/Button';
import { AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { PROJECTS_PATH } from '@/routes/routeConfig';
import { ProjectCreateReqSchema } from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { checkSlugAvailability } from '@/apiRequests/apiEndpoints';

export function ProjectSettingsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject: project, projects, updateProject, deleteProject } = useProjectStore();
  const [projectName, setProjectName] = useState(project?.name || '');
  const [projectSlug, setProjectSlug] = useState(project?.slug || '');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ name?: string; slug?: string }>({});
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Track if there are unsaved changes (both name and slug are updateable)
  const hasUnsavedChanges = projectName !== (project?.name || '') || projectSlug !== (project?.slug || '');
  
  // Check if form is valid (no validation errors and required fields filled)
  const isFormValid = !validationErrors.name && !validationErrors.slug && projectName.trim() && projectSlug.trim() && !isCheckingSlug;

  // Check if slug is available (debounced)
  const checkSlugUniqueness = async (slug: string) => {
    if (!slug || slug === project?.slug) {
      return; // Don't check if empty or same as current slug
    }

    setIsCheckingSlug(true);
    try {
      const response = await apiClient.get<{ available: boolean }>(checkSlugAvailability(slug));
      if (!response.available) {
        setValidationErrors(prev => ({ ...prev, slug: 'This slug is already taken' }));
      } else {
        // Clear slug error if it was about uniqueness
        setValidationErrors(prev => {
          if (prev.slug === 'This slug is already taken') {
            return { ...prev, slug: undefined };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
      // Don't show error to user for network issues, just allow them to try saving
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Debounce slug checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (projectSlug && projectSlug !== project?.slug) {
        checkSlugUniqueness(projectSlug);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [projectSlug, project?.slug]);

  // Validate individual fields using the same approach as ProjectDialog
  const validateField = (field: 'name' | 'slug', value: string) => {
    const dataToValidate = field === 'name' ? { name: value } : { slug: value };
    const result = ProjectCreateReqSchema.pick({ [field]: true }).safeParse(dataToValidate);
    
    if (!result.success) {
      // Map Zod errors to field errors (same as ProjectDialog)
      const fieldError = result.error.issues.find(err => err.path[0] === field);
      if (fieldError) {
        setValidationErrors(prev => ({ ...prev, [field]: fieldError.message }));
      }
    } else {
      // Clear error if validation passes
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    setProjectName(project?.name || '');
    setProjectSlug(project?.slug || '');
    setDeleteConfirmation('');
    // Clear validation errors when project changes
    setValidationErrors({});
  }, [project]);

  const handleSave = async () => {
    if (!project?.id) return;
    
    // Validate using the same approach as ProjectDialog
    const result = ProjectCreateReqSchema.pick({ name: true, slug: true }).safeParse({
      name: projectName,
      slug: projectSlug,
    });
    
    if (!result.success) {
      // Map Zod errors to field errors (same as ProjectDialog)
      const fieldErrors: { name?: string; slug?: string } = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0];
        if (typeof key === "string" && (key === "name" || key === "slug")) {
          fieldErrors[key] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    // Clear any validation errors
    setValidationErrors({});
    
    const originalSlug = project.slug;
    const slugChanged = projectSlug !== originalSlug;
    
    try {
      await updateProject(project.id, {
        name: projectName,
        slug: projectSlug,
      });
      
      // Success - the project store will update automatically
      toast.success('Project settings updated successfully');
      
      // If slug changed, navigate to the new URL to maintain sidebar selection
      if (slugChanged) {
        const currentHash = location.hash;
        navigate(`${PROJECTS_PATH}/${projectSlug}${currentHash}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project settings. Please try again.');
    }
  };

  const handleCancel = () => {
    setProjectName(project?.name || '');
    setProjectSlug(project?.slug || '');
    // Clear validation errors on cancel
    setValidationErrors({});
  };

  const handleDeleteProject = async () => {
    if (!project?.id) return;

    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
      
      // Find the next best project to navigate to
      const remainingProjects = projects.filter(p => p.id !== project.id);
      
      if (remainingProjects.length > 0) {
        // Navigate to the first remaining project (could be enhanced to pick the most recent)
        const nextProject = remainingProjects[remainingProjects.length-1];
        const currentHash = location.hash;
        navigate(`${PROJECTS_PATH}/${nextProject.slug}${currentHash}`, { replace: true });
      } else {
        // No projects left, navigate to projects page
        navigate(PROJECTS_PATH, { replace: true });
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="shadow-none m-2 py-3 px-1 w-1/2">
      <div className="flex flex-col w-full py-1 px-4 shadow-none">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-xl font-medium">General Settings</Label>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-200 rounded text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
              Unsaved changes
            </div>
          )}
        </div>
        <Label className="text-muted-foreground mb-6 block">Basic project information and settings.</Label>
        <div className="flex flex-row gap-8">
          <div className="flex flex-col w-1/2">
            <Label className="mb-2 font-medium">Project Name</Label>
            <Input
              value={projectName}
              onChange={e => {
                setProjectName(e.target.value);
                validateField('name', e.target.value);
              }}
              placeholder="Project Name"
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            <div className="h-5 mt-1">
              {validationErrors.name && (
                <span className="text-sm text-red-500">{validationErrors.name}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className="flex items-center gap-2 mb-2">
              <Label className="font-medium">Project ID</Label>
              <span className="text-xs text-muted-foreground">(2-3 characters)</span>
            </div>
            <Input
              value={projectSlug}
              onChange={e => {
                setProjectSlug(e.target.value);
                validateField('slug', e.target.value);
              }}
              placeholder="Project Slug"
              className={validationErrors.slug ? 'border-red-500' : ''}
            />
            <div className="h-5 mt-1">
              {validationErrors.slug && (
                <span className="text-sm text-red-500">{validationErrors.slug}</span>
              )}
            </div>
          </div>
        </div>        
        {/* Save and Cancel buttons */}
        <div className="flex gap-3">
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!isFormValid || !hasUnsavedChanges}
          >
            Save Changes
          </Button>
          <Button 
            size="sm"
            variant="outline" 
            onClick={handleCancel}
            disabled={!hasUnsavedChanges}
          >
            Cancel
          </Button>
        </div>
        
        <div className="py-2 mt-7">
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-xl font-medium">Danger Zone</Label>
          </div>
          <div className="border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 bg-red-50 dark:bg-red-950/30">
            <div className="flex items-start">
              <div>
                <ul className="space-y-2 text-red-600 dark:text-red-400 text-sm">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    All tasks will be permanently deleted
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Project settings will be deleted
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Enter "{project?.name || 'project name'}" to permanently delete this project:</Label>
            <div className="flex flex-col items-start gap-6">
              <Input
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder={project?.name || 'project name'}
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteConfirmation !== (project?.name || '') || isDeleting}
                onClick={handleDeleteProject}
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
