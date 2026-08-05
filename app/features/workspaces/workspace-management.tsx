import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import {
  Check,
  Clock3,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import {
  api,
  WORKSPACE_ROLES,
  type WorkspaceInvitation,
  type WorkspaceMembership,
  type WorkspaceRole,
} from '~/lib/api/soaird-client';
import {
  workspaceInvitationResolver,
  type WorkspaceInvitationInput,
} from '~/lib/schema';
import { Form } from '~/components/ui/form';
import { FormPickerField, FormTextField } from '~/components/form-fields';
import { Button } from '~/components/ui/button';
import { useWorkspace } from './workspace-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: 'Workspace administrator',
  research_lead: 'Research lead',
  assessor: 'Assessor',
  reviewer: 'Reviewer',
  adjudicator: 'Adjudicator',
  reader: 'Read-only researcher',
};

export function WorkspaceManagement({
  invitationOnly = false,
}: Readonly<{ invitationOnly?: boolean }>) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tokenHandled = useRef(false);
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const isAdmin =
    !activeWorkspace.personal && activeWorkspace.roles.includes('admin');
  const organizationId = activeWorkspace.personal ? null : activeWorkspace.id;

  const invitations = useQuery({
    queryKey: ['workspace-invitations', organizationId],
    queryFn: () =>
      api.workspaceInvitations(
        new URLSearchParams({
          ...(organizationId ? { organization: organizationId } : {}),
          page_size: '100',
        }).toString()
      ),
  });
  const members = useQuery({
    queryKey: ['workspace-members', organizationId],
    queryFn: () => api.workspaceMembers(organizationId as string),
    enabled: Boolean(organizationId && isAdmin && !invitationOnly),
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] }),
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] }),
      refreshWorkspaces(),
    ]);
  };

  const invitationAction = useMutation({
    mutationFn: async ({
      kind,
      invitation,
    }: {
      kind: 'accept' | 'decline' | 'resend' | 'revoke';
      invitation: WorkspaceInvitation;
    }) => {
      if (kind === 'accept') return api.acceptWorkspaceInvitation(invitation.id);
      if (kind === 'decline') return api.declineWorkspaceInvitation(invitation.id);
      if (kind === 'resend') return api.resendWorkspaceInvitation(invitation.id);
      return api.revokeWorkspaceInvitation(invitation.id);
    },
    onSuccess: async (_, variables) => {
      const message =
        variables.kind === 'accept'
          ? 'The workspace is now available in your selector.'
          : 'The invitation status has been updated.';
      toastUtils.success('Invitation updated', message);
      await refresh();
    },
    onError: (error) =>
      toastUtils.error('Invitation update failed', extractError(error)),
  });

  const acceptToken = useMutation({
    mutationFn: (value: string) => api.acceptWorkspaceInvitationToken(value),
    onSuccess: async () => {
      toastUtils.success(
        'Invitation accepted',
        'The workspace is now available in your selector.'
      );
      await refresh();
    },
    onError: (error) =>
      toastUtils.error('Could not accept invitation', extractError(error)),
  });

  useEffect(() => {
    if (!token || tokenHandled.current) return;
    tokenHandled.current = true;
    acceptToken.mutate(token);
  }, [acceptToken, token]);

  const pendingInvitations = useMemo(
    () =>
      (invitations.data?.results ?? []).filter(
        (item) => item.effective_status === 'pending'
      ),
    [invitations.data]
  );

  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h1>{invitationOnly ? 'Workspace invitation' : 'Workspace settings'}</h1>
          <p>
            {activeWorkspace.personal
              ? 'Your personal workspace remains private. Accept an invitation to collaborate with a research organization.'
              : `Manage access to ${activeWorkspace.name}.`}
          </p>
        </div>
      </div>

      {token && acceptToken.isPending ? (
        <div className="inline-loading">Accepting your workspace invitation…</div>
      ) : null}

      <InvitationsPanel
        invitations={pendingInvitations}
        loading={invitations.isLoading}
        onAction={(kind, invitation) =>
          invitationAction.mutate({ kind, invitation })
        }
      />

      {!invitationOnly && activeWorkspace.personal ? (
        <section className="data-panel workspace-panel">
          <div className="assessment-empty-state">
            <ShieldCheck size={30} />
            <h3>Personal research context</h3>
            <p>
              Datasets and assessments created here are private to your account
              unless you explicitly share them.
            </p>
          </div>
        </section>
      ) : null}

      {!invitationOnly && organizationId && isAdmin ? (
        <>
          <InviteMemberForm organizationId={organizationId} onInvited={refresh} />
          <MembersPanel
            members={members.data?.results ?? []}
            loading={members.isLoading}
            onChanged={refresh}
          />
        </>
      ) : null}

      {!invitationOnly && organizationId && !isAdmin ? (
        <section className="data-panel workspace-panel">
          <div className="assessment-empty-state">
            <Users size={30} />
            <h3>{activeWorkspace.name}</h3>
            <p>
              Your role does not include member-management permission. A workspace
              administrator can update membership.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function InvitationsPanel({
  invitations,
  loading,
  onAction,
}: Readonly<{
  invitations: WorkspaceInvitation[];
  loading: boolean;
  onAction: (
    kind: 'accept' | 'decline' | 'resend' | 'revoke',
    invitation: WorkspaceInvitation
  ) => void;
}>) {
  return (
    <section className="data-panel workspace-panel">
      <PanelHeading
        icon={<MailPlus size={20} />}
        title="Pending invitations"
        description="Invitations must match the email address on the account that accepts them."
      />
      {loading ? (
        <div className="inline-loading">Loading invitations…</div>
      ) : invitations.length === 0 ? (
        <div className="assessment-empty-state">
          <Clock3 size={28} />
          <h3>No pending invitations</h3>
          <p>New workspace invitations will appear here.</p>
        </div>
      ) : (
        <div className="workspace-list">
          {invitations.map((invitation) => (
            <div className="workspace-list-row" key={invitation.id}>
              <div>
                <strong>{invitation.organization_name}</strong>
                <small>
                  {ROLE_LABELS[invitation.role]} · expires{' '}
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </small>
              </div>
              <div className="workspace-row-actions">
                {invitation.can_accept ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onAction('accept', invitation)}
                    >
                      <Check /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction('decline', invitation)}
                    >
                      <X /> Decline
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction('resend', invitation)}
                    >
                      <RefreshCw /> Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction('revoke', invitation)}
                    >
                      <X /> Revoke
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InviteMemberForm({
  organizationId,
  onInvited,
}: Readonly<{
  organizationId: string;
  onInvited: () => Promise<unknown>;
}>) {
  const form = useForm<WorkspaceInvitationInput>({
    resolver: workspaceInvitationResolver,
    defaultValues: { email: '', role: 'reader' },
  });
  const mutation = useMutation({
    mutationFn: (input: WorkspaceInvitationInput) =>
      api.inviteWorkspaceMember({ organization: organizationId, ...input }),
    onSuccess: async () => {
      form.reset();
      toastUtils.success('Invitation sent', 'Workspace access is pending acceptance.');
      await onInvited();
    },
    onError: (error) =>
      toastUtils.error('Could not send invitation', extractError(error)),
  });

  return (
    <section className="data-panel workspace-panel">
      <PanelHeading
        icon={<MailPlus size={20} />}
        title="Invite a member"
        description="The person must accept before workspace access is activated."
      />
      <Form {...form}>
        <form
          className="workspace-invite-form"
          onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
        >
          <FormTextField
            control={form.control}
            name="email"
            label="Email address"
            type="email"
            placeholder="researcher@example.org"
            required
          />
          <FormPickerField
            control={form.control}
            name="role"
            label="Initial role"
            options={WORKSPACE_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            }))}
            required
          />
          <Button type="submit" disabled={mutation.isPending}>
            <MailPlus />
            {mutation.isPending ? 'Sending…' : 'Send invitation'}
          </Button>
        </form>
      </Form>
    </section>
  );
}

function MembersPanel({
  members,
  loading,
  onChanged,
}: Readonly<{
  members: WorkspaceMembership[];
  loading: boolean;
  onChanged: () => Promise<unknown>;
}>) {
  const mutation = useMutation({
    mutationFn: ({
      id,
      role,
      revoke,
    }: {
      id: string;
      role?: WorkspaceRole;
      revoke?: boolean;
    }) =>
      revoke
        ? api.revokeWorkspaceMembership(id)
        : api.changeWorkspaceMemberRole(id, role as WorkspaceRole),
    onSuccess: async () => {
      toastUtils.success('Membership updated', 'Workspace access has been updated.');
      await onChanged();
    },
    onError: (error) =>
      toastUtils.error('Membership update failed', extractError(error)),
  });

  return (
    <section className="data-panel workspace-panel">
      <PanelHeading
        icon={<Users size={20} />}
        title="Members"
        description="Update a member role or remove their workspace access."
      />
      {loading ? (
        <div className="inline-loading">Loading members…</div>
      ) : (
        <div className="workspace-list">
          {members
            .filter((member) => member.is_active)
            .map((member) => (
              <div className="workspace-list-row" key={member.id}>
                <div>
                  <strong>{member.user_name || member.user_email}</strong>
                  <small>{member.user_email}</small>
                </div>
                <div className="workspace-row-actions">
                  <select
                    aria-label={`Role for ${member.user_email}`}
                    value={member.role}
                    onChange={(event) =>
                      mutation.mutate({
                        id: member.id,
                        role: event.target.value as WorkspaceRole,
                      })
                    }
                  >
                    {WORKSPACE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      mutation.mutate({ id: member.id, revoke: true })
                    }
                  >
                    <UserMinus /> Remove
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

function PanelHeading({
  icon,
  title,
  description,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>) {
  return (
    <div className="workspace-panel-heading">
      <div>
        {icon}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}