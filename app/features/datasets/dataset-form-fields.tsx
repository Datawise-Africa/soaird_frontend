import type { Control } from 'react-hook-form';
import {
  FormPickerField,
  FormTextField,
  FormTextareaField,
} from '~/components/form-fields';
import type { DatasetRegistrationInput } from '~/lib/schema/dataset.schema';

const DOMAIN_OPTIONS = [
  'Agriculture',
  'Climate and environment',
  'Education',
  'Finance',
  'Governance',
  'Health',
  'Language',
  'Mobility',
  'Other',
].map((label) => ({ value: label, label }));

const MODALITY_OPTIONS = [
  'Tabular',
  'Text',
  'Image',
  'Audio',
  'Video',
  'Geospatial',
  'Multimodal',
  'Other',
].map((label) => ({ value: label, label }));

const ACCESSIBILITY_OPTIONS = [
  'Public download',
  'Registration required',
  'Access on request',
  'Restricted',
  'Paid or commercial',
  'Not yet verified',
].map((label) => ({ value: label, label }));

const METADATA_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown / not verified' },
];

export const EMPTY_DATASET: DatasetRegistrationInput = {
  name: '',
  domain: '',
  country: '',
  region: '',
  geographic_scope: '',
  modality: '',
  hosting_platform: '',
  accessibility: '',
  metadata_available: '',
  source_url: '',
  licence: '',
  owner: '',
  contact: '',
  intended_use_case: '',
  challenges_notes: '',
};

export function DatasetFormFields({
  control,
}: Readonly<{ control: Control<DatasetRegistrationInput> }>) {
  return (
    <>
      <div className="sm:col-span-2">
        <FormTextField
          control={control}
          name="name"
          label="Dataset name"
          required
          placeholder="e.g. Sesame Plant Segmentation Dataset"
        />
      </div>
      <FormPickerField
        control={control}
        name="domain"
        label="Domain or sector"
        options={DOMAIN_OPTIONS}
        placeholder="Select a domain"
      />
      <FormPickerField
        control={control}
        name="modality"
        label="Data modality"
        options={MODALITY_OPTIONS}
        placeholder="Select a modality"
      />
      <FormTextField
        control={control}
        name="country"
        label="Country"
        placeholder="e.g. Nigeria"
      />
      <FormTextField
        control={control}
        name="region"
        label="Region"
        placeholder="e.g. West Africa"
      />
      <FormTextField
        control={control}
        name="geographic_scope"
        label="Geographic coverage"
        placeholder="National, state, district or community coverage"
      />
      <FormTextField
        control={control}
        name="hosting_platform"
        label="Hosting platform"
        placeholder="e.g. Kaggle, Zenodo or institutional repository"
      />
      <FormPickerField
        control={control}
        name="accessibility"
        label="Accessibility"
        options={ACCESSIBILITY_OPTIONS}
        placeholder="Select access conditions"
      />
      <FormPickerField
        control={control}
        name="metadata_available"
        label="Metadata available?"
        options={METADATA_OPTIONS}
        placeholder="Select an answer"
      />
      <FormTextField
        control={control}
        name="licence"
        label="Licence"
        placeholder="e.g. MIT or CC BY 4.0"
      />
      <div className="sm:col-span-2">
        <FormTextField
          control={control}
          name="source_url"
          label="Source URL"
          type="url"
          placeholder="https://example.org/dataset"
        />
      </div>
      <FormTextField
        control={control}
        name="owner"
        label="Dataset owner or publisher"
        placeholder="Person or institution responsible for the dataset"
      />
      <FormTextField
        control={control}
        name="contact"
        label="Contact"
        placeholder="Contact name or email"
      />
      <div className="sm:col-span-2">
        <FormTextareaField
          control={control}
          name="intended_use_case"
          label="Intended use case"
          rows={3}
          placeholder="How this dataset may be used"
        />
      </div>
      <div className="sm:col-span-2">
        <FormTextareaField
          control={control}
          name="challenges_notes"
          label="Known challenges or notes"
          rows={3}
          placeholder="Known limitations, gaps or access constraints"
        />
      </div>
    </>
  );
}