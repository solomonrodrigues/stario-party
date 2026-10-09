<script lang="ts">
  import { icons, type IconName } from '../icons';

  interface Props {
    name: IconName;
    size?: string;
  }

  let { name, size = '1em' }: Props = $props();

  // Unknown names render nothing — e.g. an outcome persisted before icons existed.
  const paths = $derived(icons[name] ?? []);
</script>

<svg
  viewBox="0 0 512 512"
  width={size}
  height={size}
  fill="currentColor"
  aria-hidden="true"
>
  {#each paths as d (d)}<path {d} />{/each}
</svg>

<style>
  svg {
    display: inline-block;
    vertical-align: -0.125em;
    flex: none;
  }
</style>
