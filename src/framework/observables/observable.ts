import DependencyTracker from "./dependencyTracker";
import Subscribable from "./subscribable";

export default class Observable<T> {
    private value: T;
    private listeners: Array<(oldValue: T, newValue: T) => void>;

    constructor(value?: T) {
        this.value = value!;
        this.listeners = [];
    }

    public get() {
        if (DependencyTracker.isTracking) {
            DependencyTracker.registerDependency(this);
        }
        return this.value;
    }

    public set(value: T, notify: boolean = true) {
        if (this.value !== value) {
            const oldValue = this.value;
            this.value = value;
            if (notify) {
                for (const listener of this.listeners) {
                    listener(oldValue, value);
                }
            }
        }
    }

    public notifyAll() {
        for (const listener of this.listeners) {
            listener(this.value, this.value);
        }
    }

    public subscribe(listener: (oldValue: T, newValue: T) => void): { dispose(): void } {
        this.listeners.push(listener);
        return {
            dispose: () => {
                return {
                    dispose: () => {
                        this.listeners.slice(this.listeners.indexOf(listener), 0);
                    },
                };
            },
        };
    }
}
