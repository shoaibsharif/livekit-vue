import type { Observable } from "rxjs";
import { getCurrentScope, onScopeDispose, ref } from "vue";

/**@internal */
export function useObservableState<T>(
  observable: Observable<T> | undefined,
  startWith: T
) {
  const state = ref<T>(startWith);

  let subscription = observable.subscribe((value) => {
    state.value = value;
  });

  if (getCurrentScope()) {
    onScopeDispose(() => {
      subscription.unsubscribe();
    });
  }

  return state;
}
