import { useEffect, useState } from 'react';
import { ArrowRight, Database, Search } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { api } from '~/lib/api/soaird-client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '~/features/workspaces/workspace-context';

export function AssessmentDatasetDialog({
  open,
  onOpenChange,
  onSelect,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (datasetCode: string) => void;
}>) {
  const [query, setQuery] = useState('');
  const { scopeQuery } = useWorkspace();
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(query);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const params = new URLSearchParams({
    page_size: '25',
    page: String(page),
    search: term,
  });
  const scope = scopeQuery(params.toString());
  const datasetsQuery = useQuery({
    queryKey: ['assessment-dataset-picker', scope],
    queryFn: () => api.datasets(scope),
    enabled: open,
  });
  const loading = datasetsQuery.isPending;
  const datasets = datasetsQuery.data?.results ?? [];
  const visibleDatasets = datasets;

  const close = () => {
    setQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a dataset to assess</DialogTitle>
          <DialogDescription>
            Only datasets available in the active workspace are shown. Choosing
            one opens the assessment setup form; it does not start a run.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search datasets"
            className="pl-9"
            placeholder="Search by name, code, domain, country, or owner"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
          {loading ? (
            <p className="inline-loading">Loading workspace datasets…</p>
          ) : null}

          {!loading && visibleDatasets.length === 0 ? (
            <div className="assessment-empty-state">
              <Database size={28} />
              <h3>
                {datasets.length
                  ? 'No matching datasets'
                  : 'No datasets available'}
              </h3>
              <p>
                {datasets.length
                  ? 'Try a different search term.'
                  : 'Register or import a dataset in this workspace before creating an assessment.'}
              </p>
            </div>
          ) : null}

          {visibleDatasets.map((dataset) => (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={dataset.dataset_code}
              onClick={() => {
                setQuery('');
                onSelect(dataset.dataset_code);
              }}
            >
              <span className="assessment-icon shrink-0">
                <Database size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate">{dataset.name}</strong>
                <small className="mt-1 block text-muted-foreground">
                  {[dataset.dataset_code, dataset.domain, dataset.country]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
              <ArrowRight className="size-4 shrink-0 text-primary" />
            </button>
          ))}
        </div>

        {datasetsQuery.isError && (
          <p role="alert">{datasetsQuery.error.message}</p>
        )}
        {(datasetsQuery.data?.count ?? 0) > 25 && (
          <div className="report-pagination">
            <Button
              variant="outline"
              disabled={!datasetsQuery.data?.previous}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              variant="outline"
              disabled={!datasetsQuery.data?.next}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
