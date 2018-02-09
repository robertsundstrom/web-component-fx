import "reflect-metadata";
import parser from "vdom-parser";
import createElement from "virtual-dom/create-element";
import diff from "virtual-dom/diff";
import patch from "virtual-dom/patch";
import DependencyTracker from "./observables/dependencyTracker";
import { getObservable, track } from "./observables/tracking";
import { camelCaseToDashCase, dashCaseToCamelCase } from "./strings";
import { convertValue } from "./types";

export async function defineComponent(viewModelConstructor: any): Promise<any> {
  const viewModel = new viewModelConstructor();
  track(viewModel);
  const elementName = getElementName(viewModelConstructor);
  return defineCustomElement(elementName, viewModel);
}

function defineCustomElement(elementName: string, viewModel: any) {
  const subscriptions: any[] = [];

  const Element = class extends HTMLElement {
    // tslint:disable-next-line:variable-name
    public __internal = false;

    constructor() {
      super();
      viewModel.element = this;
      this.model = viewModel;
    }

    private async connectedCallback() {
      await componentConnected(this, viewModel);
      subscribeToBindables(this, viewModel, subscriptions);
      renderView(this, viewModel, subscriptions);
    }

    private async  disconnectedCallback() {
      await componentDisconnected(this, viewModel);
      for (const subscription of subscriptions) {
        subscription.dispose();
      }
    }

    private attributeChangedCallback(
      attrName: string,
      oldVal: any,
      newVal: any,
    ) {
      if (!this.__internal) {
        const prop = dashCaseToCamelCase(attrName);
        const value = convertToPropType(viewModel, prop, newVal);
        viewModel[prop] = value;
      }
    }
  };

  defineProperties(Element, viewModel);
  setObservableAttributes(Element, getConstructor(viewModel));

  customElements.define(elementName, Element);
  return Element;
}

export function convertToPropType(target: any, prop: string, val: any) {
  const propType = Reflect.getMetadata("design:type", target, prop);
  return convertValue(propType, val);
}

function subscribeToBindables(element: HTMLElement, viewModel: any, subscriptions: any[]) {
  const viewModelConstructor = getConstructor(viewModel);
  for (const bindableProp of viewModelConstructor.bindable) {
    const observable = getObservable(viewModel, bindableProp);
    if (observable) {
      const attrName = camelCaseToDashCase(bindableProp);
      observable.subscribe((newValue) => {
        // TODO: Handle
        element.__internal = true;
        if (typeof newValue === "boolean" && newValue) {
          element.setAttribute(attrName, "");
        } else {
          if (newValue) {
            element.setAttribute(attrName, newValue);
          } else {
            element.removeAttribute(attrName);
          }
        }
        element.__internal = false;
      });
    }
  }
}

function defineProperties(elementConstructor: any, viewModel: any) {
  const viewModelConstructor = getConstructor(viewModel);
  for (const bindableProp of viewModelConstructor.bindable) {
    const descriptor = Object.getOwnPropertyDescriptor(viewModel, bindableProp);
    if (descriptor) {
      if (descriptor.set) {
        Object.defineProperty(elementConstructor.prototype, bindableProp, {
          get() {
            return viewModel[bindableProp];
          },
          set(val) {
            this.__internal = false;
            const attrName = dashCaseToCamelCase(bindableProp);
            if (typeof val === "boolean" && val) {
              this.setAttribute(attrName, "");
            } else {
              if (val) {
                this.setAttribute(attrName, val);
              } else {
                this.removeAttribute(attrName);
              }
            }
            viewModel[bindableProp] = val;
            this.__internal = false;
          },
        });
      } else {
        Object.defineProperty(elementConstructor.prototype, bindableProp, {
          get() {
            return this.hasAttribute(bindableProp);
          },
        });
      }
    }
  }
}

async function componentConnected(element: HTMLElement, viewModel: any) {
  const onMounted = viewModel.onMounted;
  if (onMounted) {
    await onMounted.bind(viewModel)();
  }
}

async function componentDisconnected(element: HTMLElement, viewModel: any) {
  const onUnmounted = viewModel.onUnmounted;
  if (onUnmounted) {
    await onUnmounted.bind(viewModel)();
  }
}

async function renderView(element: HTMLElement, viewModel: any, subscriptions: any[]) {
  let render = viewModel.render;
  if (render) {
    render = render.bind(viewModel);
    let tree: any = null!;
    let rootNode: HTMLElement = null!;
    DependencyTracker.begin((s) => {
      const subscription = s.subscribe(async () => {
        const newTree = await render();
        const patches = diff(tree, newTree);
        rootNode = patch(rootNode, patches) as HTMLElement;
        // const x = rootNode.querySelectorAll;("*count)^=""]");
        // console.log(x);
        tree = rootNode;
      });
      subscriptions.push(subscription);
    });
    tree = await render();
    rootNode = createElement(tree) as HTMLElement;
    DependencyTracker.end();
    const shadowRoot = element.attachShadow({ mode: "open" });
    shadowRoot.appendChild(rootNode);
  }
}

function setObservableAttributes(element: any, viewModelConstructor: any) {
  if (
    viewModelConstructor.bindable &&
    viewModelConstructor.bindable.length > 0
  ) {
    Object.defineProperty(element, "observedAttributes", {
      get: () => viewModelConstructor.bindable,
    });
  }
}

function getElementName(viewModelConstructor: any) {
  const className = viewModelConstructor.name as string;
  return camelCaseToDashCase(className);
}

function getConstructor(obj: any) {
  return obj.__proto__.constructor;
}
