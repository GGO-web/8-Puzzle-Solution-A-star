import { ICoordinate } from "./index.models";

export const finalState = [
   [1, 2, 3],
   [4, 5, 6],
   [7, 8, null],
];

export const directions: Array<ICoordinate> = [
   { x: 0, y: -1, name: "⇐" },
   { x: -1, y: 0, name: "⇑" },
   { x: 0, y: 1, name: "⇒" },
   { x: 1, y: 0, name: "⇓" },
];

export const CLEAN_RESULT = {
   currentState: null,
   moves: 0,
   settled: 0,
   dropped: 0,
   depth: 0,
   haveSolution: false,
};
