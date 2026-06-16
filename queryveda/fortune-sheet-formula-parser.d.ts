declare module "@fortune-sheet/formula-parser" {
  interface CellCoord {
    label: string;
    row: { index: number };
    column: { index: number };
  }

  interface ParseResult {
    result: number | string | boolean | null;
    error: string | null;
  }

  export class Parser {
    parse(expression: string): ParseResult;
    on(
      event: "callCellValue",
      callback: (
        cellCoord: CellCoord,
        sheetName: unknown,
        done: (value: number | string) => void
      ) => void
    ): void;
    on(
      event: "callRangeValue",
      callback: (
        startCoord: CellCoord,
        endCoord: CellCoord,
        sheetName: unknown,
        done: (values: (number | string)[][]) => void
      ) => void
    ): void;
  }
}
