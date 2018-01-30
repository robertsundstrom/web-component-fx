import * as capitalize from "capitalize";
import "reflect-metadata";
import * as parser from "vdom-parser";
import * as diff from "virtual-dom/diff";

const nodeCache = document.body;
const vdomCache = parser(nodeCache);

// tslint:disable-next-line:ban-types
export function noView(constructor: Function) {
  constructor.noView = {};
}

export function bindable(target: any, key: string) {
  if (!target.constructor.bindable) {
    target.constructor.bindable = [];
  }
  target.constructor.bindable.push(key);
}

export function readonly(
  target: any,
  key: string,
  descriptor: PropertyDescriptor,
) {
  descriptor.writable = false;
  return descriptor;
}

export function convertValue(target: any, prop: string, val: any) {
  const bindablePropType = Reflect.getMetadata("design:type", target, prop);
  if (bindablePropType === Number) {
    let convertedValue = parseFloat(val);
    if (isNaN(val)) {
      convertedValue = parseInt(val, 10);
    }
    val = convertedValue;
    if (isNaN(val)) {
        throw new Error("Expected number value");
    }
  } else if (bindablePropType === Boolean) {
    if (val === "true" || val === "false") {
        val = val === "true";
    } else {
        throw new Error("Expected boolean value");
    }
  }
  return val;
}

function createElementFromHTML(htmlString: string) {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
  }

export async function defineHTMLElement(viewModelConstructor: any): any {
  const className = viewModelConstructor.name as string;
  const elementName = className
    .split(/(?=[A-Z])/)
    .join("-")
    .toLowerCase();

  const viewModel = new viewModelConstructor();

  class ComponentElement extends HTMLElement {
    constructor() {
      super();
      viewModel.element = this;
    }

    private connectedCallback() {
      const onMounted = viewModel.onMounted;
      if (onMounted) {
        onMounted.bind(viewModel)();
      }

      let render = viewModel.render;
      if (!viewModelConstructor.noView && !render) {
        render = async () => {
            const result = await import("./my-counter.html");
            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.appendChild(createElementFromHTML(result).content.cloneNode(true));
        };
      } else {
          throw "No view found";
      }
      render.bind(viewModel)();
    }

    private disconnectedCallback() {
      const onUnmounted = viewModel.onUnmounted;
      if (onUnmounted) {
        onUnmounted.bind(viewModel)();
      }
    }

    private attributeChangedCallback(
      attrName: string,
      oldVal: any,
      newVal: any,
    ) {
      newVal = convertValue(viewModel, attrName, newVal);
      const onPropertyChanged = viewModel.onPropertyChanged;
      if (onPropertyChanged) {
        onPropertyChanged.bind(viewModel)(attrName, oldVal, newVal);
      }
      let key = attrName
        .split("-")
        .map(capitalize)
        .join("");
      key = `on${key}Changed`;
      const propertyChanged = viewModel[key];
      if (propertyChanged) {
        propertyChanged.bind(viewModel)(attrName, oldVal, newVal);
      }
    }
  }

  /*
    const viewModelProxy = new Proxy(viewModel, {
        get: (target, p, receiver) => {
            console.log(target, p)
        },
        set: (target, p, value, receiver) => {
            console.log(target, p)
            return true;
        }
    });

    var x = viewModelProxy.count;

    viewModel.increase();
    */

  if (
    viewModelConstructor.bindable &&
    viewModelConstructor.bindable.length > 0
  ) {
    Object.defineProperty(ComponentElement, "observedAttributes", {
      get: () => viewModelConstructor.bindable,
    });
  }

  for (const bindableProp of viewModelConstructor.bindable) {
    const descriptor = Object.getOwnPropertyDescriptor(viewModel, bindableProp);
    if (descriptor) {
      console.log(descriptor);

      if (descriptor.writable) {
        Object.defineProperty(ComponentElement.prototype, bindableProp, {
          get() {
            return this.hasAttribute(bindableProp);
          },
          set(val) {
            viewModel.bindableProp = val;
            const isChecked = Boolean(val);
            if (isChecked) {
                this.setAttribute(bindableProp, "");
            }
            if (val) {
              this.setAttribute(bindableProp, val);
            } else {
              this.removeAttribute(bindableProp);
            }
          },
        });
      } else {
        Object.defineProperty(ComponentElement.prototype, bindableProp, {
          get() {
            return this.hasAttribute(bindableProp);
          },
        });
      }
    }
  }

  customElements.define(elementName, ComponentElement);

  return ComponentElement;
}
