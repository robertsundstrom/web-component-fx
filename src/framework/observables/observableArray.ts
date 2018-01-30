import DependencyTracker from "./dependencyTracker";
import Subscribable from "./subscribable";
import { isTracked, track } from "./tracking";

export default class ObservableArray<T> {
    private items: T[];
    private listeners: Array<(addedItems: number[], removedItems: number[]) => void>;

    constructor(value?: T[]) {
        this.items = value || [];
        this.listeners = [];
    }

    public push(item: T) {
        if (!isTracked(item)) {
            track(item);
        }
        const result = this.items.push(item);
        const index = this.items.length;
        for (const listener of this.listeners) {
            listener([length], []);
        }
        return result;
    }

    public remove(item: T) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            for (const listener of this.listeners) {
                listener([], [index]);
            }
            return true;
        }
        return false;
    }

    public get() {
        if (DependencyTracker.isTracking) {
            DependencyTracker.registerDependency(this);
        }
        return this.items;
    }

    public set(value: T[]) {
        this.items = value;
    }

    public notifyAll() {
        
    }

    public subscribe(listener: (addedItems: number[], removedItems: number[]) => void): { dispose(): void; } {
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
