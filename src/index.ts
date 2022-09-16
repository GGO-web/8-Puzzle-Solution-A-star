import { CLEAN_RESULT, directions } from "./constants";
import { ICoordinate, IResult, IState } from "./index.models";
import {
   displayBoard,
   getEmpyCellCoords,
   isOutOfBorder,
   setUIGameStates,
   statesAreEqual,
} from "./helpers";
import { Node } from "./node";

let results: IResult = CLEAN_RESULT;

const DFS = function (
   final: IState,
   states: Array<{ state: IState; index: number }>,
   db: Map<string, boolean>,
   queue: Node[]
) {
   while (queue.length) {
      let currentState: Node | null = queue.pop() as Node;

      results = {
         ...results,
         currentState: currentState,
         settled: db.size,
         depth: currentState.getDepth(),
         haveSolution: false,
      };

      if (statesAreEqual(currentState.getState(), final)) {
         results.haveSolution = true;
         return states;
      }

      const emptyCell = getEmpyCellCoords(currentState.getState());

      directions.forEach((direction) => {
         const copyState: IState | null = currentState
            ?.getState()
            ?.map((row) => [...row]) as IState;

         // coords cell to switch
         const coords: ICoordinate = {
            x: emptyCell.x + direction.x,
            y: emptyCell.y + direction.y,
            name: direction.name,
         };

         // if coords of swapped cell is not out the border of the field
         if (!isOutOfBorder(coords)) {
            // move empty cell into current direction
            [
               copyState[emptyCell.x][emptyCell.y],
               copyState[coords.x][coords.y],
            ] = [
               copyState[coords.x][coords.y],
               copyState[emptyCell.x][emptyCell.y],
            ];

            results.moves++;

            // if swapped state is not present in database
            if (!db.get(copyState.toString())) {
               queue.push(
                  new Node(
                     copyState,
                     currentState,
                     direction.name,
                     currentState!.getDepth() + 1,
                     0
                  )
               );
               db.set(copyState.toString(), true);
               states.push({ state: copyState, index: results.moves + 1 });
            } else {
               results.dropped++;
            }
         }
      });
   }

   return states;
};

(() => {
   let allStates: Array<{ state: IState; index: number }> = [];

   const nextStateButton = document.querySelector(".next") as HTMLButtonElement;
   const resultButton = document.querySelector(".result") as HTMLButtonElement;
   const findButton = document.querySelector(".find") as HTMLButtonElement;
   const resultContent = document.getElementById(
      "result-content"
   ) as HTMLElement;

   const initialStateTable = document.querySelector(
      ".initial-state"
   ) as HTMLTableElement;
   const finalStateTable = document.querySelector(
      ".final-state"
   ) as HTMLTableElement;

   const changeStateButtons = document.querySelectorAll(
      ".change-state-input-button"
   );
   const initialInput = document.getElementById(
      "initial-input"
   ) as HTMLInputElement;
   const finalInput = document.getElementById(
      "final-input"
   ) as HTMLInputElement;

   let indexOfNextState = 0;
   const resultsWrapper = document.getElementById("results") as Element;

   const getTableState = (table: HTMLTableElement): IState => {
      const state: IState = [];
      for (let row of table.rows) {
         const stateRow = [];
         for (let cell of row.cells) {
            const cellData = parseInt(cell.innerHTML);

            Number.isNaN(cellData)
               ? stateRow.push(null)
               : stateRow.push(cellData);
         }
         state.push(stateRow);
      }

      return state;
   };

   const setTableState = (table: HTMLTableElement, stateToChange: IState) => {
      for (let i = 0; i < 3; ++i) {
         const row: HTMLTableRowElement = table.rows[i];
         for (let j = 0; j < 3; ++j) {
            const cell: HTMLTableCellElement = row.cells[j];
            cell.innerHTML = String(stateToChange[i][j] || " ");
         }
      }
   };

   const getStateToChange = (input: HTMLInputElement) => {
      return input.value
         .replace(/-/g, " ")
         .split(" ")
         .reduce(
            (prev: IState, current: any, index: number): any => {
               prev[Math.floor(index / 3)].push(parseInt(current) || null);

               return prev;
            },
            [[], [], []] as IState
         );
   };

   const unlockButtons = () => {
      nextStateButton.disabled = false;
      resultButton.disabled = false;
   };

   const disableButtons = () => {
      nextStateButton.disabled = true;
      resultButton.disabled = true;
   };

   const printResults = () => {
      resultContent.innerHTML = "";

      if (!results.haveSolution) {
         console.log(`Кількість відвіданих станів: ${results.moves}`);
         console.log(`Кількість станів занесених у БД: ${results.settled}`);
         console.log(`Кількість відкинутих станів: ${results.dropped}`);
         console.log("Гра у 8 немає розв'язків");

         resultContent.insertAdjacentHTML(
            "beforeend",
            `
            <code>
            <pre>Кількість відвіданих станів : ${results.moves}<br>Кількість станів занесених у БД : ${results.settled}<br>Кількість відкинутих станів : ${results.dropped}<br>Гра у 8 немає розв'язків</pre>
            </code>
         `
         );
      } else {
         console.log("Порядок переміщень для розв'язку гри в 8:");
         results?.currentState?.pathFromStart();
         console.log(`Кількість відвіданих станів: ${results.moves}`);
         console.log(`Кількість станів занесених у БД: ${results.settled}`);
         console.log(`Кількість відкинутих станів: ${results.dropped}`);
         console.log(
            `Глибина дерева пошуку на якій знайдено рішення: ${results.depth}`
         );

         resultContent.insertAdjacentHTML(
            "beforeend",
            `
            <code>
            <pre>Кількість відвіданих станів: ${results.moves}<br>Кількість станів занесених у БД: ${results.settled}<br>Кількість відкинутих станів: ${results.dropped}<br>Глибина дерева пошуку на якій знайдено рішення: ${results.depth}</pre>
            </code>
         `
         );
      }
   };

   const findResults = () => {
      const initial = getTableState(initialStateTable);
      const final = getTableState(finalStateTable);

      // reset step by step results output
      indexOfNextState = 0;
      results = CLEAN_RESULT;
      (resultsWrapper as any).innerHTML = null;

      const db: Map<string, boolean> = new Map();
      db.set(initial.toString(), true);
      const queue = [new Node(initial, null, null, 0, 0)];

      allStates = DFS(final, [{ state: initial, index: 1 }], db, queue);
      unlockButtons();
   };

   setUIGameStates();
   disableButtons();

   nextStateButton?.addEventListener("click", () => {
      if (indexOfNextState >= allStates.length - 1) {
         nextStateButton.disabled = true;
      }

      // Add next new state table to the view
      const table = document.createElement("table");
      table.className +=
         "table table-primary table-hover table-bordered table-sm align-middle caption-top";
      table.style.width = "200px";
      table.style.height = "200px";
      table.style.textAlign = "center";

      table.insertAdjacentHTML(
         "afterbegin",
         `
            <caption class="fw-bold text-primary">
               Index of the state is ${allStates[indexOfNextState].index}
            </caption>
         `
      );

      const tbody = document.createElement("tbody");
      for (let row of allStates[indexOfNextState].state) {
         const tableRow = tbody.insertRow();

         for (let col of row) {
            const td = tableRow.insertCell();
            td.classList.add("align-middle");
            if (!col) {
               td.innerHTML = " ";
            } else {
               td.innerHTML = String(col);
            }
         }
      }

      table.appendChild(tbody);
      resultsWrapper?.appendChild(table);

      resultsWrapper.scrollTop = resultsWrapper.scrollHeight;

      // print results to the console
      displayBoard(
         allStates[indexOfNextState].state,
         allStates[indexOfNextState].index
      );

      indexOfNextState++;
   });

   resultButton?.addEventListener("click", () => {
      printResults();
   });

   findButton?.addEventListener("click", findResults);

   changeStateButtons.forEach((button) => {
      button.addEventListener("click", () => {
         const input = button.previousElementSibling as HTMLInputElement;
         const table = input
            .closest(".col")
            ?.querySelector(".table") as HTMLTableElement;

         let stateToChange = getStateToChange(input);
         setTableState(table, stateToChange);
      });
   });

   [initialInput, finalInput].forEach((input: HTMLInputElement) =>
      input.addEventListener("input", () => {
         const stateToChange = getStateToChange(input);

         let countMissing = 0;
         for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
               if (!stateToChange[i][j]) countMissing++;
            }
         }

         const button = input.nextElementSibling as HTMLButtonElement;
         if (countMissing <= 1) {
            button.disabled = false;
         } else {
            button.disabled = true;
         }
      })
   );
})();
