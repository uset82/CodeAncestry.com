import { COORDINATE_MODES, getGenomeBrowserModel, placeable } from '@/lib/registry/genome';

/**
 * A scratch probe for the genome browser model. Not a test — it prints the
 * shape so the renderer can be built against real numbers instead of guesses.
 */

const model = getGenomeBrowserModel('keylit-kids-es');
if (!model) throw new Error('model missing');

console.log(`${model.genome.name} — ${model.genome.accession}`);
console.log('stats', model.stats);
console.log('paths', model.paths.length, model.paths.slice(0, 3));
console.log('lineage', model.lineage.map((entry) => `${entry.name} G${entry.generation}`).join(' → '));

for (const track of model.tracks) {
  const counts = COORDINATE_MODES.map((mode) => {
    const { placed, unplaced } = placeable(track, mode);
    return `${mode}:${placed.length}/${placed.length + unplaced}`;
  }).join('  ');
  console.log(
    `${track.kind.padEnd(13)} ${String(track.features.length).padStart(3)} features  ${counts}`,
  );
}

console.log('\naxis tick counts', {
  temporal: model.axis.temporal.length,
  repository: model.axis.repository.length,
  semantic: model.axis.semantic.length,
});

const sample = model.tracks[0]?.features[0];
console.log('\nsample gene feature', JSON.stringify(sample, null, 1));

const fitness = model.tracks.find((track) => track.kind === 'fitness');
console.log('\nsample fitness labels', fitness?.features.slice(0, 4).map((f) => f.label));
