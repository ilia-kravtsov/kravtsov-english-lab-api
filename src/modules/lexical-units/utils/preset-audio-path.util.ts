export function toPresetAudioBaseName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildExpressionsPresetAudioAssets(value: string) {
  const base = toPresetAudioBaseName(value);

  return {
    audioAsset: `expressions/${base}.webm`,
    soundMeaningAsset: `expressions/${base}_meaning.webm`,
    soundExampleAsset: `expressions/${base}_example.webm`,
  };
}