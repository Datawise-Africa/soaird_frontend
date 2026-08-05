export const mockCategories = [
  {
    id: '1',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Platform, API and infrastructure work',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Design',
    slug: 'design',
    description: 'Product design and the design system',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

export const mockTasks = [
  {
    id: '1',
    key: 'DW-1',
    title: 'Fix expired auth code on sign-in',
    description: 'Shorten the delay and surface a clear retry action.',
    categoryId: '1',
    categoryName: 'Engineering',
    status: 'in_progress' as const,
    priority: 'urgent' as const,
    assigneeId: 'user-1',
    assigneeName: 'Demo User',
    dueDate: '2026-02-01',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    key: 'DW-2',
    title: 'Audit colour tokens for dark mode',
    categoryId: '2',
    categoryName: 'Design',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];
