import Subscribable from "./subscribable";

interface DependencyFrame {
	onDependencyDetected: (subscribable: Subscribable<any>) => void;
	parent: DependencyFrame;
}

export default class DependencyTracker {
	private static frame: DependencyFrame = undefined!;

	public static begin(onDetected: (subscribable: Subscribable<any>) => void): void {
		DependencyTracker.frame = {
			onDependencyDetected: onDetected,
			parent: DependencyTracker.frame,
		};
	}

	public static end(): void {
		DependencyTracker.frame = DependencyTracker.frame.parent;
	}

	static get isTracking() {
		return DependencyTracker.frame !== undefined;
	}

	public static registerDependency(subscribable: Subscribable<any>): void {
		DependencyTracker.frame.onDependencyDetected(subscribable);
	}
}
