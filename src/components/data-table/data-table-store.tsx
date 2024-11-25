import { ColumnFiltersState, RowSelectionState } from "@tanstack/table-core";
import { ReactNode, createContext, useContext } from "react";
import { create } from "zustand";

export interface DataTableStoreContextValue {
  tables: Record<string, object[]>;
  tableRowSelected: Record<string, RowSelectionState>;
  tableIsFresh: Record<string, boolean>;
  tableFiltering: Record<string, ColumnFiltersState>;
  setData: (tableId: string, data: object[]) => void;
  setRowSelected: (tableId: string, rows: RowSelectionState) => void;
  addRow: (tableId: string, data: object) => void;
  removeRow: (tableId: string, dataId: string) => void;
  getData: (tableId: string) => object[];
  getRowSelected: (tableId: string) => RowSelectionState;
  getIsFresh: (tableId: string) => boolean;
  setIsFresh: (tableId: string, newState: boolean) => void;
  getFiltering: (tableId: string) => ColumnFiltersState;
  setFiltering: (tableId: string, filter: ColumnFiltersState) => void;
  clean: () => void;
  cleanTable: (tableId: string) => void;
}

const useDataTableStore = create<DataTableStoreContextValue>((set, get) => ({
  tables: {},
  tableRowSelected: {},
  tableIsFresh: {},
  tableFiltering: {},
  setData: (tableId, newData) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: newData,
      },
    })),
  setRowSelected: (tableId, rows) =>
    set((state) => ({
      tableRowSelected: {
        ...state.tableRowSelected,
        [tableId]: rows,
      },
    })),
  addRow: (tableId, row) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: [...(state.tables[tableId] || []), row],
      },
    })),
  removeRow: (tableId, rowId) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: state.tables[tableId].filter(
          (row) => (row as { id: string }).id != rowId,
        ),
      },
    })),
  getData: (tableId) => {
    const state = get();
    return state.tables[tableId] || [];
  },
  /*getRowSelected: (tableId) => {
    const state = get();
    const selectedRows = state.tableRowSelected[tableId] || {};

    // Filtra las filas seleccionadas por su posición en el array
    const selectedRowIndices = Object.entries(selectedRows)
      .filter(([, value]) => value === true)
      .map(([index]) => parseInt(index, 10)); // Convertimos el índice de string a número

    // Devuelve los datos de las filas seleccionadas según sus posiciones en el array
    return (
      state.tables[tableId]?.filter((_row, index) =>
        selectedRowIndices.includes(index),
      ) || []
    );
  },*/
  getRowSelected: (tableId) => {
    const state = get();
    return state.tableRowSelected[tableId] || [];
  },
  setIsFresh: (tableId, newState) =>
    set((state) => ({
      tableIsFresh: {
        ...state.tableIsFresh,
        [tableId]: newState,
      },
    })),
  getIsFresh: (tableId) => {
    const state = get();
    return state.tableIsFresh[tableId] || false;
  },
  setFiltering: (tableId, newState) =>
    set((state) => ({
      tableFiltering: {
        ...state.tableFiltering,
        [tableId]: newState,
      },
    })),
  getFiltering: (tableId) => {
    const state = get();
    return state.tableFiltering[tableId] || [];
  },
  clean: () =>
    set(() => ({
      tables: {},
      tableRowSelected: {},
      tableIsFresh: {},
      tableFiltering: {},
    })),
  cleanTable: (tableId) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: [],
      },
      tableRowSelected: {
        ...state.tableRowSelected,
        [tableId]: {},
      },
      tableIsFresh: {
        ...state.tableIsFresh,
        [tableId]: false,
      },
      tableFiltering: {
        ...state.tableFiltering,
        [tableId]: [],
      },
    })),
}));

export const DataTableStoreContext = createContext<
  DataTableStoreContextValue | undefined
>(undefined);

export const DataTableStoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const store = useDataTableStore();

  return (
    <DataTableStoreContext.Provider value={store}>
      {children}
    </DataTableStoreContext.Provider>
  );
};

export const useDataTableStoreContext = () => {
  const context = useContext(DataTableStoreContext);
  if (!context) {
    throw new Error(
      "useDataTableStoreContext must be used within a DataTableStoreProvider",
    );
  }
  return context;
};
