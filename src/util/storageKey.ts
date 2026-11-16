/**
 * Lossless settings key for a user-provided name. The `v2:` marker cannot occur
 * in a legacy slug, so new keys never collide with keys written by slugify().
 */
export default function (name: string): string {
    return `v2:${encodeURIComponent(name)}`;
}
