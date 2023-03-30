/** Generic */
type KeyOfComponent<TComponent> = keyof Omit<TComponent, keyof HTMLElement>;

type ObservedAttributesMapping<TComponent extends HTMLElement> = {
  [key: string]: KeyOfComponent<TComponent>;
};

type PropertiesEventTypeMapping<TComponent extends HTMLElement> = {
  [key in KeyOfComponent<TComponent>]?: string;
};

interface IWebComponent {
  connectedCallback(): void;
  adoptedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(
    attribute: string,
    previousValue: any,
    currentValue: any
  ): void;
}

interface ChangeEventArgs<T = any> {
  property: string;
  value: T;
}

const functionType = typeof function () {};
const stringType = typeof "";

type EventHandler<T = any> = (evt: CustomEvent<T>) => void;

const noop: EventHandler = (evt: CustomEvent): void => {};
/** */

import { Emit } from "./decorators/emit";

const customComponentTag = "custom-component";

const observedAttributesMapping: ObservedAttributesMapping<CustomComponent> = {
  "matching-attribute": "ownProp",
  "other-attr": "otherProp",
  "on-change": "onChange",
};

const propertiesEventTypeMapping: PropertiesEventTypeMapping<CustomComponent> =
  {
    onChange: "propertyChanged",
  };
export class CustomComponent extends HTMLElement implements IWebComponent {
  static get tag(): string {
    return customComponentTag;
  }
  static define(): void {
    customElements.define(CustomComponent.tag, CustomComponent);
  }
  static get observedAttributes(): Array<string> {
    return Object.keys(observedAttributesMapping);
  }
  private root: ShadowRoot;
  @Emit()
  ownProp: string = "";

  private _otherProp: string = "";
  @Emit()
  set otherProp(value: string) {
    this._otherProp = value;
  }
  get otherProp(): string {
    return this._otherProp;
  }
  onChange: EventHandler<ChangeEventArgs> = noop;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "closed" }); // keeps track of the shadowRoot even if its closed
  }
  adoptedCallback(): void {}
  connectedCallback(): void {
    if (!this.root.isConnected) {
      return;
    }
  }
  disconnectedCallback(): void {
    Object.entries(propertiesEventTypeMapping).forEach(
      ([property, eventType]) => {
        const listener = this[
          property as KeyOfComponent<CustomComponent>
        ] as EventListener;
        if (!!listener && listener !== noop) {
          this.removeEventListener(eventType, listener);
        }
      }
    );
  }
  attributeChangedCallback(
    attribute: string,
    previousValue: any,
    currentValue: any
  ): void {
    if (previousValue === currentValue) return;
    const property = observedAttributesMapping[attribute];
    if (!property) {
      console.warn(`Unable to map attribute '${attribute}' to a property.`);
      return;
    }
    if (typeof this[property] === functionType) {
      // event handler
      const eventType = propertiesEventTypeMapping[property];
      if (!eventType) {
        console.warn(`Unable to map property '${attribute}' to an event type.`);
        return;
      }
      if (!currentValue) {
        currentValue = noop;
      }
      if (this[property] === currentValue) {
        return;
      }
      if (this[property] !== noop) {
        this.removeEventListener(eventType, this[property] as EventListener);
      }
      if (typeof currentValue !== functionType) {
        if (typeof currentValue !== stringType) {
          console.warn(``);
          return;
        }
        currentValue = eval(currentValue).bind(this);
      }
      this[property] = currentValue;
      this.addEventListener(eventType, this[property] as EventListener);
      return;
    }
    if (this[property] !== currentValue) {
      this[property] = currentValue;
    }
  }
}

customElements.define(customComponentTag, CustomComponent);
