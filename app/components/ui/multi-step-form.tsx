import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// ── Imperative step validator context ────────────────────────────────────────

type ValidateFn = () =>
  | boolean
  | StepValidationResult
  | Promise<boolean | StepValidationResult>;

interface MultiStepFormContextValue {
  /** Called by step components to register their own validator imperatively. */
  setStepValidator: (fn: ValidateFn | null) => void;
}

const MultiStepFormContext = createContext<MultiStepFormContextValue>({
  setStepValidator: () => {},
});

/**
 * Register an imperative validator for the current step.
 *
 * Call this inside the step component. The validator runs when the user
 * clicks "Next" or "Submit". It takes priority over `StepConfig.validate`.
 *
 * @example
 * ```tsx
 * function StepPersonal() {
 *   const { trigger } = useFormContext<MySchema>();
 *   useStepValidator(() => trigger(['first_name', 'email']));
 *   return <FormTextField ... />;
 * }
 * ```
 */
export function useStepValidator(fn: ValidateFn) {
  const { setStepValidator } = useContext(MultiStepFormContext);
  // Use a ref so the latest fn is always called without re-registering on every render.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    setStepValidator(() => fnRef.current());
    return () => setStepValidator(null);
  }, [setStepValidator]);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StepValidationResult {
  valid: boolean;
  /** Field-level errors: { fieldName: "error message" } */
  errors?: Record<string, string>;
}

export interface StepConfig {
  /** Unique key for the step. */
  key: string;
  /** Label shown in the stepper. */
  label: string;
  /** Icon shown in the stepper (optional). */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Validate before allowing navigation to next step.
   * Return `true`/`false` for simple validation, or a `StepValidationResult`
   * for field-level error messages.
   */
  validate?: () =>
    | boolean
    | StepValidationResult
    | Promise<boolean | StepValidationResult>;
}

/** Navigation context passed to renderHeader / renderFooter overrides. */
export interface StepNavigation {
  /** All step configs. */
  steps: StepConfig[];
  /** Zero-based index of the active step. */
  currentIndex: number;
  /** The active step config. */
  currentStep: StepConfig;
  /** Whether the current step is the first. */
  isFirst: boolean;
  /** Whether the current step is the last. */
  isLast: boolean;
  /** Set of visited step indices. */
  visitedSteps: ReadonlySet<number>;
  /** Whether the form is currently submitting. */
  isSubmitting: boolean;
  /** Validation errors for the current step. */
  fieldErrors: Record<string, string>;
  /** Go to the previous step. */
  goBack: () => void;
  /** Validate and go to the next step. */
  goNext: () => Promise<void>;
  /** Validate and submit the form. */
  submit: () => Promise<void>;
  /** Jump to a visited step (only when `allowFreeNavigation` is true). */
  jumpTo: (index: number) => void;
}

interface MultiStepFormProps {
  /** Step configuration array. */
  steps: StepConfig[];
  /** Render function for each step. Receives the step key, index, and current validation errors. */
  children: (
    step: StepConfig,
    index: number,
    errors: Record<string, string>
  ) => ReactNode;
  /** Called when the final step's submit button is clicked. */
  onSubmit: () => void | Promise<void>;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
  /** Label for the final submit button. Defaults to "Submit". */
  submitLabel?: string;
  /** Label for the next button. Defaults to "Next". */
  nextLabel?: string;
  /** Label for the previous button. Defaults to "Previous". */
  prevLabel?: string;
  /** Whether to wrap each step content in a Card. Defaults to true. */
  showCard?: boolean;
  /** Additional class for the root container. */
  className?: string;
  /** Error message to show below the form. */
  error?: string;
  /** Extra actions to show next to the navigation buttons (e.g. "Save Draft"). */
  extraActions?: (currentStep: number) => ReactNode;
  /**
   * Index of the step to start on. Defaults to 0.
   * Pass the index of the step to resume (e.g. for edit flows where data is
   * already populated). All preceding steps are treated as visited and become
   * directly clickable when `allowFreeNavigation` is true.
   */
  defaultStep?: number;
  /**
   * Allow clicking any visited step indicator to jump directly to that step.
   * Useful for edit flows where all fields are pre-populated.
   * Defaults to false (sequential only).
   */
  allowFreeNavigation?: boolean;
  /**
   * Override the default stepper header. Receives step navigation context
   * so you can build a custom stepper while staying wired to the form state.
   * Return `null` to hide the header entirely.
   */
  renderHeader?: (nav: StepNavigation) => ReactNode;
  /**
   * Override the default navigation footer. Receives step navigation context
   * so you can build custom prev/next/submit buttons while staying wired to
   * the form state. Return `null` to hide the footer entirely.
   */
  renderFooter?: (nav: StepNavigation) => ReactNode;
}

/**
 * A reusable, configurable multi-step form component.
 *
 * @example
 * ```tsx
 * <MultiStepForm
 *   steps={[
 *     { key: 'info', label: 'Basic Info', validate: () => !!title },
 *     { key: 'files', label: 'Files' },
 *     { key: 'review', label: 'Review' },
 *   ]}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isPending}
 *   submitLabel="Publish"
 * >
 *   {(step) => {
 *     switch (step.key) {
 *       case 'info': return <InfoStep />;
 *       case 'files': return <FilesStep />;
 *       case 'review': return <ReviewStep />;
 *     }
 *   }}
 * </MultiStepForm>
 * ```
 */
export function MultiStepForm({
  steps,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  prevLabel = 'Previous',
  showCard = true,
  className,
  error,
  extraActions,
  defaultStep = 0,
  allowFreeNavigation = false,
  renderHeader,
  renderFooter,
}: Readonly<MultiStepFormProps>) {
  const clampedDefault = Math.min(Math.max(defaultStep, 0), steps.length - 1);
  const [currentIndex, setCurrentIndex] = useState(clampedDefault);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const stepValidatorRef = useRef<ValidateFn | null>(null);
  // Track which step indices have been reached so free-navigation only allows
  // jumping to steps the user has already seen (or that were pre-populated).
  const [visitedSteps, setVisitedSteps] = useState<ReadonlySet<number>>(
    () => new Set(Array.from({ length: clampedDefault + 1 }, (_, i) => i))
  );

  const contextValue = useMemo<MultiStepFormContextValue>(
    () => ({
      setStepValidator: (fn) => {
        stepValidatorRef.current = fn;
      },
    }),
    []
  );

  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  const runValidation = async (): Promise<boolean> => {
    // Imperative validator (registered by step component) takes priority.
    const validator = stepValidatorRef.current ?? currentStep.validate;
    if (!validator) return true;
    const result = await validator();
    if (typeof result === 'boolean') {
      if (result) {
        setFieldErrors({});
      } else {
        setFieldErrors({ _form: 'Please fill in all required fields.' });
      }
      return result;
    }
    // StepValidationResult
    setFieldErrors(result.errors ?? {});
    return result.valid;
  };

  const handleNext = async () => {
    const valid = await runValidation();
    if (!valid) return;
    if (!isLast) {
      const next = currentIndex + 1;
      setFieldErrors({});
      setVisitedSteps((prev) => new Set([...prev, next]));
      setCurrentIndex(next);
    }
  };

  const handleJumpTo = (index: number) => {
    if (!allowFreeNavigation) return;
    if (!visitedSteps.has(index)) return;
    setFieldErrors({});
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    if (!isFirst) {
      setFieldErrors({});
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    const valid = await runValidation();
    if (!valid) return;
    await onSubmit();
  };

  const content = children(currentStep, currentIndex, fieldErrors);

  const nav: StepNavigation = {
    steps,
    currentIndex,
    currentStep,
    isFirst,
    isLast,
    visitedSteps,
    isSubmitting,
    fieldErrors,
    goBack: handlePrev,
    goNext: handleNext,
    submit: handleSubmit,
    jumpTo: handleJumpTo,
  };

  const defaultHeader = (
    <div className="flex gap-1">
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const isJumpable =
          allowFreeNavigation && visitedSteps.has(i) && !isActive;
        const Wrapper = isJumpable ? 'button' : 'div';
        return (
          <Wrapper
            key={step.key}
            className={cn('flex-1 text-left', isJumpable && 'cursor-pointer')}
            {...(isJumpable
              ? { type: 'button' as const, onClick: () => handleJumpTo(i) }
              : {})}
          >
            <div
              className={cn(
                'h-1.5 rounded-full transition-colors',
                isDone && 'bg-primary',
                isActive && !isDone && 'bg-primary/80',
                !isDone && !isActive && 'bg-muted'
              )}
            />
            <div className="mt-1.5 flex items-center justify-center gap-1">
              {step.icon && (
                <step.icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              )}
              <p
                className={cn(
                  'text-xs text-center',
                  isActive && 'font-medium text-primary',
                  !isActive &&
                    isJumpable &&
                    'text-primary/70 underline-offset-2 hover:underline',
                  !isActive && !isJumpable && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );

  const defaultFooter = (
    <div className="flex items-center justify-between">
      <Button variant="outline" disabled={isFirst} onClick={handlePrev}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        {prevLabel}
      </Button>

      <div className="flex items-center gap-2">
        {extraActions?.(currentIndex)}

        {isLast ? (
          <Button
            className="bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        ) : (
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleNext}
          >
            {nextLabel}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <MultiStepFormContext.Provider value={contextValue}>
      <div className={cn('space-y-6', className)}>
        {/* Stepper header */}
        {renderHeader ? renderHeader(nav) : defaultHeader}

        {/* Step content */}
        {showCard ? (
          <Card>
            <CardContent className="p-6">{content}</CardContent>
          </Card>
        ) : (
          content
        )}

        {/* Field errors */}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Please fix the following errors:
            </div>
            <ul className="list-disc pl-9 text-sm text-destructive space-y-0.5">
              {Object.entries(fieldErrors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submission error */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Navigation footer */}
        {renderFooter ? renderFooter(nav) : defaultFooter}
      </div>
    </MultiStepFormContext.Provider>
  );
}
