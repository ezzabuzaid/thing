import { pipeline } from '@huggingface/transformers';

const labels = [
  'Thought',
  'Task',
  'Bookmark',
  'Event',
  'Meeting',
  'Reminder',
  'Journal',
];

type Label = (typeof labels)[number];

/**
 * Classifies the user input into one of the predefined categories using zero-shot classification.
 */
export async function classify(userInput: string) {
  // Load the zero-shot classification pipeline with a compatible model
  const classifier = await pipeline(
    'zero-shot-classification',
    'Xenova/nli-deberta-v3-base',
    { dtype: 'auto', device: 'wasm' },
  );

  const result = await classifier(userInput, labels);
  console.log('Classification result:', result);
  if (Array.isArray(result)) {
    throw new Error('Unexpected array result from classifier');
  }
  return result.labels[0];
}

/**
 * Distills (extracts) named entities from the classified result using NER.
 */
export async function distill(label: Label, userInput: string) {
  const nerPipeline = await pipeline(
    'token-classification',
    'Xenova/bert-base-NER',
    { device: 'cpu', dtype: 'q8' },
  );

  const entities = await nerPipeline(userInput);
  return {
    category: label,
    entities: entities,
  };
}
