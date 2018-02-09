import h from "virtual-dom/h";
import { bindable } from "./Framework";

export default class MyContainer {
    @bindable
    public count: number = 0;

    public render() {
        return <my-counter count={this.count}></my-counter>;
    }
}
