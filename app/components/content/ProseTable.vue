<template>
  <div w-full overflow-x-auto>
    <table class="tableRoot">
      <slot />
    </table>
  </div>
</template>

<style lang="scss" scoped>
.tableRoot {
  width: 100%;
  table-layout: auto;
  border-collapse: separate;

  border-spacing: 1px 0.5px; /* 間 */

  border-top: 2px solid var(--foreground);
  border-bottom: 2px solid var(--foreground);

  /* セル全部 */
  :deep(th),
  :deep(td) {
    padding: 0.75rem 1rem;
    white-space: nowrap;
  }

  /* 見出し */
  :deep(th) {
    border-bottom: 0.6px solid var(--foreground);
    border-left: 1px solid var(--borderColor);
    &:first-child {
      border-left-width: 0;
    }
  }

  /* tbodyの各行の枠線 */
  :deep(tbody tr) {
    td {
      border-top: 1px solid var(--borderColor);
      border-left: 1px solid var(--borderColor);
      &:first-child {
        border-left-width: 0;
      }
    }

    /* 最初の１行 */
    &:first-child td {
      border-top-color: var(--foreground);
      border-top-width: 0.6px;
    }
  }
}
</style>
