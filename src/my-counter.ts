import { bindable } from "./Framework";

export default class MyCounter {
    @bindable
    public count: number = 0;
    @bindable
    public visible = false;

    private element: Element;

    private increase() {
        this.count++;
    }

    private onMounted() {
        console.log("Mounted");
        console.log(this);
    }

    private onPropertyChanged(prop: string, oldVal: any, newVal: any) {
        console.log(prop, oldVal, newVal);
    }

    private onCountChanged(prop: string, oldVal: any, newVal: any) {
        console.log(newVal);
    }

    private onUnmounted() {
        console.log("Unmounted");
    }
}
