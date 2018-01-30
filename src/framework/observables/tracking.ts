import Observable from "./observable";
import ObservableArray from "./observableArray";

export function isTracked(obj: any) {
    return obj.__OBSERVABLES__ !== undefined;
}

export function track(obj: any) {
    // Abort if primitive
    const __OBSERVABLES__: { [key: string]: any } = {};
    for (const prop of Object.getOwnPropertyNames(obj)) {
        const propValue = obj[prop];
        if (propValue instanceof Array) {
            __OBSERVABLES__[prop] = new ObservableArray(propValue);
            Object.defineProperty(obj, prop, {
                enumerable: true,
                get: () => {
                    return __OBSERVABLES__[prop];
                },
                set: (newValue) => {
                    __OBSERVABLES__[prop].set(newValue);
                },
            });
        } else {
            __OBSERVABLES__[prop] = new Observable(propValue);
            Object.defineProperty(obj, prop, {
                enumerable: true,
                get: () => {
                    return __OBSERVABLES__[prop].get();
                },
                set: (newValue) => {
                    __OBSERVABLES__[prop].set(newValue);
                },
            });
        }
    }
    if (obj.__OBSERVABLES__ === undefined) {
        Object.defineProperty(obj, "__OBSERVABLES__", {
            enumerable: false,
            get: () => {
                return __OBSERVABLES__;
            },
        });
    }
}

export function getObservable<T>(obj: any, prop: string) {
    return obj.__OBSERVABLES__[prop] as Observable<T>;
}
