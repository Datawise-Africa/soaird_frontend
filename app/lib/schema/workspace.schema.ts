import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WORKSPACE_ROLES } from '~/lib/api/soaird-client';

export const workspaceInvitationSchema = z.object({
  email: z.email('Enter a valid email address'),
  role: z.enum(WORKSPACE_ROLES),
});

export const workspaceInvitationResolver = zodResolver(
  workspaceInvitationSchema
);

export type WorkspaceInvitationInput = z.infer<
  typeof workspaceInvitationSchema
>;