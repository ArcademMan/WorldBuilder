/**
 * How a single field is rendered inside a layout section column.
 *  - `field`: standard label + input
 *  - `image-{size}`: image preview at a preset size (image fields only)
 *  - `table-row`: row in a key:value table; consecutive `table-row`
 *    items in the same column collapse into one table.
 */
export type LayoutDisplay =
  | "field"
  | "image-small"
  | "image-medium"
  | "image-large"
  | "table-row";

export type LayoutItem = {
  /** Stable id; backend assigns one when missing. */
  id?: string;
  fieldKey: string;
  columnIndex: number;
  display: LayoutDisplay;
};

export type LayoutSection = {
  id?: string;
  title?: string;
  /** 1, 2 or 3. */
  columns: number;
  items: LayoutItem[];
};
