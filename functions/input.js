export function getGridColumns(items) {
  if (!items.length) return 1;
  const firstTop = items[0].offsetTop;
  let columns = 0;
  for (const item of items) {
    if (item.offsetTop === firstTop) columns += 1;
    else break;
  }
  return Math.max(1, columns);
}

export function moveGridFocus(items, hoverIndex, key) {
  const columns = getGridColumns(items);
  let next = hoverIndex;

  if (key === "ArrowRight") next += 1;
  if (key === "ArrowLeft") next -= 1;
  if (key === "ArrowDown") next += columns;
  if (key === "ArrowUp") next -= columns;

  if (key === "ArrowRight" && next >= items.length) next = 0;
  if (key === "ArrowLeft" && next < 0) next = items.length - 1;
  if ((key === "ArrowUp" || key === "ArrowDown") && (next < 0 || next >= items.length)) next = hoverIndex;

  return next;
}
