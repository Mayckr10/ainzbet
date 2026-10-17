import { useSyncExternalStore } from "react";

export type Route =
  | { name: "lobby"; bonus?: boolean }
  | { name: "game"; id: string }
  | { name: "store" }
  | { name: "ranking" }
  | { name: "profile" }
  | { name: "settings" }
  | { name: "fair" };

let stack: Route[] = [{ name: "lobby" }];
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const nav = {
  push(r: Route) {
    if (r.name === "lobby") stack = [r];
    else stack = [...stack, r];
    emit();
  },
  replace(r: Route) {
    stack = [...stack.slice(0, -1), r];
    emit();
  },
  back() {
    if (stack.length > 1) stack = stack.slice(0, -1);
    emit();
  },
  get current() {
    return stack[stack.length - 1];
  },
  get depth() {
    return stack.length;
  },
};

export function useRoute() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => stack[stack.length - 1],
  );
}
