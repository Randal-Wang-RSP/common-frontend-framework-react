// Re-export Zustand primitives for use in feature model files.
// Feature stores: create in features/<name>/model/use<Name>Store.ts
export { create } from "zustand"
export type { StateCreator, StoreApi, UseBoundStore } from "zustand"
