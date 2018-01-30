import h from "virtual-dom/h";
import { bindable } from "./Framework";

export default class MyCounter {
    @bindable
    public count: number = 0;

    @bindable
    public visible: boolean = false;

    @bindable
    public fooBar: string = "";

    private element!: Element;
    private timer = 0;

    public increase() {
        this.count++;
    }

    public render() {
        return <div>{this.count}</div>;
    }

    private onMounted() {
        console.log("Mounted");
        console.log(this);
        this.timer = setInterval(() => {
            this.count++;
        }, 1000);
    }

    private onPropertyChange(prop: string, oldVal: any, newVal: any) {
        console.log(prop, oldVal, newVal);
        if (prop === "visible") {
            return false;
        }
    }

    private onCountChanged(prop: string, oldVal: any, newVal: any) {
        console.log(newVal);
    }

    private onUnmounted() {
        console.log("Unmounted");
        clearInterval(this.timer);
    }
}
