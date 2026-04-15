"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  EntityWithClasses,
  Holder,
  Holding,
  TransactionWithAttachments,
} from "@/data/types";
import {
  fetchEntitiesWithClasses,
  fetchHolders,
  fetchHoldings,
  fetchTransactionsWithAttachments,
} from "@/lib/dal";

// ── State ──

export interface DashboardState {
  entities: EntityWithClasses[];
  holders: Holder[];
  holdings: Holding[];
  transactions: TransactionWithAttachments[];
  changeLogOpen: boolean;
  activeModal:
    | "recordTransaction"
    | "addHolder"
    | "entitySetup"
    | "entitySettings"
    | null;
  loading: boolean;
  error: string | null;
}

// ── Actions ──

export type DashboardAction =
  | {
      type: "INIT_DATA";
      entities: EntityWithClasses[];
      holders: Holder[];
      holdings: Holding[];
      transactions: TransactionWithAttachments[];
    }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_CHANGELOG" }
  | { type: "OPEN_MODAL"; modal: DashboardState["activeModal"] }
  | { type: "CLOSE_MODAL" }
  | { type: "ADD_HOLDER"; holder: Holder }
  | { type: "ADD_ENTITY"; entity: EntityWithClasses }
  | { type: "UPDATE_ENTITY"; entity: EntityWithClasses }
  | {
      type: "RECORD_TRANSACTION";
      transaction: TransactionWithAttachments;
      holdingsUpdates: Holding[];
    };

// ── Reducer ──

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "INIT_DATA":
      return {
        ...state,
        entities: action.entities,
        holders: action.holders,
        holdings: action.holdings,
        transactions: action.transactions,
        loading: false,
        error: null,
      };

    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };

    case "TOGGLE_CHANGELOG":
      return { ...state, changeLogOpen: !state.changeLogOpen };

    case "OPEN_MODAL":
      return { ...state, activeModal: action.modal };

    case "CLOSE_MODAL":
      return { ...state, activeModal: null };

    case "ADD_HOLDER":
      return { ...state, holders: [...state.holders, action.holder] };

    case "ADD_ENTITY":
      return {
        ...state,
        entities: [...state.entities, action.entity],
        activeModal: null,
      };

    case "UPDATE_ENTITY":
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.entity.id ? action.entity : e
        ),
        activeModal: null,
      };

    case "RECORD_TRANSACTION": {
      // Merge holdings updates
      const updatedHoldings = [...state.holdings];
      for (const update of action.holdingsUpdates) {
        const idx = updatedHoldings.findIndex((h) => h.id === update.id);
        if (idx >= 0) {
          updatedHoldings[idx] = update;
        } else {
          updatedHoldings.push(update);
        }
      }
      return {
        ...state,
        transactions: [action.transaction, ...state.transactions],
        holdings: updatedHoldings,
        activeModal: null,
      };
    }

    default:
      return state;
  }
}

// ── Initial State ──

const initialState: DashboardState = {
  entities: [],
  holders: [],
  holdings: [],
  transactions: [],
  changeLogOpen: false,
  activeModal: null,
  loading: true,
  error: null,
};

// ── Context ──

const DashboardContext = createContext<DashboardState>(initialState);
const DashboardDispatchContext = createContext<Dispatch<DashboardAction>>(
  () => {}
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  useEffect(() => {
    async function loadData() {
      try {
        const [entities, holders, holdings, transactions] = await Promise.all([
          fetchEntitiesWithClasses(),
          fetchHolders(),
          fetchHoldings(),
          fetchTransactionsWithAttachments(),
        ]);
        dispatch({ type: "INIT_DATA", entities, holders, holdings, transactions });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to load data",
        });
      }
    }
    loadData();
  }, []);

  return (
    <DashboardContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

export function useDashboardDispatch() {
  return useContext(DashboardDispatchContext);
}
