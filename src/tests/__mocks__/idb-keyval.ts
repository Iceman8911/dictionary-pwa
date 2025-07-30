// Mock the idb-keyval library
import { vi } from "vitest";

export const set = vi.fn();
export const get = vi.fn();
export const del = vi.fn();
export const clear = vi.fn();
export const keys = vi.fn();
export const update = vi.fn();
