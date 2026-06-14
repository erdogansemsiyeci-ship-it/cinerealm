// ============================================================================
// CineRealm Test — Mock Supabase Client (Shared Store)
//
// All engine functions share ONE in-memory store. Returns are deep-cloned
// so capturing a reference before an update doesn't see post-update mutations.
// ============================================================================

import { vi } from "vitest";

let store: Record<string, any[]> = {};

export function resetMockStore() {
  store = {};
}

/** Deep-clone to prevent reference-sharing mutations */
function clone<T>(v: T): T {
  if (v === null || v === undefined) return v;
  return JSON.parse(JSON.stringify(v));
}

function buildClient() {
  class ChainBuilder {
    private table: string;
    private ops: Array<{ type: string; payload?: any }> = [];
    private filters: Array<{ col: string; val: any }> = [];
    private orderCol: string | null = null;
    private orderDir: string = "asc";

    constructor(table: string) {
      this.table = table;
    }

    insert(data: any) {
      this.ops.push({ type: "insert", payload: data });
      return this;
    }
    update(data: any) {
      this.ops.push({ type: "update", payload: data });
      return this;
    }
    select(_cols?: string) {
      this.ops.push({ type: "select" });
      return this;
    }
    eq(col: string, val: any) {
      this.filters.push({ col, val });
      return this;
    }
    order(col: string, opts?: { ascending: boolean }) {
      this.orderCol = col;
      this.orderDir = opts?.ascending === false ? "desc" : "asc";
      return this;
    }

    async single(): Promise<{ data: any | null; error: Error | null }> {
      return this.run(true);
    }

    // Allow await on insert/update without .single()
    then(
      resolve?: (value: any) => void,
      reject?: (reason: any) => void,
    ): Promise<any> {
      const promise = this.run(false);
      if (resolve) promise.then(resolve, reject);
      return promise;
    }

    private async run(single: boolean): Promise<{ data: any | null; error: Error | null }> {
      if (!store[this.table]) store[this.table] = [];

      let result: any = null;

      for (const op of this.ops) {
        switch (op.type) {
          case "insert": {
            const id = `mock-${Math.random().toString(36).slice(2, 10)}`;
            const row = {
              id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...op.payload,
            };
            store[this.table].push(row);
            result = row;
            break;
          }
          case "update": {
            let rows = this.filterRows();
            for (const row of rows) {
              Object.assign(row, op.payload, { updated_at: new Date().toISOString() });
            }
            result = single ? rows[0] : rows; // reference OK — we clone before returning
            break;
          }
          case "select": {
            let rows = this.filterRows();
            if (this.orderCol) {
              rows = [...rows].sort((a, b) => {
                const av = a[this.orderCol!];
                const bv = b[this.orderCol!];
                if (av < bv) return this.orderDir === "asc" ? -1 : 1;
                if (av > bv) return this.orderDir === "asc" ? 1 : -1;
                return 0;
              });
            }
            result = single ? (rows[0] || null) : rows;
            break;
          }
        }
      }

      if (this.ops.length === 0) {
        const rows = this.filterRows();
        result = single ? (rows[0] || null) : rows;
      }

      // Clone to prevent reference-sharing bugs — a caller that captures
      // `profile.level` before an update should still see the old value.
      return { data: clone(result), error: null };
    }

    private filterRows(): any[] {
      if (this.filters.length === 0) return [...store[this.table]];
      return (store[this.table] || []).filter((row) =>
        this.filters.every((f) => row[f.col] === f.val),
      );
    }
  }

  return {
    from(table: string) {
      return new ChainBuilder(table);
    },
  };
}

export const mockCreateClient = vi.fn(() => buildClient());
