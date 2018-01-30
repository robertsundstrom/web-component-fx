// tslint:disable-next-line:ban-types
export function noView(constructor: Function) {
    constructor.noView = true;
}

export function bindable(target: any, key: string) {
    if (!target.constructor.bindable) {
        target.constructor.bindable = [];
    }
    const matches = key.split(/(?=[A-Z])/);
    if (matches && matches.length > 0) {
        const k = matches.map((x) => x.toLocaleLowerCase()).join("-");
        target.constructor.bindable.push(k);
    }
}

export function readonly(
    target: any,
    key: string,
    descriptor: PropertyDescriptor,
) {
    descriptor.writable = false;
    return descriptor;
}
